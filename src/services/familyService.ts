import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { UserService } from './userService';
import { 
  Family, 
  FamilyMember, 
  FamilyChild, 
  FamilyInvite, 
  FamilySettings 
} from '../types';

export class FamilyService {
  private static readonly FAMILIES_COLLECTION = 'families';

  /**
   * 新しい家族を作成
   */
  static async createFamily(ownerId: string, ownerName: string): Promise<string> {
    try {
      console.log('FamilyService.createFamily 開始');
      console.log('ownerId:', ownerId);
      console.log('ownerName:', ownerName);
      console.log('db:', db);
      
      const familyRef = doc(collection(db, this.FAMILIES_COLLECTION));
      const familyId = familyRef.id;
      console.log('familyId:', familyId);

      const initialMember: FamilyMember = {
        role: 'owner',
        name: ownerName,
        joinedAt: new Date().toISOString(),
        permissions: {
          canInvite: true,
          canManageChildren: true,
          canViewAll: true
        }
      };

      const initialSettings: FamilySettings = {
        shareNotices: true,
        shareTasks: true,
        autoShare: false
      };

      const familyData: Omit<Family, 'id'> = {
        ownerId,
        members: { [ownerId]: initialMember },
        children: {},
        invites: {},
        settings: initialSettings,
        onboardingStep: 1,
        onboardingCompleted: false,
        maxMembers: 5, // スタンダードプラン想定
        maxChildren: 8,
        createdAt: new Date().toISOString()
      };

      console.log('家族データ:', familyData);
      console.log('Firestoreに保存中...');
      
      await setDoc(familyRef, familyData);
      console.log('Firestore保存完了');
      
      return familyId;
    } catch (error) {
      console.error('Error creating family:', error);
      throw new Error('家族の作成に失敗しました');
    }
  }

  /**
   * 家族情報を取得
   */
  static async getFamily(familyId: string): Promise<Family | null> {
    try {
      console.log('FamilyService.getFamily 開始, familyId:', familyId);
      const familyDoc = await getDoc(doc(db, this.FAMILIES_COLLECTION, familyId));
      
      if (!familyDoc.exists()) {
        console.log('家族ドキュメントが存在しません');
        return null;
      }

      const familyData = {
        id: familyDoc.id,
        ...familyDoc.data()
      } as Family;
      
      console.log('取得した家族データ:', familyData);
      return familyData;
    } catch (error) {
      console.error('Error getting family:', error);
      throw new Error('家族情報の取得に失敗しました');
    }
  }

