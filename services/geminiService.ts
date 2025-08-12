import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app'; // Firebase appを初期化済みの前提
import { ClassNewsletterSchema } from '../types';
import { PROMPT_EXTRACT, CLASS_NEWSLETTER_SCHEMA } from '../constants';

// Firebase appを初期化済みの前提で、functionsインスタンスを取得
const functions = getFunctions(getApp());
const callGeminiApi = httpsCallable(functions, 'callGeminiApi');

export const extractClassNewsletterData = async (rawText: string): Promise<ClassNewsletterSchema> => {
  try {
    // Firebase Functionを呼び出し、プロンプトを渡す
    const result = await callGeminiApi({
      prompt: `${PROMPT_EXTRACT}\n\n本文：\n"""\n${rawText}\n"""`,
      // 必要であれば、responseMimeTypeやresponseSchemaもFunctions側で処理するように変更
      // 例: config: { responseMimeType: "application/json", responseSchema: CLASS_NEWSLETTER_SCHEMA },
    });

    // Functionsからの戻り値はresult.dataにある
    const jsonText = (result.data as any).result; // Functionsの戻り値の型を調整

    // Validate if the response is a valid JSON
    const data = JSON.parse(jsonText);
    
    // Here you would add validation with a library like Zod to ensure it matches ClassNewsletterSchema
    return data as ClassNewsletterSchema;

  } catch (error) {
    console.error("Error extracting newsletter data from Gemini via Firebase Function:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error("AIからの応答が不正な形式です。もう一度お試しください。");
    }
    // Firebase Functionsのエラーメッセージを適切に処理
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      throw new Error(`Firebase Function Error: ${(error as any).message}`);
    }
    throw new Error("情報の抽出中にエラーが発生しました。");
  }
};
