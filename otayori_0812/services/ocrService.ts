// This service now uses the real Tesseract.js library to perform client-side OCR.
import { createWorker, Worker } from 'tesseract.js';

let worker: Worker | null = null;
let workerInitializationPromise: Promise<void> | null = null;

const initializeWorker = async () => {
    // Check if worker is already being initialized to avoid race conditions.
    if (!workerInitializationPromise) {
        console.log('Initializing Tesseract worker...');
        workerInitializationPromise = (async () => {
            try {
                // Using a specific worker version to avoid potential breaking changes.
                worker = await createWorker('jpn', 1, {
                    // logger: m => console.log(m), // Uncomment for detailed OCR progress logs
                });
                console.log('Tesseract worker initialized successfully.');
            } catch (error) {
                console.error("Failed to initialize Tesseract worker:", error);
                worker = null; // Ensure worker is null on failure
                workerInitializationPromise = null; // Allow re-initialization on next call
                throw new Error("OCRエンジンの初期化に失敗しました。");
            }
        })();
    }
    await workerInitializationPromise;
};

// Start initialization as soon as the module is loaded.
initializeWorker();

export const performOCR = async (imageFile: File): Promise<string> => {
    // Ensure the worker is ready before proceeding.
    if (!worker) {
        console.log('OCR called before worker was ready, awaiting initialization...');
        await initializeWorker();
        if (!worker) {
            // If it's still null after awaiting, initialization failed.
            throw new Error("OCRエンジンが利用できません。");
        }
    }

    console.log(`Performing OCR for image: ${imageFile.name}`);
    const { data: { text } } = await worker.recognize(imageFile);
    console.log("OCR simulation complete.");
    return text;
};