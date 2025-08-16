import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";
import { PlanInfo, StripeProduct, StripePrice } from "@/types/firestore";

// プラン制限の定義
export const PLAN_LIMITS = {
  free: {
    monthlyAnalysisLimit: 4,
    storageDays: 1,
    familyMembers: 0,
    hasNotifications: false,
  },
  standard: {
    monthlyAnalysisLimit: 30,
    storageDays: 28,
    familyMembers: 5,
    hasNotifications: true,
  },
  pro: {
    monthlyAnalysisLimit: 200,
    storageDays: 180,
    familyMembers: 8,
    hasNotifications: true,
  }
} as const;

/**
 * Stripe Firestoreから料金プランを取得
 */
export async function fetchPlans(): Promise<PlanInfo[]> {
  try {
    const productsSnap = await getDocs(collection(db, "products"));
    const plans: PlanInfo[] = [];

    // 無料プランを手動で追加
    plans.push({
      productId: 'free',
      priceId: 'free',
      name: '無料プラン',
      price: 0,
      currency: 'jpy',
      interval: 'month',
      planType: 'free',
      features: [
        "AI解析：月4回まで",
        "保存・履歴：表示のみ（24時間で自動削除）", 
        "家族と共有：なし",
        "通知・カレンダー：なし"
      ]
    });

    // Stripeから有料プランを取得
    for (const productDoc of productsSnap.docs) {
      const productData = productDoc.data() as StripeProduct;
      
      if (!productData.active) continue;

      const pricesRef = collection(db, "products", productDoc.id, "prices");
      const pricesSnap = await getDocs(query(pricesRef, where("active", "==", true)));
      
      for (const priceDoc of pricesSnap.docs) {
        const priceData = priceDoc.data() as StripePrice;
        
        const planType = productData.metadata?.planType || 'standard';
        const planFeatures = getPlanFeatures(planType);

        plans.push({
          productId: productDoc.id,
          priceId: priceDoc.id,
          name: productData.metadata?.name || productData.name || 'プラン',
          price: priceData.unitAmount,
          currency: priceData.currency,
          interval: priceData.recurring?.interval || 'month',
          planType: planType as 'standard' | 'pro',
          features: planFeatures
        });
      }
    }

    return plans.sort((a, b) => a.price - b.price);
  } catch (error) {
    console.error('Error fetching plans:', error);
    throw new Error('料金プランの取得に失敗しました');
  }
}

/**
 * プランタイプに応じた機能一覧を取得
 */
function getPlanFeatures(planType: 'standard' | 'pro'): string[] {
  const limits = PLAN_LIMITS[planType];
  
  const baseFeatures = [
    `AI解析：月${limits.monthlyAnalysisLimit}回まで`,
    `保存・履歴：${limits.storageDays}日間保存`,
    `家族と共有：${limits.familyMembers}人まで`,
  ];

  if (limits.hasNotifications) {
    baseFeatures.push('SNS通知・カレンダー出力・自動同期');
  }

  baseFeatures.push('透かし・ぼかし：なし');

  if (planType === 'pro') {
    baseFeatures.push('優先サポート');
  }

  return baseFeatures;
}

/**
 * ユーザーの現在のプランを取得
 */
export async function getCurrentUserPlan(userId: string): Promise<'free' | 'standard' | 'pro'> {
  try {
    // まずcustomersコレクションから確認
    const customerDoc = await getDocs(query(
      collection(db, "customers", userId, "subscriptions"),
      where("status", "in", ["active", "trialing"])
    ));

    if (customerDoc.empty) {
      return 'free';
    }

    // アクティブなサブスクリプションがある場合、プラン種別を判定
    const subscriptionData = customerDoc.docs[0].data();
    const priceId = subscriptionData.price?.id || subscriptionData.items?.[0]?.price?.id;
    
    if (!priceId) return 'free';

    // priceIdからプランタイプを判定（実際の実装では、productのmetadataを確認）
    if (priceId.includes('pro') || subscriptionData.metadata?.planType === 'pro') {
      return 'pro';
    } else if (priceId.includes('standard') || subscriptionData.metadata?.planType === 'standard') {
      return 'standard';
    }

    return 'standard'; // デフォルト
  } catch (error) {
    console.error('Error getting user plan:', error);
    return 'free'; // エラー時は無料プラン扱い
  }
}

/**
 * ユーザーの使用量制限をチェック
 */
export function checkUsageLimit(
  currentUsage: number,
  planType: 'free' | 'standard' | 'pro'
): { canUse: boolean; remaining: number; limit: number } {
  const limit = PLAN_LIMITS[planType].monthlyAnalysisLimit;
  const remaining = Math.max(0, limit - currentUsage);
  
  return {
    canUse: currentUsage < limit,
    remaining,
    limit
  };
}
