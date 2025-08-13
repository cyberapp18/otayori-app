const functions = require("firebase-functions");
const { onCall } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");


const CLASS_NEWSLETTER_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    header: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: "クラスだよりのタイトル（例: 7月号クラスだより）", nullable: true },
        class_name: { type: SchemaType.STRING, description: "クラス名（例: うさぎ組）", nullable: true },
        school_name: { type: SchemaType.STRING, description: "学校名・園名", nullable: true },
        issue_month: { type: SchemaType.STRING, description: "発行月 (YYYY-MM)", nullable: true },
        issue_date: { type: SchemaType.STRING, description: "発行日 (YYYY-MM-DD)", nullable: true },
      },
      required: ["title", "class_name", "school_name", "issue_month", "issue_date"],
    },
    overview: { type: SchemaType.STRING, description: "おたより全体の150字以内の日本語要約。結論を先に書く。" },
    key_points: {
      type: SchemaType.ARRAY,
      description: "保護者が把握すべき3〜6個の箇条書き要点。行動に関する語（準備/提出/持参/確認）を優先する。",
      items: { type: SchemaType.STRING },
    },
    actions: {
      type: SchemaType.ARRAY,
      description: "保護者による具体的な行動が必要な項目（イベントやTODO）のリスト。",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING, enum: ["event", "todo"], description: "項目の種類" }, // 正しい構文
          event_name: { type: SchemaType.STRING, description: "イベントやTODOの名称" },
          is_continuation: {
            type: SchemaType.BOOLEAN,
            description: "以前から継続している依頼事項かどうか。本文に「継続」「引き続き」「再掲」などの文言がある場合にtrueにする。",
            nullable: true,
          },
          event_date: { type: SchemaType.STRING, description: "イベント開催日 (YYYY-MM-DD)", nullable: true },
          due_date: { type: SchemaType.STRING, description: "提出物や支払いの締切日 (YYYY-MM-DD)", nullable: true },
          items: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "持ち物や提出物のリスト" },
          fee: { type: SchemaType.STRING, description: "必要な費用", nullable: true },
          repeat_rule: {
            type: SchemaType.OBJECT,
            nullable: true,
            properties: {
              byDay: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "曜日 (MO, TU, WE, TH, FR, SA, SU)" },
              time: { type: SchemaType.STRING, description: "時間 (HH:mm)" },
            },
            required: ["byDay", "time"],
          },
          audience: { type: SchemaType.STRING, description: "対象者（例: 1年1組, 全園児）", nullable: true },
          importance: { type: SchemaType.STRING, enum: ["high", "medium", "low"], description: "重要度" },
          action_required: { type: SchemaType.BOOLEAN, description: "常時true" },
          notes: { type: SchemaType.STRING, description: "補足事項（例: 要確認）", nullable: true },
          confidence: {
            type: SchemaType.OBJECT,
            properties: {
              date: { type: SchemaType.NUMBER, description: "event_dateの信頼度 (0-1)" },
              due: { type: SchemaType.NUMBER, description: "due_dateの信頼度 (0-1)" },
              items: { type: SchemaType.NUMBER, description: "itemsの信頼度 (0-1)" },
            },
            required: ["date", "due", "items"],
          },
        },
        required: ["type", "event_name", "event_date", "due_date", "items", "fee", "repeat_rule", "audience", "importance", "action_required", "notes", "confidence"],
      },
    },
    infos: {
      type: SchemaType.ARRAY,
      description: "通知不要だが参考になる情報のリスト。",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: "情報項目の見出し" },
          summary: { type: SchemaType.STRING, description: "80字以内の要約" },
          audience: { type: SchemaType.STRING, description: "関連する対象者", nullable: true },
        },
        required: ["title", "summary", "audience"],
      },
    },
  },
  required: ["header", "overview", "key_points", "actions", "infos"],
};

// CLASS_NEWSLETTER_SCHEMA はそのまま

exports.callGeminiApi = onCall(
  {
    secrets: ["GEMINI_API_KEY"],
    timeoutSeconds: 540,
    memory: "1GiB",
    region: "us-central1",
    cors: true, // CORS を有効化
  },
  async (request) => {
    console.log("Function called with auth:", !!request.auth);

    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated.",
      );
    }

    const prompt = request.data.prompt;

    if (!prompt) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Prompt is required.",
      );
    }

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      console.error("Gemini API key is not set in environment variables.");
      throw new functions.https.HttpsError(
        "unavailable",
        "Gemini API is not configured.",
      );
    }

    const genAI = new GoogleGenerativeAI(API_KEY);

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: CLASS_NEWSLETTER_SCHEMA,
        },
      });

      console.log("Prompt being sent to Gemini:", prompt.substring(0, 100) + "...");

      const result = await model.generateContent(prompt);
      const response = result.response;

      const text = response.text();
      const jsonResponse = JSON.parse(text);

      console.log("Successfully processed request");
      return { result: jsonResponse };
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw new functions.https.HttpsError(
        "internal",
        `Failed to call Gemini API: ${error.message}`,
      );
    }
  },
);
