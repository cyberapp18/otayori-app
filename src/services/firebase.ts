import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// 環境変数の型安全なチェック
const requiredEnvVars = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
} as const;

// 未定義チェック
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: VITE_FIREBASE_${key.toUpperCase()}`);
  }
});

const app = initializeApp(requiredEnvVars);

console.log('projectId', import.meta.env.VITE_FIREBASE_PROJECT_ID);

export const auth = getAuth(app);
export const db = getFirestore(app);

// 開発環境ではEmulatorに接続
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' || 
                   window.location.hostname.includes('192.168') ||
                   import.meta.env.DEV;

if (isLocalhost) {
  console.log('🚀 Connecting to Firebase Emulators...');
  
  // Firestore Emulator接続
  let emulatorConnected = false;
  try {
    connectFirestoreEmulator(db, 'localhost', 8082);
    emulatorConnected = true;
    console.log('✅ Connected to Firestore Emulator');
  } catch (error) {
    if (error.message.includes('already connected')) {
      console.log('✅ Already connected to Firestore Emulator');
      emulatorConnected = true;
    } else {
      console.warn('Firestore Emulator connection failed:', error.message);
    }
  }
  
  // Auth Emulator接続（必要に応じて）
  // try {
  //   connectAuthEmulator(auth, 'http://localhost:9099');
  //   console.log('✅ Connected to Auth Emulator');
  // } catch (error) {
  //   console.warn('Auth Emulator connection failed:', error);
  // }
} else {
  console.log('🌐 Using production Firebase services');
}

export default app;
