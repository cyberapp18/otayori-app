import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  increment 
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '@/services/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  currentPlan: 'free' | 'standard' | 'pro';
  planStatus: string;
  monthlyUsage: number;
  lastUsageReset: Date;
  familyRole: 'owner' | 'member';
}

export class UserService {
  /**
   * 新規ユーザープロフィール作成
   */
  static async createUserProfile(user: User): Promise<void> {
    const userRef = doc(db, 'customers', user.uid);
    
    // 既存チェック
    const existingUser = await getDoc(userRef);
    if (existingUser.exists()) {
      // 最終ログイン時刻のみ更新
      await updateDoc(userRef, {
        updatedAt: serverTimestamp()
      });
      return;
    }

    // 新規作成（必須項目のみ）
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      emailVerified: user.emailVerified,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      
      // プラン情報（初期は無料）
      currentPlan: 'free',
      planStatus: 'active',
      
      // 使用量（初期化）
      monthlyUsage: 0,
      lastUsageReset: serverTimestamp(),
      
      // 家族（初期は未所属）
      familyRole: 'owner'
    });
  }

  /**
   * ユーザープロフィール取得
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'customers', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) return null;
      
      const data = userSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastUsageReset: data.lastUsageReset?.toDate() || new Date(),
      } as UserProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * プラン制限チェック
   */
  static async checkUsageLimit(userId: string): Promise<{
    canUse: boolean;
    remaining: number;
    planType: string;
    needsUpgrade: boolean;
  }> {
    const profile = await this.getUserProfile(userId);
    if (!profile) {
      return { canUse: false, remaining: 0, planType: 'free', needsUpgrade: true };
    }

    // プラン制限の定義
    const limits = {
      free: 4,
      standard: 30,
      pro: 200
    };

    // 月次使用量リセットチェック
    const now = new Date();
    const lastReset = profile.lastUsageReset;
    const monthsDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + 
                      (now.getMonth() - lastReset.getMonth());

    if (monthsDiff > 0) {
      // 使用量リセットが必要
      await this.resetMonthlyUsage(userId);
      profile.monthlyUsage = 0;
    }

    const limit = limits[profile.currentPlan];
    const remaining = Math.max(0, limit - profile.monthlyUsage);

    return {
      canUse: remaining > 0,
      remaining,
      planType: profile.currentPlan,
      needsUpgrade: remaining <= 0 && profile.currentPlan === 'free'
    };
  }

  /**
   * 使用量増加
   */
  static async incrementUsage(userId: string): Promise<void> {
    const userRef = doc(db, 'customers', userId);
    await updateDoc(userRef, {
      monthlyUsage: increment(1),
      updatedAt: serverTimestamp()
    });
  }

  /**
   * 月次使用量リセット
   */
  static async resetMonthlyUsage(userId: string): Promise<void> {
    const userRef = doc(db, 'customers', userId);
    await updateDoc(userRef, {
      monthlyUsage: 0,
      lastUsageReset: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  /**
   * プラン更新
   */
  static async updatePlan(
    userId: string, 
    plan: 'free' | 'standard' | 'pro', 
    status: string = 'active'
  ): Promise<void> {
    const userRef = doc(db, 'customers', userId);
    await updateDoc(userRef, {
      currentPlan: plan,
      planStatus: status,
      updatedAt: serverTimestamp()
    });
  }
}
