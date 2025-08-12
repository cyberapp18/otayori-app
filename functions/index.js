const functions = require("firebase-functions");
const {GoogleGenerativeAI} = require("@google/generative-ai");

exports.callGeminiApi = functions.https.onCall(async (data, context) => {
  // 認証チェック (例: ユーザーがログインしているか)
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated.",
    );
  }

  // 環境変数からAPIキーを取得
  const config = functions.config().gemini;
  const API_KEY = config && config.api_key ? config.api_key : null;

  // APIキーが設定されていない場合はエラーをスロー
  if (!API_KEY) {
    console.error("Gemini API key is not set in Firebase Functions config.");
    throw new functions.https.HttpsError(
        "unavailable",
        "Gemini API is not configured. Please ensure API key is set.",
    );
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const prompt = data.prompt; // フロントエンドから渡されるプロンプト

  if (!prompt) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Prompt is required.",
    );
  }

  try {
    const model = genAI.getGenerativeModel({model: "gemini-pro"});
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {result: text};
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Failed to call Gemini API.",
    );
  }
});
