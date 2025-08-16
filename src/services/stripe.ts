// Stripe設定ファイル
// 環境変数からStripe公開キーを取得

export const getStripePublishableKey = (): string => {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('VITE_STRIPE_PUBLISHABLE_KEY is not configured');
  }
  return key;
};

// 料金プランの価格設定（将来のStripe Price ID用）
export const STRIPE_PRICES = {
  standard: {
    monthly: 100, // JPY
    priceId: 'price_standard_monthly_jpy', // Stripe Dashboardで作成する際のID
  },
  pro: {
    monthly: 1000, // JPY
    priceId: 'price_pro_monthly_jpy', // Stripe Dashboardで作成する際のID
  },
} as const;

// プランタイプ
export type StripePlanType = 'standard' | 'pro';
export type StripePriceId = typeof STRIPE_PRICES[StripePlanType]['priceId'];
