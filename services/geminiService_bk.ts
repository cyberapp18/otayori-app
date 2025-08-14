import { getFunctions, httpsCallable } from 'firebase/functions';
import { ClassNewsletterSchema } from '../types';
import { PROMPT_EXTRACT } from '../constants';
import app from '../src/services/firebase';
import { auth } from '../src/services/firebase'; // auth をインポート

export const extractClassNewsletterData = async (rawText: string): Promise<ClassNewsletterSchema> => {
  try {
    console.log("=== Gemini Service Start ===");
    
    // 認証チェックを削除（未ログインでもAI処理可能）
    // if (!auth.currentUser) {
    //   throw new Error("認証が必要です。ログインしてください。");
    // }

    const user = auth.currentUser;
    console.log("User status:", user ? `logged in as ${user.uid}` : "anonymous");
    console.log("Raw text length:", rawText.length);
    
    // Callable 関数の呼び出し（リージョン明示）
    const functions = getFunctions(app, "us-central1");
    const callGeminiApi = httpsCallable(functions, "callGeminiApi");

    console.log("Calling Firebase Callable Function...");

    const result = await callGeminiApi({
      prompt: `${PROMPT_EXTRACT}\n\n本文：\n"""\n${rawText}\n"""`
    });

    console.log("Firebase Function result:", result);

    const data = (result.data as any).result;
    
    if (!data || typeof data !== 'object') {
      throw new Error("Firebase Functionから無効なデータが返されました");
    }
    
    return data as ClassNewsletterSchema;

  } catch (error) {
    console.error("=== Gemini Service Error ===");
    console.error("Error:", error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as any;
      switch (firebaseError.code) {
        case 'functions/unauthenticated':
          throw new Error("認証が必要です。ログインしてください。");
        case 'functions/failed-precondition':
          throw new Error("サーバーの設定に問題があります。管理者にお問い合わせください。");
        case 'functions/invalid-argument':
          throw new Error("入力データに問題があります。もう一度お試しください。");
        case 'functions/internal':
          throw new Error("サーバー内部でエラーが発生しました。しばらく待ってから再度お試しください。");
        default:
          throw new Error(`Firebase Function Error: ${firebaseError.message}`);
      }
    }
    
    throw new Error("情報の抽出中にエラーが発生しました。");
  }
};