// services/geminiService.ts
import { getFunctions, httpsCallable } from "firebase/functions";
import { signInAnonymously } from "firebase/auth";
import app, { auth } from "@/services/firebase";
import { PROMPT_EXTRACT } from "@/constants";
import type {
  ClassNewsletterSchema,
  ClassNewsletterHeader,
  NewsletterAction,
  NewsletterInfo,
  ActionConfidence,
  RepeatRule,
} from "@/types";

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

/** ID 生成（fallback あり） */
function uid(prefix: string) {
  try {
    return `${prefix}-${crypto.randomUUID()}`;
  } catch {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

function toConfidence(partial?: Partial<ActionConfidence>): ActionConfidence {
  return {
    date: partial?.date ?? 0.7,
    due: partial?.due ?? 0.7,
    items: partial?.items ?? 0.7,
  };
}

function toRepeatRule(src: any): RepeatRule | null {
  if (!src) return null;
  const byDay = src.byDay ?? src.by_day ?? src.days ?? null;
  const time = src.time ?? null;
  if (!Array.isArray(byDay) || !time) return null;
  return { byDay, time };
}

/* =========================
   追加：デデュープ & フィルタ
   ========================= */

/** 比較用キー正規化（大小・空白・句読点等を無視） */
function normKey(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[、。,.!！？（）()［\[\]【】・/／\\-]/g, "");
}

/** 重複排除＋ノイズ除去（同名は情報量が多い方を採用） */
function dedupeActions(actions: NewsletterAction[]): NewsletterAction[] {
  const out: NewsletterAction[] = [];
  const seenAmbiguousTodo = new Set<string>(); // 曖昧TODOの連発防止

  for (const a of actions) {
    const key = normKey(a.event_name);
    if (!key) continue;

    // 短すぎる/意味が薄いタイトルは除外（例: 「練習」「がい」だけ等）
    if (a.event_name.trim().length < 3) continue;

    // 既に同名がある→情報量（date/due/items数）で勝負
    const idx = out.findIndex(x => normKey(x.event_name) === key);
    if (idx >= 0) {
      const cur = out[idx];
      const curScore =
        (cur.event_date ? 1 : 0) + (cur.due_date ? 1 : 0) + (cur.items?.length || 0);
      const newScore =
        (a.event_date ? 1 : 0) + (a.due_date ? 1 : 0) + (a.items?.length || 0);
      if (newScore > curScore) out[idx] = a;
      continue;
    }

    // 具体性シグナルが何も無い TODO は最大1件までに抑制
    const hasSignal = !!(
      a.event_date ||
      a.due_date ||
      (a.items && a.items.length) ||
      a.fee ||
      a.notes
    );
    if (!hasSignal && a.type === "todo") {
      if (seenAmbiguousTodo.has("ambiguous")) continue;
      seenAmbiguousTodo.add("ambiguous");
    }

    out.push(a);
  }
  return out;
}

/** 同名の event/todo が並存する場合は「日付のある event」を優先 */
function preferEventOverTodo(actions: NewsletterAction[]): NewsletterAction[] {
  const byName = new Map<string, NewsletterAction>();
  for (const a of actions) {
    const k = normKey(a.event_name);
    const prev = byName.get(k);
    if (!prev) {
      byName.set(k, a);
      continue;
    }
    const prevIsEvent = prev.type === "event" && !!prev.event_date;
    const curIsEvent = a.type === "event" && !!a.event_date;
    if (curIsEvent && !prevIsEvent) byName.set(k, a);
  }
  return Array.from(byName.values());
}

/** 並び順：日付/締切が近い順 → 種別(event→todo) → 名称 */
function sortActions(actions: NewsletterAction[]): NewsletterAction[] {
  return actions.slice().sort((a, b) => {
    const ad = a.event_date || a.due_date || "9999-12-31";
    const bd = b.event_date || b.due_date || "9999-12-31";
    if (ad !== bd) return ad.localeCompare(bd);
    if (a.type !== b.type) return a.type === "event" ? -1 : 1;
    return a.event_name.localeCompare(b.event_name);
  });
}

/** “新/旧/自由記述” どれでも → 既存スキーマ(ClassNewsletterSchema)に正規化 */
function normalizeToLegacySchema(raw: any): ClassNewsletterSchema {
  const d = safeJson(raw);

  // ---- header ----
  const issueDate: string | null =
    d.header?.issue_date ?? d.meta?.date ?? d.date ?? null;

  const header: ClassNewsletterHeader = {
    title: d.header?.title ?? d.title ?? d.headline ?? d.newsletterTitle ?? null,
    class_name: d.header?.class_name ?? d.class_name ?? null,
    school_name: d.header?.school_name ?? d.school_name ?? null,
    issue_month: d.header?.issue_month ?? (issueDate ? issueDate.slice(0, 7) : null),
    issue_date: issueDate,
  };

  // ---- overview / key_points ----
  const overview: string =
    d.overview ?? d.summary ?? d.excerpt ?? d.body ?? "内容を分析しました";

  const key_points: string[] = Array.isArray(d.key_points)
    ? d.key_points.filter((p: any) => typeof p === "string")
    : [];

  // ---- actions（todo / event を NewsletterAction へ） ----
  const srcTodos =
    (Array.isArray(d.todos) && d.todos) ||
    (Array.isArray(d.tasks) && d.tasks) ||
    (Array.isArray(d.actions) && d.actions) ||
    [];

  const srcEvents =
    (Array.isArray(d.events) && d.events) ||
    (Array.isArray(d.actions) && d.actions) ||
    [];

  const fromTodo = (t: any): NewsletterAction => ({
    type: "todo",
    event_name:
      t?.title ?? t?.task ?? t?.event_name ?? (typeof t === "string" ? t : "要確認"),
    is_continuation: !!t?.is_continuation,
    event_date: t?.event_date ?? null,
    due_date: t?.dueDate ?? t?.deadline ?? t?.due_date ?? null,
    items: Array.isArray(t?.items) ? t.items : [],
    fee: t?.fee ?? null,
    repeat_rule: toRepeatRule(t?.repeat_rule),
    audience: t?.audience ?? null,
    importance: (t?.priority ?? t?.importance ?? "medium") as
      | "high"
      | "medium"
      | "low",
    action_required: true,
    notes: t?.notes ?? null,
    confidence: toConfidence(t?.confidence),
  });

  const fromEvent = (e: any): NewsletterAction => ({
    type: "event",
    event_name: e?.title ?? e?.event_name ?? "予定",
    is_continuation: !!e?.is_continuation,
    event_date: e?.date ?? e?.event_date ?? null,
    due_date: e?.due_date ?? null,
    items: Array.isArray(e?.items) ? e.items : [],
    fee: e?.fee ?? null,
    repeat_rule: toRepeatRule(e?.repeat_rule),
    audience: e?.audience ?? null,
    importance: (e?.priority ?? e?.importance ?? "medium") as
      | "high"
      | "medium"
      | "low",
    action_required: true,
    notes: e?.description ?? e?.notes ?? null,
    confidence: toConfidence(e?.confidence),
  });

  // すでに旧スキーマっぽい action が来ている場合はそのまま使いつつデフォルト補完
  const passThroughActions: NewsletterAction[] = Array.isArray(d.actions)
    ? d.actions
        .filter(
          (a: any) => a && typeof a === "object" && typeof a.event_name === "string",
        )
        .map((a: any) => ({
          type: a.type === "event" || a.type === "todo" ? a.type : "todo",
          event_name: a.event_name,
          is_continuation: !!a.is_continuation,
          event_date: a.event_date ?? null,
          due_date: a.due_date ?? null,
          items: Array.isArray(a.items) ? a.items : [],
          fee: a.fee ?? null,
          repeat_rule: toRepeatRule(a.repeat_rule),
          audience: a.audience ?? null,
          importance: (a.importance ?? "medium") as "high" | "medium" | "low",
          action_required: true,
          notes: a.notes ?? null,
          confidence: toConfidence(a.confidence),
        }))
    : [];

  let actions: NewsletterAction[] = [
    ...passThroughActions,
    ...srcTodos.filter((t: any) => !t?.event_name).map(fromTodo),
    ...srcEvents.filter((e: any) => e?.title || e?.event_name).map(fromEvent),
  ];

  // ---- infos（notices/infos を NewsletterInfo へ）----
  const infosSrc =
    (Array.isArray(d.infos) && d.infos) ||
    (Array.isArray(d.notices) && d.notices) ||
    [];

  const infos: NewsletterInfo[] = infosSrc.map((n: any) => ({
    title: n?.title ?? "お知らせ",
    summary: n?.summary ?? n?.content ?? n?.description ?? "",
    audience: n?.audience ?? null,
  }));

  /* ===== ここから後処理（重複・競合解消・並び） ===== */
  actions = dedupeActions(actions);
  actions = preferEventOverTodo(actions);
  actions = sortActions(actions);

  return { header, overview, key_points, actions, infos };
}

export const extractClassNewsletterData = async (
  rawText: string,
): Promise<ClassNewsletterSchema> => {
  console.log("=== Gemini Service Start ===");

  // 仕様：未ログイン体験OK → 匿名サインイン
  if (!auth.currentUser) {
    await signInAnonymously(auth);
    console.log("Signed in anonymously:", auth.currentUser?.uid);
  } else {
    const u = auth.currentUser!;
    console.log(
      "User status:",
      u.isAnonymous ? `anonymous (${u.uid})` : `logged in as ${u.uid}`,
    );
  }

  console.log("Raw text length:", rawText.length);

  // Functions 側のリージョンに合わせる
  const functions = getFunctions(app, "us-central1");
  const callGeminiApi = httpsCallable(functions, "callGeminiApi");

  console.log("Calling Firebase Callable Function...");
  const res: any = await callGeminiApi({
    // 返却形式の揺れは正規化で吸収
    prompt: `${PROMPT_EXTRACT}\n\n本文：\n"""\n${rawText}\n"""`,
  });

  console.log("Firebase Function result:", res);

  const raw = res?.data?.result ?? res?.data ?? {};
  const normalized = normalizeToLegacySchema(raw);
  console.log("Normalized (legacy schema):", normalized);

  return normalized; // 既存の ClassNewsletterSchema で返す
};
