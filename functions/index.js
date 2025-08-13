const { onCall } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { defineSecret } = require("firebase-functions/params");

initializeApp();

// Secrets Manager を使用
const geminiApiKey = defineSecret("GEMINI_API_KEY");

exports.callGeminiApi = onCall(
  {
    secrets: [geminiApiKey],
    timeoutSeconds: 540,
    memory: "1GiB",
    region: "us-central1",
  },
  async (request) => {
    // 認証チェックを削除（未ログインでもAI処理可能）
    // if (!request.auth) {
    //   throw new HttpsError("unauthenticated", "認証が必要です");
    // }

    console.log("Function called by:", request.auth ? request.auth.uid : "anonymous");

    // API キー取得
    const GEMINI_KEY = geminiApiKey.value();
    if (!GEMINI_KEY) {
      throw new HttpsError("failed-precondition", "Gemini APIキーが設定されていません");
    }

    const prompt = request.data?.prompt;
    if (!prompt || typeof prompt !== "string") {
      throw new HttpsError("invalid-argument", "プロンプトが不正です");
    }

    try {
      console.log("Calling Gemini API with prompt length:", prompt.length);

      // Gemini REST API 直接呼び出し
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{ text: prompt }],
            }],
            generationConfig: {
              response_mime_type: "application/json",
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", errorText);
        throw new HttpsError("internal", `Gemini API エラー: ${errorText}`);
      }

      const result = await response.json();
      console.log("Gemini API response received");

      // レスポンス構造の確認
      const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new HttpsError("internal", "Gemini APIから有効なレスポンスが得られませんでした");
      }

      // JSONパース
      const parsedContent = JSON.parse(content);

      return { result: parsedContent };
    } catch (error) {
      console.error("Error in callGeminiApi:", error);

      if (error.httpErrorCode) {
        throw error;
      }

      throw new HttpsError("internal", `処理中にエラーが発生しました: ${error.message}`);
    }
  },
);

// HttpsError のインポート追加
const { HttpsError } = require("firebase-functions/v2/https");
