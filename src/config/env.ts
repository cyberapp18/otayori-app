// 環境変数の型定義と取得
export const ENV = {
  // Firebase
  FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  
  // Stripe
  STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  
  // Application
  PUBLIC_URL: import.meta.env.VITE_PUBLIC_URL,
  NODE_ENV: import.meta.env.NODE_ENV,
} as const;

// 環境変数の検証
export const validateEnv = () => {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN', 
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_STRIPE_PUBLISHABLE_KEY',
  ] as const;

  const missing: string[] = [];
  
  requiredVars.forEach((key) => {
    if (!import.meta.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
};

// 本番環境かどうかの判定
export const isProd = () => import.meta.env.PROD;
export const isDev = () => import.meta.env.DEV;

// 開発環境での初期化時に検証
if (isDev()) {
  try {
    validateEnv();
    console.log('✅ Environment variables validated successfully');
    console.log('📍 Current environment:', import.meta.env.NODE_ENV);
    console.log('🏠 Public URL:', ENV.PUBLIC_URL);
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
  }
}
