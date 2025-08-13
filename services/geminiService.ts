import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { ClassNewsletterSchema } from '../types';
import { PROMPT_EXTRACT, CLASS_NEWSLETTER_SCHEMA } from '../constants';

// Firebaseサービスの取得を関数内部に移動
export const extractClassNewsletterData = async (rawText: string): Promise<ClassNewsletterSchema> => {
  try {
    // 関数が呼び出されたときにFirebaseアプリインスタンスを取得
    const functions = getFunctions(getApp());
    const callGeminiApi = httpsCallable(functions, 'callGeminiApi');

    const result = await callGeminiApi({
      prompt: `${PROMPT_EXTRACT}\n\n本文：\n"""\n${rawText}\n"""`,
    });

    const jsonText = (result.data as any).result;
    const data = JSON.parse(jsonText);

    return data as ClassNewsletterSchema;

  } catch (error) {
    console.error("Error extracting newsletter data from Gemini via Firebase Function:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error("AIからの応答が不正な形式です。もう一度お試しください。");
    }
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      throw new Error(`Firebase Function Error: ${(error as any).message}`);
    }
    throw new Error("情報の抽出中にエラーが発生しました。");
  }
};
