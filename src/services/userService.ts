import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  increment 
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  emailVerified?: boolean;
  createdAt: Date;
  updatedAt?: Date;
  isActive?: boolean;
  planType: 'free' | 'standard' | 'pro';
  monthlyLimit: number;
  currentMonthUsage: number;
  lastResetDate: Date;
  
  // 家族管理フィールド
  familyId?: string;
  familyRole?: 'owner' | 'parent' | 'child';
  hasCompletedFamilyOnboarding?: boolean;
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
      displayName: user.displayName || user.email?.split('@')[0] || 'ユーザー',
      emailVerified: user.emailVerified || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      
      // プラン情報（初期は無料）
      planType: 'free',
      monthlyLimit: 4, // 無料プランは4回まで
      
      // 使用量（初期化）
      currentMonthUsage: 0,
      lastResetDate: serverTimestamp(),
      
      // 家族（初期は未所属）
      familyRole: 'owner'
    });
  }

  /**
   * ユーザープロフィール取得
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log('getUserProfile 開始, userId:', userId);
      const userRef = doc(db, 'customers', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        console.log('ユーザープロフィールが存在しません。デフォルトプロフィールを作成します。');
        
        // Firebase Authからユーザー情報を取得して、デフォルトプロフィールを作成
        const defaultProfile: UserProfile = {
          uid: userId,
          email: '',
          displayName: 'ユーザー',
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          planType: 'free',
          monthlyLimit: 4,
          currentMonthUsage: 0,
          lastResetDate: new Date(),
          familyRole: 'owner'
        };
        
        // Firestoreに保存
        await setDoc(userRef, {
          ...defaultProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastResetDate: serverTimestamp()
        });
        
        console.log('デフォルトプロフィールを作成しました:', defaultProfile);
        return defaultProfile;
      }
      
      const data = userSnap.data();
      console.log('Firestoreから取得したデータ:', data);
      
      // プランタイプを先に決定
      const planType = data.planType || 'free';
      
      // プランに基づく月間制限を計算
      let monthlyLimit = data.monthlyLimit;
      if (!monthlyLimit) {
        switch (planType) {
          case 'standard':
            monthlyLimit = 30;
            break;
          case 'pro':
            monthlyLimit = 200;
            break;
          default:
            monthlyLimit = 4;
        }
      }
      
      const profile = {
        uid: data.uid || userId,
        email: data.email || '',
        displayName: data.displayName || 'ユーザー',
        emailVerified: data.emailVerified || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
        isActive: data.isActive !== false, // デフォルトtrue
        planType: planType,
        monthlyLimit: monthlyLimit,
        currentMonthUsage: data.currentMonthUsage || 0,
        lastResetDate: data.lastResetDate?.toDate() || new Date(),
        
        // 家族管理フィールド（重要！）
        familyId: data.familyId,
        familyRole: data.familyRole,
        hasCompletedFamilyOnboarding: data.hasCompletedFamilyOnboarding
      } as UserProfile;
      
      console.log('構築したプロフィール:', profile);
      
      // データが不完全な場合、Firestoreを更新
      if (!data.planType || !data.monthlyLimit) {
        console.log('不完全なデータを検出。Firestoreを更新します。');
        await updateDoc(userRef, {
          planType: profile.planType,
          monthlyLimit: profile.monthlyLimit,
          updatedAt: serverTimestamp()
        });
      }
      
      return profile;
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
    const lastReset = profile.lastResetDate;
    const monthsDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + 
                      (now.getMonth() - lastReset.getMonth());

    if (monthsDiff > 0) {
      // 使用量リセットが必要
      await this.resetMonthlyUsage(userId);
      profile.currentMonthUsage = 0;
    }

    const limit = limits[profile.planType as keyof typeof limits] || limits.free;
    const remaining = Math.max(0, limit - profile.currentMonthUsage);

    return {
      canUse: remaining > 0,
      remaining,
      planType: profile.planType,
      needsUpgrade: remaining <= 0 && profile.planType === 'free'
    };
  }

  /**
   * 使用量増加
   */
  static async incrementUsage(userId: string): Promise<void> {
    const userRef = doc(db, 'customers', userId);
    await updateDoc(userRef, {
      currentMonthUsage: increment(1),
      updatedAt: serverTimestamp()
    });
  }

  /**
   * 月次使用量リセット
   */
  static async resetMonthlyUsage(userId: string): Promise<void> {
    const userRef = doc(db, 'customers', userId);
    await updateDoc(userRef, {
      currentMonthUsage: 0,
      lastResetDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  /**
   * プラン更新
   */
  static async updatePlan(
    userId: string, 
    plan: 'free' | 'standard' | 'pro'
  ): Promise<void> {
    const limits = {
      free: 5,
      standard: 30,
      pro: 200
    };
    
    const userRef = doc(db, 'customers', userId);
    await updateDoc(userRef, {
      planType: plan,
      monthlyLimit: limits[plan],
      updatedAt: serverTimestamp()
    });
  }

  /**
   * 家族情報を更新
   */
  static async updateFamilyInfo(
    userId: string, 
    familyId: string, 
    familyRole: 'owner' | 'parent' | 'child'
  ): Promise<void> {
    try {
      console.log('UserService.updateFamilyInfo 開始');
      console.log('userId:', userId);
      console.log('familyId:', familyId);
      console.log('familyRole:', familyRole);
      
      const userRef = doc(db, 'customers', userId);
      console.log('ユーザープロフィール更新中...');
      
      await updateDoc(userRef, {
        familyId,
        familyRole,
        updatedAt: serverTimestamp()
      });
      
      console.log('UserService.updateFamilyInfo 完了');
    } catch (error) {
      console.error('UserService.updateFamilyInfo エラー:', error);
      throw error;
    }
  }

  /**
   * 家族オンボーディング完了フラグを更新
   */
  static async updateFamilyOnboardingStatus(
    userId: string, 
    completed: boolean
  ): Promise<void> {
    const userRef = doc(db, 'customers', userId);
    await updateDoc(userRef, {
      hasCompletedFamilyOnboarding: completed,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * ユーザープロフィール更新
   */
  static async updateUserProfile(userId: string, updates: {
    displayName?: string;
    email?: string;
  }): Promise<void> {
    const userRef = doc(db, 'customers', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * プラン変更
   */
  static async changePlan(userId: string, planType: 'free' | 'standard' | 'pro'): Promise<void> {
    const userRef = doc(db, 'customers', userId);
    
    // プランごとの制限設定
    const planSettings = {
      free: { monthlyLimit: 4, planType: 'free' },
      standard: { monthlyLimit: 30, planType: 'standard' },
      pro: { monthlyLimit: 200, planType: 'pro' }
    };
    
    const settings = planSettings[planType];
    
    await updateDoc(userRef, {
      planType: settings.planType,
      monthlyLimit: settings.monthlyLimit,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * プラン変更（トライアル情報付き）
   */
  static async changePlanWithTrial(
    userId: string, 
    planType: 'free' | 'standard' | 'pro',
    trialEndDate?: Date,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string
  ): Promise<void> {
    const userRef = doc(db, 'customers', userId);
    
    // プランごとの制限設定
    const planSettings = {
      free: { monthlyLimit: 4, planType: 'free' },
      standard: { monthlyLimit: 30, planType: 'standard' },
      pro: { monthlyLimit: 200, planType: 'pro' }
    };
    
    const settings = planSettings[planType];
    
    const updateData: any = {
      planType: settings.planType,
      monthlyLimit: settings.monthlyLimit,
      updatedAt: serverTimestamp()
    };

    // トライアル情報を追加
    if (trialEndDate) {
      updateData.trialEndDate = trialEndDate;
      updateData.isTrialActive = true;
    }

    // Stripe情報を追加
    if (stripeCustomerId) {
      updateData.stripeCustomerId = stripeCustomerId;
    }
    if (stripeSubscriptionId) {
      updateData.stripeSubscriptionId = stripeSubscriptionId;
    }
    
    await updateDoc(userRef, updateData);
  }

  /**
   * アカウント削除（論理削除）
   */
  static async deleteAccount(userId: string): Promise<void> {
    const userRef = doc(db, 'customers', userId);
    await updateDoc(userRef, {
      isActive: false,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}
