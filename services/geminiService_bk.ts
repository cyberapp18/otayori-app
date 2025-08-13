import { getFunctions, httpsCallable } from 'firebase/functions';
import { ClassNewsletterSchema } from '../types';
import { PROMPT_EXTRACT } from '../constants';
// Firebase app を直接インポート
import app from '../src/services/firebase'; // デフォルトエクスポートを使用

export const extractClassNewsletterData = async (rawText: string): Promise<ClassNewsletterSchema> => {
  try {
    // Firebaseアプリインスタンスを明示的に渡す
    const functions = getFunctions(app);
    const callGeminiApi = httpsCallable(functions, 'callGeminiApi');

    console.log("Calling Firebase Function with prompt length:", rawText.length);

    const result = await callGeminiApi({
      prompt: `${PROMPT_EXTRACT}\n\n本文：\n"""\n${rawText}\n"""`,
    });

    console.log("Firebase Function result:", result);

    // 修正: result.data.result の構造を確認
    const data = (result.data as any).result;
    
    // データが既にオブジェクトの場合はそのまま返す
    if (typeof data === 'object') {
      return data as ClassNewsletterSchema;
    }
    
    // 文字列の場合はJSONパース
    if (typeof data === 'string') {
      const parsedData = JSON.parse(data);
      return parsedData as ClassNewsletterSchema;
    }

    throw new Error("Unexpected data format from Firebase Function");

  } catch (error) {
    console.error("Error extracting newsletter data from Gemini via Firebase Function:", error);
    console.error("Error details:", error);
    
    if (error instanceof Error && error.message.includes('JSON')) {
      throw new Error("AIからの応答が不正な形式です。もう一度お試しください。");
    }
    
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      const errorCode = (error as any).code;
      const errorMessage = (error as any).message;
      throw new Error(`Firebase Function Error: ${errorCode} - ${errorMessage}`);
    }
    
    throw new Error("情報の抽出中にエラーが発生しました。");
  }
};