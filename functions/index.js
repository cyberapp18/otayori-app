const functions = require("firebase-functions");
const { GoogleGenerativeAI, Type } = require("@google/generative-ai");

const CLASS_NEWSLETTER_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    header: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "クラスだよりのタイトル（例: 7月号クラスだより）", nullable: true },
        class_name: { type: Type.STRING, description: "クラス名（例: うさぎ組）", nullable: true },
        school_name: { type: Type.STRING, description: "学校名・園名", nullable: true },
        issue_month: { type: Type.STRING, description: "発行月 (YYYY-MM)", nullable: true },
        issue_date: { type: Type.STRING, description: "発行日 (YYYY-MM-DD)", nullable: true },
      },
      required: ["title", "class_name", "school_name", "issue_month", "issue_date"],
    },
    overview: { type: Type.STRING, description: "おたより全体の150字以内の日本語要約。結論を先に書く。" },
    key_points: {
      type: Type.ARRAY,
      description: "保護者が把握すべき3〜6個の箇条書き要点。行動に関する語（準備/提出/持参/確認）を優先する。",
      items: { type: Type.STRING },
    },
    actions: {
      type: Type.ARRAY,
      description: "保護者による具体的な行動が必要な項目（イベントやTODO）のリスト。",
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["event", "todo"], description: "項目の種類" },
          event_name: { type: Type.STRING, description: "イベントやTODOの名称" },
          is_continuation: {
            type: Type.BOOLEAN,
            description: "以前から継続している依頼事項かどうか。本文に「継続」「引き続き」「再掲」などの文言がある場合にtrueにする。",
            nullable: true,
          },
          event_date: { type: Type.STRING, description: "イベント開催日 (YYYY-MM-DD)", nullable: true },
          due_date: { type: Type.STRING, description: "提出物や支払いの締切日 (YYYY-MM-DD)", nullable: true },
          items: { type: Type.ARRAY, description: "持ち物や提出物のリスト", items: { type: Type.STRING } },
          fee: { type: Type.STRING, description: "必要な費用", nullable: true },
          repeat_rule: {
            type: Type.OBJECT,
            nullable: true,
            properties: {
              byDay: { type: Type.ARRAY, items: { type: Type.STRING }, description: "曜日 (MO, TU, WE, TH, FR, SA, SU)" },
              time: { type: Type.STRING, description: "時間 (HH:mm)" },
            },
            required: ["byDay", "time"],
          },
          audience: { type: Type.STRING, description: "対象者（例: 1年1組, 全園児）", nullable: true },
          importance: { type: Type.STRING, enum: ["high", "medium", "low"], description: "重要度" },
          action_required: { type: Type.BOOLEAN, description: "常時true" },
          notes: { type: Type.STRING, description: "補足事項（例: 要確認）", nullable: true },
          confidence: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.NUMBER, description: "event_dateの信頼度 (0-1)" },
              due: { type: Type.NUMBER, description: "due_dateの信頼度 (0-1)" },
              items: { type: Type.NUMBER, description: "itemsの信頼度 (0-1)" },
            },
            required: ["date", "due", "items"],
          },
        },
        required: ["type", "event_name", "event_date", "due_date", "items", "fee", "repeat_rule", "audience", "importance", "action_required", "notes", "confidence"],
      },
    },
    infos: {
      type: Type.ARRAY,
      description: "通知不要だが参考になる情報のリスト。",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "情報項目の見出し" },
          summary: { type: Type.STRING, description: "80字以内の要約" },
          audience: { type: Type.STRING, description: "関連する対象者", nullable: true },
        },
        required: ["title", "summary", "audience"],
      },
    },
  },
  required: ["header", "overview", "key_points", "actions", "infos"],
};


exports.callGeminiApi = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated.",
    );
  }

  const config = functions.config().gemini;
  const API_KEY = config && config.api_key ? config.api_key : null;

  if (!API_KEY) {
    console.error("Gemini API key is not set in Firebase Functions config.");
    throw new functions.https.HttpsError(
      "unavailable",
      "Gemini API is not configured. Please ensure API key is set.",
    );
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const prompt = data.prompt;

  if (!prompt) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Prompt is required.",
    );
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    console.log("Prompt being sent to Gemini:", prompt);

    const result = await model.generateContent({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: CLASS_NEWSLETTER_SCHEMA,
      },
    });
    const response = await result.response;
    console.log("Raw response from Gemini:", response);
    const jsonResponse = await response.json();

    return { result: JSON.stringify(jsonResponse) };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to call Gemini API.",
    );
  }
});
