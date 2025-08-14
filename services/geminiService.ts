// services/geminiService.ts
import { getFunctions, httpsCallable } from "firebase/functions";
import { signInAnonymously } from "firebase/auth";
import app, { auth } from "@/services/firebase";
import { PROMPT_EXTRACT } from "@/constants";
import type { ClassNewsletterSchema } from "@/types";

/** 文字列/コードブロックでも安全に JSON 化 */
function safeJson(input: any): any {
  if (!input) return {};
  if (typeof input === "object") return input;
  if (typeof input !== "string") return {};
  try {
    const clean = input.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {};
  }
}

/** ユニークID */
function uid(prefix: string) {
  try { return `${prefix}-${crypto.randomUUID()}`; }
  catch { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }
}

/** Gemini の揺れる出力を “必ず” 同じ形にする */
function normalizeGeminiResponse(raw: any): {
  title: string;
  summary: string;
  todos: Array<{ id: string; title: string; dueDate?: string|null; priority: string; completed: boolean }>;
  events: Array<{ id: string; title: string; date?: string|null; time?: string|null; location?: string|null; description?: string|null }>;
  notices: Array<{ id: string; title: string; content: string; importance: string }>;
} {
  const d = safeJson(raw);

  // タイトル/概要（別名も吸収）
  const title =
    d.title ??
    d.header?.title ??
    d.headline ??
    d.newsletterTitle ??
    "おたより";
  const summary =
    d.summary ??
    d.overview ??
    d.excerpt ??
    d.body ??
    "内容を分析しました";

  // TODO（todos / todo / tasks / actions などを吸収）
  const todoSources =
    (Array.isArray(d.todos) && d.todos) ||
    (Array.isArray(d.todo) && d.todo) ||
    (Array.isArray(d.tasks) && d.tasks) ||
    (Array.isArray(d.actions) && d.actions) ||
    [];
  const todos = todoSources
    .map((t: any) => {
      const title =
        t?.title ??
        t?.task ??
        t?.event_name ??
        (typeof t === "string" ? t : "要確認");
      const dueDate = t?.deadline ?? t?.due_date ?? t?.event_date ?? null;
      const priority = t?.priority ?? t?.importance ?? "medium";
      const completed = !!(t?.completed ?? t?.done);
      return { id: uid("todo"), title, dueDate, priority, completed };
    })
    .filter((t: any) => t.title && typeof t.title === "string");

  // イベント
  const eventsSrc = Array.isArray(d.events) ? d.events : [];
  const events = eventsSrc.map((e: any) => ({
    id: uid("event"),
    title: e?.title ?? e?.event_name ?? "予定",
    date: e?.date ?? e?.event_date ?? null,
    time: e?.time ?? null,
    location: e?.location ?? null,
    description: e?.description ?? e?.content ?? null,
  }));

  // お知らせ
  const noticesSrc = Array.isArray(d.notices) ? d.notices : [];
  const notices = noticesSrc.map((n: any) => ({
    id: uid("notice"),
    title: n?.title ?? "お知らせ",
    content: n?.content ?? n?.summary ?? n?.description ?? "",
    importance: n?.importance ?? "normal",
  }));

  return { title, summary, todos, events, notices };
}

export const extractClassNewsletterData = async (
  rawText: string
): Promise<ClassNewsletterSchema> => {
  console.log("=== Gemini Service Start ===");

  // 仕様：未ログインでも体験OK → 匿名サインイン
  if (!auth.currentUser) {
    await signInAnonymously(auth);
    console.log("Signed in anonymously:", auth.currentUser?.uid);
  } else {
    const u = auth.currentUser!;
    console.log("User status:", u.isAnonymous ? `anonymous (${u.uid})` : `logged in as ${u.uid}`);
  }

  console.log("Raw text length:", rawText.length);

  // Functions のリージョンと一致
  const functions = getFunctions(app, "us-central1");
  const callGeminiApi = httpsCallable(functions, "callGeminiApi");

  console.log("Calling Firebase Callable Function...");
  const res: any = await callGeminiApi({
    prompt: `${PROMPT_EXTRACT}\n\n本文：\n"""\n${rawText}\n"""`,
  });
  console.log("Firebase Function result:", res);

  const raw = res?.data?.result ?? res?.data ?? {};
  const normalized = normalizeGeminiResponse(raw);
  console.log("Normalized extract:", normalized);

  // types.ts の構造差異があっても通るように一旦キャスト
  return normalized as unknown as ClassNewsletterSchema;
};