  /**
   * ユーザーが所属する家族を取得
   */
  static async getFamilyByMember(userId: string): Promise<Family | null> {
    try {
      const q = query(
        collection(db, this.FAMILIES_COLLECTION),
        where(`members.${userId}`, '!=', null)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const familyDoc = querySnapshot.docs[0];
      return {
        id: familyDoc.id,
        ...familyDoc.data()
      } as Family;
    } catch (error) {
      console.error('Error getting family by member:', error);
      throw new Error('家族情報の取得に失敗しました');
    }
  }

  /**
   * 子どもを追加
   */
  static async addChild(
    familyId: string, 
    childData: Omit<FamilyChild, 'createdAt'>
  ): Promise<string> {
    try {
      const childId = `child_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      
      const familyRef = doc(db, this.FAMILIES_COLLECTION, familyId);
      
      await updateDoc(familyRef, {
        [`children.${childId}`]: {
          ...childData,
          createdAt: new Date().toISOString()
        }
      });

      return childId;
    } catch (error) {
      console.error('Error adding child:', error);
      throw new Error('お子さまの追加に失敗しました');
    }
  }

  /**
   * 招待コードを生成
   */
  static async createInvite(
    familyId: string,
    invitedBy: string,
    type: 'family' | 'child',
    method: 'qr' | 'email' | 'line',
    options?: {
      targetChildId?: string;
      email?: string;
    }
  ): Promise<string> {
    try {
      const inviteId = `invite_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const inviteCode = `${type.toUpperCase()}_${Math.random().toString(36).slice(2, 12).toUpperCase()}`;
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7日間有効

      const inviteData: FamilyInvite = {
        type,
        targetChildId: options?.targetChildId || null,
        invitedBy,
        email: options?.email || null,
        code: inviteCode,
        method,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        used: false,
        usedBy: null,
        usedAt: null
      };

      const familyRef = doc(db, this.FAMILIES_COLLECTION, familyId);
      
      await updateDoc(familyRef, {
        [`invites.${inviteId}`]: inviteData
      });

      return inviteCode;
    } catch (error) {
      console.error('Error creating invite:', error);
      throw new Error('招待コードの作成に失敗しました');
    }
  }

  /**
   * オンボーディングステップを更新
   */
  static async updateOnboardingStep(
    familyId: string, 
    step: number, 
    completed: boolean = false
  ): Promise<void> {
    try {
      const familyRef = doc(db, this.FAMILIES_COLLECTION, familyId);
      
      await updateDoc(familyRef, {
        onboardingStep: step,
        onboardingCompleted: completed
      });
    } catch (error) {
      console.error('Error updating onboarding step:', error);
      throw new Error('オンボーディング状態の更新に失敗しました');
    }
  }

  /**
   * 家族招待コードを生成
   */
  static async createFamilyInvite(familyId: string, invitedBy: string): Promise<string> {
    try {
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const familyRef = doc(db, this.FAMILIES_COLLECTION, familyId);
      
      const inviteData = {
        type: 'family',
        invitedBy,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7日後
        used: false
      };

      await updateDoc(familyRef, {
        [`invites.${inviteCode}`]: inviteData
      });

      return inviteCode;
    } catch (error) {
      console.error('Error creating family invite:', error);
      throw new Error('招待コードの生成に失敗しました');
    }
  }

  /**
   * メールで家族招待を送信（モック実装）
   */
  static async sendEmailInvite(email: string, familyId: string, invitedBy: string): Promise<void> {
    try {
      if (!email.includes('@')) {
        throw new Error('有効なメールアドレスを入力してください');
      }

      const inviteCode = await this.createFamilyInvite(familyId, invitedBy);
      
      // 実際の実装では、ここでメール送信APIを呼び出します
      console.log(`招待メール送信: ${email}`);
      console.log(`招待コード: ${inviteCode}`);
      console.log(`招待URL: ${window.location.origin}/invite/${inviteCode}`);
      
      // モック実装として成功をシミュレート
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Error sending email invite:', error);
      throw error;
    }
  }

  // 招待コードから招待情報を取得
  static async getInviteByCode(inviteCode: string): Promise<any> {
    try {
      // Firestoreから招待情報を検索
      const familiesRef = collection(db, 'families');
      const familySnapshots = await getDocs(familiesRef);
      
      for (const familyDoc of familySnapshots.docs) {
        const familyData = familyDoc.data();
        const invites = familyData.invites || {};
        
        // 招待コードが一致するものを探す
        for (const [inviteId, invite] of Object.entries(invites)) {
          const typedInvite = invite as any;
          if (typedInvite.code === inviteCode && !typedInvite.used) {
            return {
              id: inviteId,
              familyId: familyDoc.id,
              familyName: familyData.name,
              invitedByName: familyData.members?.[typedInvite.invitedBy]?.displayName || 'Unknown',
              ...typedInvite
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting invite by code:', error);
      throw error;
    }
  }

  // 招待を受け入れる
  static async acceptInvite(inviteCode: string, userId: string): Promise<void> {
    try {
      // 招待情報を取得
      const inviteInfo = await this.getInviteByCode(inviteCode);
      if (!inviteInfo) {
        throw new Error('招待が見つかりません');
      }

      const familyRef = doc(db, 'families', inviteInfo.familyId);
      const familyDoc = await getDoc(familyRef);
      
      if (!familyDoc.exists()) {
        throw new Error('家族が見つかりません');
      }

      const familyData = familyDoc.data();
      
      // ユーザーを家族メンバーとして追加
      const updatedMembers = {
        ...familyData.members,
        [userId]: {
          role: 'parent', // デフォルトは親権限
          displayName: '',
          email: '',
          joinedAt: serverTimestamp(),
          canInvite: true,
          canManageChildren: true
        }
      };

      // 招待を使用済みにマーク
      const updatedInvites = {
        ...familyData.invites,
        [inviteInfo.id]: {
          ...familyData.invites[inviteInfo.id],
          used: true,
          usedBy: userId,
          usedAt: serverTimestamp()
        }
      };

      // Firestoreを更新
      await updateDoc(familyRef, {
        members: updatedMembers,
        invites: updatedInvites,
        updatedAt: serverTimestamp()
      });

      // ユーザープロフィールも更新
      await UserService.updateFamilyInfo(
        userId,
        inviteInfo.familyId,
        'parent'
      );

    } catch (error) {
      console.error('Error accepting invite:', error);
      throw error;
    }
  }
}