import { addDoc, collection, onSnapshot, doc, getDocs } from "firebase/firestore";
import { auth, db } from "@/services/firebase";

/**
 * Stripe Checkoutセッションを開始
 */
export async function startCheckout(priceId: string, planType: 'standard' | 'pro'): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('ログインが必要です');
  }

  const uid = auth.currentUser.uid;
  
  try {
    const checkoutSessionRef = collection(db, "customers", uid, "checkout_sessions");
    const docRef = await addDoc(checkoutSessionRef, {
      price: priceId,
      success_url: `${window.location.origin}/dashboard?checkout=success`,
      cancel_url: `${window.location.origin}/pricing?checkout=canceled`,
      allow_promotion_codes: true,
      automatic_tax: true,
      tax_id_collection: false,
      metadata: {
        planType: planType,
        userId: uid
      },
      // トライアル設定（必要に応じて）
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          planType: planType
        }
      }
    });

    // Stripe拡張がsessionIdまたはurlを書き込むまで待機
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        reject(new Error('チェックアウトセッションの作成がタイムアウトしました'));
      }, 10000); // 10秒でタイムアウト

      const unsubscribe = onSnapshot(docRef, (snap) => {
        const data = snap.data();
        
        if (!data) return;

        if (data.error) {
          clearTimeout(timeout);
          unsubscribe();
          console.error('Checkout error:', data.error);
          reject(new Error(data.error.message || 'チェックアウトでエラーが発生しました'));
          return;
        }

        if (data.url) {
          clearTimeout(timeout);
          unsubscribe();
          // Stripeのチェックアウトページにリダイレクト
          window.location.assign(data.url);
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Error starting checkout:', error);
    throw new Error('チェックアウトの開始に失敗しました');
  }
}

/**
 * Stripe Billing Portalを開く（既存ユーザーのプラン管理）
 */
export async function openBillingPortal(): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('ログインが必要です');
  }

  const uid = auth.currentUser.uid;

  try {
    const portalSessionRef = collection(db, "customers", uid, "portal_sessions");
    const docRef = await addDoc(portalSessionRef, {
      return_url: `${window.location.origin}/settings`,
    });

    // Stripe拡張がurlを書き込むまで待機
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        reject(new Error('ポータルセッションの作成がタイムアウトしました'));
      }, 10000);

      const unsubscribe = onSnapshot(docRef, (snap) => {
        const data = snap.data();
        
        if (!data) return;

        if (data.error) {
          clearTimeout(timeout);
          unsubscribe();
          console.error('Portal error:', data.error);
          reject(new Error(data.error.message || 'ポータル作成でエラーが発生しました'));
          return;
        }

        if (data.url) {
          clearTimeout(timeout);
          unsubscribe();
          // Stripe Billing Portalにリダイレクト
          window.location.assign(data.url);
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Error opening billing portal:', error);
    throw new Error('ポータルの開始に失敗しました');
  }
}

/**
 * ユーザーのサブスクリプション情報を取得
 */
export async function getUserSubscription(userId: string) {
  try {
    const subscriptionsRef = collection(db, "customers", userId, "subscriptions");
    const subscriptionsSnap = await getDocs(subscriptionsRef);
    
    if (subscriptionsSnap.empty) {
      return null;
    }

    // 最新のサブスクリプションを取得
    const subscriptions = subscriptionsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => {
        const aCreated = a.created?.toDate?.() || new Date(0);
        const bCreated = b.created?.toDate?.() || new Date(0);
        return bCreated.getTime() - aCreated.getTime();
      });

    return subscriptions[0] || null;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}
