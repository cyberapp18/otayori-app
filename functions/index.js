// functions/index.js
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { defineSecret } = require("firebase-functions/params");

initializeApp();

// Secret Manager: 事前に `firebase functions:secrets:set GEMINI_API_KEY`
const geminiApiKey = defineSecret("GEMINI_API_KEY");

exports.callGeminiApi = onCall(
  {
    secrets: [geminiApiKey],
    timeoutSeconds: 540,
    memory: "1GiB",
    region: "us-central1", // ← フロントの getFunctions と一致させる
  },
  async (request) => {
    // 仕様：未ログイン体験OK。ただし匿名サインインを前提に「認証必須」にする
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in first (anonymous allowed)");
    }

    const GEMINI_KEY = geminiApiKey.value();
    if (!GEMINI_KEY) {
      throw new HttpsError("failed-precondition", "Gemini API key is not set");
    }

    const prompt = request.data?.prompt;
    if (!prompt || typeof prompt !== "string" || prompt.length > 8000) {
      throw new HttpsError("invalid-argument", "Invalid prompt");
    }

    try {
      // Node18+ なら fetch はグローバルにある
      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_KEY;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" },
        }),
      });

      if (!r.ok) {
        const text = await r.text();
        console.error("Gemini upstream error:", r.status, text);
        throw new HttpsError("internal", `Gemini upstream error: ${text}`);
      }

      const result = await r.json();
      const content = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new HttpsError("internal", "No valid content from Gemini");
      }

      const parsed = JSON.parse(content);
      return { result: parsed };
    } catch (err) {
      console.error("callGeminiApi exception:", err);
      if (err?.httpErrorCode) throw err; // 既に HttpsError の場合はそのまま
      throw new HttpsError("internal", err?.message || String(err));
    }
  },
);
