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
   追加：タイトル推測ロジック
   ========================= */
/** 原文から見出し候補を推測（先頭〜5行・「◯◯だより/お知らせ」を優先。無ければ最初の一文） */
// 追加ユーティリティ（ファイル上部のユーティリティ群の下に置く）
function monthLabel(issueMonth?: string | null, issueDate?: string | null) {
  const ym = issueMonth ?? (issueDate ? issueDate.slice(0, 7) : null);
  if (!ym) return null;
  const [, m] = ym.split("-");
  const n = Number(m);
  return n >= 1 && n <= 12 ? `${n}月号` : null;
}

function jpRatio(s: string) {
  const jp = (s.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々ー]/gu) || []).length;
  return jp / Math.max(1, s.length);
}

function cleanLine(s: string) {
  return s
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(/[^\p{Letter}\p{Number}\s々ー・、。\-]/gu, "") // 変な記号を除去
    .replace(/\s*(、|。)+\s*$/u, "")
    .trim();
}

/* =========================
   追加：アクションのデデュープ等（任意だが入れておくと安定）
   ========================= */
function normKey(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[、。,.!！？（）()［\[\]【】・/／\\-]/g, "");
}
function dedupeActions(actions: NewsletterAction[]): NewsletterAction[] {
  const out: NewsletterAction[] = [];
  const seenAmbiguousTodo = new Set<string>();

  for (const a of actions) {
    const key = normKey(a.event_name);
    if (!key) continue;
    if (a.event_name.trim().length < 3) continue;

    const idx = out.findIndex((x) => normKey(x.event_name) === key);
    if (idx >= 0) {
      const cur = out[idx];
      const curScore =
        (cur.event_date ? 1 : 0) + (cur.due_date ? 1 : 0) + (cur.items?.length || 0);
      const newScore =
        (a.event_date ? 1 : 0) + (a.due_date ? 1 : 0) + (a.items?.length || 0);
      if (newScore > curScore) out[idx] = a;
      continue;
    }

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
function normalizeToLegacySchema(raw: any, rawText?: string): ClassNewsletterSchema {
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

  // ——— タイトル品質判定/補助 ———
  function hasMonth(s?: string | null) {
    if (!s) return false;
    return /(?:\b|\D)([0-9１２３４５６７８９]{1,2})\s*月(?![曜])/.test(s);
  }
  function hasNewsletterWord(s?: string | null) {
    if (!s) return false;
    return /(だより|便り|お知らせ|通信|レター)/u.test(s);
  }
  function isTooGenericTitle(s?: string | null) {
    if (!s) return true;
    const t = s.trim();
    // 「園だより」「学年だより」など月なしの汎用名は弱い
    return (
      t.length < 3 ||
      (/^(園|学年|学級|クラス)?(だより|便り|お知らせ)$/u.test(t) && !hasMonth(t))
    );
  }

  // OCR から月ヒントを取る（issue_month 等がない場合の保険）
  function detectMonthFromText(rawText?: string) {
    if (!rawText) return null;
    const lines = rawText.split(/\r?\n/).slice(0, 20).join(" ");
    const m = lines.match(/([0-9１２３４５６７８９]{1,2})\s*月/);
    return m ? m[1].replace(/[^\d]/g, "") + "月" : null; // "4月" 等
  }

  // 先の collectRawTitleCandidates がある前提。なければ前回の実装を流用してください。



  // —— 汎用タイトル抽出ユーティリティ ——

  // 行の正規化（既存 cleanLine があればそれを使用してOK。無ければこのまま）
  function cleanLine(s: string) {
    return s
      .normalize("NFKC")
      .replace(/[ \t　]+/g, " ")
      .replace(/[^\p{Letter}\p{Number}\s々ー・、。\-]/gu, "")
      .replace(/\s*(、|。)+\s*$/u, "")
      .trim();
  }

  function jpRatio(s: string) {
    const jp = (s.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々ー]/gu) || []).length;
    return jp / Math.max(1, s.length);
  }

  // 文っぽい行（説明文）は減点対象
  function looksSentenceLike(s: string) {
    if (s.length >= 26) return true;
    if (/[。.!?？！]$/.test(s)) return true;
    if (/(です|ます|でした|だった|しています|されます)$/.test(s)) return true;
    return false;
  }

  // OCRの先頭〜12行＋短い行の連結も候補化（例:「7月」「園だより」→「7月園だより」）
  function collectRawTitleCandidates(rawText?: string): string[] {
    if (!rawText) return [];
    const lines = rawText
      .split(/\r?\n/)
      .map(cleanLine)
      .filter(Boolean)
      .slice(0, 12);

    const cands: string[] = [...lines];

    // collectRawTitleCandidates 内の連結ロジックを強化
    for (let i = 0; i < Math.min(lines.length - 1, 8); i++) {
      const a = lines[i], b = lines[i + 1];
      if (a.length <= 8 && b.length <= 10) {
        cands.push(cleanLine(a + b));
        cands.push(cleanLine(a + " " + b));
      }
      // 2行飛ばしの合成（「4月」「園だより」が1行空くケース）
      if (i + 2 < lines.length) {
        const c = lines[i + 2];
        if (a.length <= 4 && c.length <= 10) {
          cands.push(cleanLine(a + c));
          cands.push(cleanLine(a + " " + c));
        }
      }
    }

    return Array.from(new Set(cands)).filter(Boolean);
  }

  // issue_month / issue_date から「n月」を作る（既存 monthLabel が "n月号" なら号を外す）
  function monthOnly(issueMonth?: string | null, issueDate?: string | null) {
    const ym = issueMonth ?? (issueDate ? issueDate.slice(0, 7) : null);
    if (!ym) return null;
    const n = Number(ym.split("-")[1]);
    return n >= 1 && n <= 12 ? `${n}月` : null;
  }

  // スコアリング（位置・長さ・日本語率・非文章性・月表現・一般語あり）
  function scoreTitle(line: string, indexHint: number, mHint?: string | null) {
    const s = cleanLine(line);
    if (!s) return -999;

    let score = 0;
    // 位置（上ほど強い）
    score += Math.max(0, 10 - indexHint) * 0.8;

    // 長さ（4〜20 文字が理想）
    if (s.length >= 4 && s.length <= 20) score += 2;
    else if (s.length <= 28) score += 0.5;
    else score -= 2;

    // 日本語率
    const jpr = jpRatio(s);
    if (jpr >= 0.8) score += 1.5;
    else if (jpr >= 0.6) score += 0.5;
    else score -= 0.5;

    // 文っぽさは減点
    if (looksSentenceLike(s)) score -= 2;

    // 句読点が少ないほど +0.5
    if (!/[、。]/.test(s)) score += 0.5;

    // 月表現（全角数字も可）
    if (/(?:[0-9１２３４５６７８９]{1,2})\s*月/.test(s)) score += 1;

    // 一般的な語（必須ではない：あれば +1）
    if (/(だより|たより|便り|お知らせ|通信|ニュースレター|レター)/u.test(s)) score += 1;

    // 月ヒントが含まれていれば +0.5
    if (mHint && s.includes(mHint)) score += 0.5;

    return score;
  }

  // 候補群からベストを選ぶ（最低品質しきい値あり）
  function chooseTitleUniversal(cands: string[], mHint?: string | null): string | null {
    let best: { s: string; score: number } | null = null;
    cands.forEach((c, idx) => {
      const sc = scoreTitle(c, idx, mHint);
      if (!best || sc > best.score) best = { s: cleanLine(c), score: sc };
    });
    if (best && best.score >= 2.5 && jpRatio(best.s) >= 0.6) {
      return best.s.slice(0, 24);
    }
    return null;
  }


  // ★ タイトルの強制補完（汎用 & 既存より良ければ置換）
  {
    const mHint =
      monthOnly(header.issue_month, header.issue_date) ||
      detectMonthFromText(rawText); // OCRからも月を拾う

    const rawCands = collectRawTitleCandidates(rawText);
    const extraCands = [
      header.title ?? "",
      header.class_name ? `${header.class_name}だより` : "",
      mHint && header.class_name ? `${mHint} ${header.class_name}だより` : "",
      mHint ? `${mHint} おたより` : "",
    ].filter(Boolean);

    const chosen = chooseTitleUniversal([...rawCands, ...extraCands], mHint);

    const current = header.title;
    const currentIsGeneric = isTooGenericTitle(current);
    const currentHasMonth = hasMonth(current);
    const chosenHasMonth = hasMonth(chosen);

    // 置換ルール：
    // 1) 既存が空 or 汎用なら chosen を採用
    // 2) 既存に月がなく、chosen に月があるなら chosen を採用（←今回の主因を解決）
    // 3) それ以外は既存を維持（ただし安全なフォールバックは維持）
    if (!current || currentIsGeneric || (!currentHasMonth && chosenHasMonth)) {
      header.title = cleanLine(chosen ??
        (header.class_name && mHint ? `${mHint} ${header.class_name}だより` :
        header.class_name ? `${header.class_name}だより` :
        mHint ? `${mHint} おたより` : "おたより")
      );
    } else {
      // 既存を使うが、最低限整形
      header.title = cleanLine(current);
    }
  }




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
    importance: (t?.priority ?? t?.importance ?? "medium") as "high" | "medium" | "low",
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
    importance: (e?.priority ?? e?.importance ?? "medium") as "high" | "medium" | "low",
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

  // 後処理（重複解消・優先度・並び）
  actions = dedupeActions(actions);
  actions = preferEventOverTodo(actions);
  actions = sortActions(actions);

  return { header, overview, key_points, actions, infos };
}

export const extractClassNewsletterData = async (
  rawText: string
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
      u.isAnonymous ? `anonymous (${u.uid})` : `logged in as ${u.uid}`
    );
  }

  console.log("Raw text length:", rawText.length);

  // Functions 側のリージョンに合わせる
  const functions = getFunctions(app, "us-central1");
  const callGeminiApi = httpsCallable(functions, "callGeminiApi");

  console.log("Calling Firebase Callable Function...");
  const res: any = await callGeminiApi({
    prompt: `${PROMPT_EXTRACT}\n\n本文：\n"""\n${rawText}\n"""`,
  });

  console.log("Firebase Function result:", res);

  const raw = res?.data?.result ?? res?.data ?? {};
  const normalized = normalizeToLegacySchema(raw, rawText); // ★ rawText を渡す
  console.log("Normalized (legacy schema):", normalized);

  return normalized;
};
