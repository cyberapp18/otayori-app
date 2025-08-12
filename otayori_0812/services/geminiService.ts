
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ClassNewsletterSchema } from '../types';
import { PROMPT_EXTRACT, CLASS_NEWSLETTER_SCHEMA } from '../constants';

if (!process.env.API_KEY) {
  // In a real app, this would be a fatal error.
  // For this environment, we will log a warning.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const extractClassNewsletterData = async (rawText: string): Promise<ClassNewsletterSchema> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      // Instructions and text are now more clearly separated for the AI
      contents: `${PROMPT_EXTRACT}\n\n本文：\n"""\n${rawText}\n"""`,
      config: {
        responseMimeType: "application/json",
        responseSchema: CLASS_NEWSLETTER_SCHEMA,
      },
    });

    const jsonText = response.text.trim();
    // Validate if the response is a valid JSON
    const data = JSON.parse(jsonText);
    
    // Here you would add validation with a library like Zod to ensure it matches ClassNewsletterSchema
    return data as ClassNewsletterSchema;

  } catch (error) {
    console.error("Error extracting newsletter data from Gemini:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error("AIからの応答が不正な形式です。もう一度お試しください。");
    }
    throw new Error("情報の抽出中にエラーが発生しました。");
  }
};
