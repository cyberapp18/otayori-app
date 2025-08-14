// services/geminiService.ts
import { getFunctions, httpsCallable } from "firebase/functions";
import { signInAnonymously } from "firebase/auth";

// 既存の firebase 初期化（default と named を併用）
import app, { auth } from "@/services/firebase";

import type { ClassNewsletterSchema } from "@/types";
import { PROMPT_EXTRACT } from "@/constants";

export const extractClassNewsletterData = async (
  rawText: string
): Promise<ClassNewsletterSchema> => {
  console.log("=== Gemini Service Start ===");

  // 仕様：未ログインでも体験OK → 匿名で自動サインイン
  if (!auth.currentUser) {
    await signInAnonymously(auth);
    console.log("Signed in anonymously:", auth.currentUser?.uid);
  } else {
    const u = auth.currentUser!;
    console.log("User status:", u.isAnonymous ? `anonymous (${u.uid})` : `logged in as ${u.uid}`);
  }

  console.log("Raw text length:", rawText.length);

  // Functions 側の region と一致（functions/index.js が us-central1）
  const functions = getFunctions(app, "us-central1");
  const callGeminiApi = httpsCallable(functions, "callGeminiApi");

  console.log("Calling Firebase Callable Function...");

  const result = await callGeminiApi({
    prompt: `${PROMPT_EXTRACT}\n\n本文：\n"""\n${rawText}\n"""`,
  });

  console.log("Firebase Function result:", result);

  // サーバは { result: ... } で返す想定（保険で data 本体も許容）
  const data = (result.data as any)?.result ?? (result.data as any);
  if (!data || typeof data !== "object") {
    throw new Error("Firebase Functionから無効なデータが返されました");
  }
  return data as ClassNewsletterSchema;
};
