import React, { useState, useEffect, useRef } from 'react';
import { updateProfile, updateEmail } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { useAppContext } from '../AppContext';
import { FamilyService } from '../services/familyService';
import { UserService } from '../services/userService';
import Button from '../components/Button';
import { PencilIcon, TrashIcon, ShareIcon } from '../components/Icon';
import { sanitize } from '../services/sanitization';
import type { FamilyMember, FamilyChild } from '../types';
import QRCode from 'qrcode';

// タブの種類
type SettingsTab = 'family' | 'account' | 'notifications';

const SettingsPage: React.FC = () => {
  const { user, userProfile, family, refreshFamily, familyLoading, logout, refreshProfile } = useAppContext();
  const [activeTab, setActiveTab] = useState<SettingsTab>('family');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 家族管理状態
  const [showAddChild, setShowAddChild] = useState(false);
  const [childName, setChildName] = useState('');
  const [childGrade, setChildGrade] = useState('');
  const [childSchool, setChildSchool] = useState('');

  // 子ども編集状態
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editChildName, setEditChildName] = useState('');
  const [editChildGrade, setEditChildGrade] = useState('');
  const [editChildSchool, setEditChildSchool] = useState('');

  // 招待関連の状態
  const [showInviteOptions, setShowInviteOptions] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');

  // アカウント管理の状態
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(user?.displayName || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'standard' | 'pro'>('free');
  const [showPlanSwitchModal, setShowPlanSwitchModal] = useState(false);
  const [showCancelPlanModal, setShowCancelPlanModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const hasFamily = !!family;
  const canManageFamily = userProfile?.familyRole === 'owner' || userProfile?.familyRole === 'parent';
  const isStandardOrAbove = userProfile?.planType === 'standard' || userProfile?.planType === 'pro';

  // プラン制限定義
  const planLimits = {
    free: { 
      maxMembers: 1, // 無料プランは家族共有なし（本人のみ）
      maxChildren: 0, // 無料プランは子ども登録なし
      monthlyLimit: 4,
      dataRetentionHours: 24
    },
    standard: { 
      maxMembers: 5, // 5人まで
      maxChildren: 4,
      monthlyLimit: 30,
      dataRetentionDays: 28 // 4週間
    },
    pro: { 
      maxMembers: 8, // 8人まで
      maxChildren: 6,
      monthlyLimit: 200,
      dataRetentionMonths: 6 // 6ヶ月
    }
  };

  const currentPlan = userProfile?.planType || 'free';
  const currentLimits = planLimits[currentPlan];

  // 現在の家族メンバー数チェック
  const getCurrentMemberCount = () => {
    if (!family) return 0;
    return Object.keys(family.members || {}).length;
  };

  const getCurrentChildrenCount = () => {
    if (!family) return 0;
    return Object.keys(family.children || {}).length;
  };

  // 招待可能かチェック
  const canInviteMore = () => {
    return getCurrentMemberCount() < currentLimits.maxMembers;
  };

  const canAddMoreChildren = () => {
    return getCurrentChildrenCount() < currentLimits.maxChildren;
  };

  // プロフィール更新処理
  const handleProfileSave = async () => {
    if (!user) return;
    
    // ニックネーム（表示名）の文字数チェック
    if (editDisplayName.length > 10) {
      setError('表示名は10文字以内で入力してください。');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Firebase Authのプロフィールを更新
      if (editDisplayName !== user.displayName) {
        await updateProfile(user, {
          displayName: editDisplayName
        });
      }
      
      if (editEmail !== user.email) {
        await updateEmail(user, editEmail);
      }
      
      // Firestoreのユーザープロフィールを更新
      await UserService.updateUserProfile(user.uid, {
        displayName: editDisplayName,
        email: editEmail
      });
      
      setIsEditingProfile(false);
      window.location.reload(); // 簡単な実装として再読み込み
    } catch (err: any) {
      console.error('プロフィール更新エラー:', err);
      if (err.code === 'auth/requires-recent-login') {
        setError('セキュリティのため、再ログインが必要です。');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('このメールアドレスは既に使用されています。');
      } else if (err.code === 'auth/invalid-email') {
        setError('無効なメールアドレスです。');
      } else {
        setError('プロフィールの更新に失敗しました。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // プラン変更処理（Stripe Checkoutを使用）
  // プラン変更処理（開発環境用：直接プラン変更、本番環境：Stripe Checkout）
  const handlePlanChange = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 開発環境では直接プラン変更を実行
      const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
      
      if (isDevelopment) {
        // 開発環境：UserServiceで直接プラン変更
        console.log('開発環境：直接プラン変更を実行');
        
        // トライアル期間を設定（14日後）
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 14);
        
        // プランを変更（トライアル情報付き）
        await UserService.changePlanWithTrial(
          user.uid, 
          selectedPlan, 
          trialEndDate,
          undefined, // stripeCustomerId (開発環境では未使用)
          undefined  // stripeSubscriptionId (開発環境では未使用)
        );
        
        setShowPlanChangeModal(false);
        
        // プロファイルを再読み込み
        if (refreshProfile) {
          await refreshProfile();
        }
        
        alert(`${selectedPlan === 'standard' ? 'スタンダード' : 'プロ'}プランの14日間無料トライアルが開始されました！`);
        window.location.reload();
      } else {
        // 本番環境：Stripe Checkoutを使用
        console.log('本番環境：Stripe Checkoutを実行');
        const { startCheckout } = await import('../services/checkoutService');
        const { STRIPE_PRICES } = await import('../services/stripe');
        
        // プランに応じた価格IDを設定
        const priceId = STRIPE_PRICES[selectedPlan].priceId;
        
        // Stripe Checkoutセッションを開始（14日トライアル付き）
        await startCheckout(priceId, selectedPlan);
        
        setShowPlanChangeModal(false);
      }
    } catch (err) {
      console.error('プラン変更エラー:', err);
      setError(err instanceof Error ? err.message : 'プランの変更に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // プラン変更モーダルを開く
  const openPlanChangeModal = (plan: 'standard' | 'pro') => {
    setSelectedPlan(plan);
    setShowPlanChangeModal(true);
  };

  // プラン切り替え処理（スタンダード⇔プロ）
  const handlePlanSwitch = async () => {
    if (!user) return;
    
    const newPlan = userProfile?.planType === 'standard' ? 'pro' : 'standard';
    setIsLoading(true);
    setError(null);
    
    try {
      await UserService.changePlan(user.uid, newPlan);
      setShowPlanSwitchModal(false);
      window.location.reload();
    } catch (err) {
      console.error('プラン切り替えエラー:', err);
      setError('プランの切り替えに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // プラン解約処理（無料に戻る）
  const handleCancelPlan = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await UserService.changePlan(user.uid, 'free');
      setShowCancelPlanModal(false);
      window.location.reload();
    } catch (err) {
      console.error('プラン解約エラー:', err);
      setError('プランの解約に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // アカウント削除処理
  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await UserService.deleteAccount(user.uid);
      setShowDeleteAccountModal(false);
      // ログアウトしてランディングページへ
      logout();
      window.location.href = '/landing';
    } catch (err) {
      console.error('アカウント削除エラー:', err);
      setError('アカウントの削除に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // テストパパ専用：プロフィール強制リセット（開発用）
  const handleForceResetProfile = async () => {
    if (!user || user.displayName !== 'テストパパ') return;
    
    setIsLoading(true);
    try {
      // Firestoreに直接プロフィールを作成/上書き
      const userRef = doc(getFirestore(), 'customers', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || 'test-papa@example.com',
        displayName: user.displayName || 'テストパパ',
        emailVerified: user.emailVerified || false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        
        // プラン情報（無料プラン）
        planType: 'free',
        monthlyLimit: 4, // 無料プランは4回まで
        
        // 使用量（初期化）
        currentMonthUsage: 0,
        lastResetDate: new Date(),
        
        // 家族（初期は未所属）
        familyRole: 'owner',
        
        // プロファイル詳細
        profile: {
          birthdate: '',
          country: 'JP',
          location: 'テスト用',
        }
      }, { merge: false }); // 既存データを完全に上書き

      console.log('テストパパのプロフィールを強制作成しました');
      
      // AppContextのプロフィールを再読み込み
      if (refreshProfile) {
        await refreshProfile();
      }
      
      alert('プロフィールを強制リセットしました。ページを再読み込みしてください。');
      window.location.reload();
    } catch (error) {
      console.error('プロフィールリセットエラー:', error);
      alert('プロフィールリセットに失敗しました。エラー: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  // デバッグ用ログ
  useEffect(() => {
    console.log('ユーザープロフィール:', userProfile);
    console.log('プランタイプ:', userProfile?.planType);
    console.log('スタンダード以上:', isStandardOrAbove);
    console.log('家族情報:', family);
  }, [userProfile, family, isStandardOrAbove]);

  // スタンダードプラン未満の場合はアカウント管理タブのみ（テスト用にコメントアウト）
  /*
  useEffect(() => {
    if (!isStandardOrAbove) {
      setActiveTab('account');
    }
  }, [isStandardOrAbove]);
  */

  const handleCreateFamily = async () => {
    console.log('家族作成開始');
    console.log('user:', user);
    console.log('userProfile:', userProfile);
    
    if (!user || !userProfile) {
      console.log('ユーザーまたはプロフィールがありません');
      setError('ユーザー情報が見つかりません');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('家族作成処理開始...');

      const familyId = await FamilyService.createFamily(user.uid, userProfile.displayName);
      console.log('家族を作成しました:', familyId);
      
      // ユーザープロフィールを更新
      console.log('ユーザープロフィール更新中...');
      await UserService.updateFamilyInfo(user.uid, familyId, 'owner');
      console.log('ユーザープロフィール更新完了');
      
      console.log('家族情報再取得中...');
      await refreshFamily();
      console.log('家族情報再取得完了');
      
    } catch (error) {
      console.error('家族作成エラー:', error);
      setError(`家族の作成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsLoading(false);
      console.log('家族作成処理終了');
    }
  };

  const handleAddChild = async () => {
    if (!family || !user || !childName.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      await FamilyService.addChild(family.id, {
        name: sanitize(childName),
        grade: childGrade || undefined,
        school: childSchool || undefined,
        userId: null,
        parentId: user.uid,
        isRegistered: false,
        inviteCode: null
      });

      // フォームリセット
      setChildName('');
      setChildGrade('');
      setChildSchool('');
      setShowAddChild(false);

      await refreshFamily();
      
    } catch (error) {
      console.error('子ども追加エラー:', error);
      setError('子どもの追加に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 子どもの編集開始
  const handleEditChild = (childId: string, child: FamilyChild) => {
    setEditingChildId(childId);
    setEditChildName(child.name);
    setEditChildGrade(child.grade || '');
    setEditChildSchool(child.school || '');
  };

  // 子どもの編集保存
  const handleSaveChildEdit = async () => {
    if (!family || !editingChildId || !editChildName.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      await FamilyService.updateChild(family.id, editingChildId, {
        name: sanitize(editChildName),
        grade: editChildGrade || undefined,
        school: editChildSchool || undefined
      });

      setEditingChildId(null);
      setEditChildName('');
      setEditChildGrade('');
      setEditChildSchool('');

      await refreshFamily();
      
    } catch (error) {
      console.error('子ども更新エラー:', error);
      setError('子どもの情報更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 子どもの編集キャンセル
  const handleCancelChildEdit = () => {
    setEditingChildId(null);
    setEditChildName('');
    setEditChildGrade('');
    setEditChildSchool('');
  };

  // 子どもの招待
  const handleInviteChild = async (childId: string) => {
    if (!family || !user) return;

    try {
      setIsLoading(true);
      setError(null);

      const inviteCode = await FamilyService.createChildInvite(family.id, childId, user.uid);
      const inviteUrl = `${window.location.origin}/invite/child/${inviteCode}`;
      
      await navigator.clipboard.writeText(inviteUrl);
      alert('子ども用の招待リンクをクリップボードにコピーしました');
      
    } catch (error) {
      console.error('子ども招待エラー:', error);
      setError('子どもの招待に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 子どもの削除
  const handleDeleteChild = async (childId: string, childName: string) => {
    if (!family || !window.confirm(`${childName}を削除しますか？`)) return;

    try {
      setIsLoading(true);
      setError(null);

      await FamilyService.removeChild(family.id, childId);
      await refreshFamily();
      
    } catch (error) {
      console.error('子ども削除エラー:', error);
      setError('子どもの削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 招待メール処理
  const handleEmailInvite = async () => {
    if (!family || !user || !inviteEmail.trim()) return;

    // プラン制限チェック
    if (!canInviteMore()) {
      setError(`${currentPlan}プランでは最大${currentLimits.maxMembers}人まで招待できます。プランをアップグレードしてください。`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await FamilyService.sendEmailInvite(inviteEmail, family.id, user.uid);
      alert('招待メールを送信しました');
      setShowInviteModal(false);
      setInviteEmail('');
      
    } catch (error) {
      console.error('メール招待エラー:', error);
      setError(error instanceof Error ? error.message : '招待の送信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // QRコード生成処理
  const handleGenerateQR = async () => {
    if (!family || !user) return;

    try {
      setIsLoading(true);
      setError(null);

      const inviteCode = await FamilyService.createFamilyInvite(family.id, user.uid);
      const inviteUrl = `${window.location.origin}/invite/${inviteCode}`;
      
      setQrCodeData(inviteUrl);
      setShowQRModal(true);
      
    } catch (error) {
      console.error('QRコード生成エラー:', error);
      setError(error instanceof Error ? error.message : 'QRコードの生成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 招待リンクをコピー
  const handleCopyInviteLink = async () => {
    if (!family || !user) return;

    try {
      setIsLoading(true);
      setError(null);

      const inviteCode = await FamilyService.createFamilyInvite(family.id, user.uid);
      const inviteUrl = `${window.location.origin}/invite/${inviteCode}`;
      
      await navigator.clipboard.writeText(inviteUrl);
      alert('招待リンクをクリップボードにコピーしました');
      setShowInviteOptions(false);
      
    } catch (error) {
      console.error('招待リンクコピーエラー:', error);
      setError(error instanceof Error ? error.message : '招待リンクのコピーに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // QRコード生成のuseEffect
  useEffect(() => {
    if (showQRModal && qrCodeData && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrCodeData, {
        width: 192,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }).catch((error) => {
        console.error('QRコード生成エラー:', error);
      });
    }
  }, [showQRModal, qrCodeData]);

  // QRコンポーネント
  const QRCanvas = () => (
    <canvas 
      ref={canvasRef}
      className="w-48 h-48 border-2 border-gray-200 rounded-lg"
    />
  );

  const renderFamilyManagement = () => {
    // デバッグ情報を表示
    console.log('renderFamilyManagement 実行');
    console.log('hasFamily:', hasFamily);
    console.log('family:', family);
    console.log('isStandardOrAbove:', isStandardOrAbove);
    
    // テスト用: プラン制限を一時的に無効化
    if (!isStandardOrAbove) {
      return (
        <div className="space-y-6">
          {/* デバッグ情報 */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
            <h3 className="text-sm font-bold text-yellow-800 mb-2">デバッグ情報</h3>
            <p className="text-xs text-yellow-700">
              hasFamily: {hasFamily ? 'true' : 'false'}<br/>
              family: {family ? 'あり' : 'なし'}<br/>
              familyLoading: {familyLoading ? 'true' : 'false'}
            </p>
          </div>
          
          {/* プラン制限通知 */}
          {currentPlan === 'free' ? (
            <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl">
              <h3 className="text-lg font-bold text-orange-800 mb-2">家族管理機能（有料プラン限定）</h3>
              <p className="text-orange-700 mb-4">
                家族管理機能は<strong>スタンダードプラン</strong>以上でご利用いただけます。
                プランをアップグレードして、家族みんなでおたよりやTODOを共有しましょう！
              </p>
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={() => setActiveTab('account')}
                >
                  プランをアップグレード
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
              <h3 className="text-lg font-bold text-blue-800 mb-2">家族管理機能</h3>
              <p className="text-blue-700 mb-4">
                家族メンバー最大{currentLimits.maxMembers}人、お子様最大{currentLimits.maxChildren}人まで招待できます。
              </p>
            </div>
          )}

          {/* 家族作成ボタン */}
          {!hasFamily && currentPlan !== 'free' && (
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">家族の管理</h2>
              <p className="text-gray-600 mb-6">
                家族みんなでおたよりやTODOを共有しましょう！
                まずは家族グループを作成してください。
              </p>
              <Button 
                onClick={handleCreateFamily}
                isLoading={isLoading}
                disabled={isLoading}
              >
                家族グループを作成
              </Button>
            </div>
          )}

          {/* 家族が作成された場合の表示 */}
          {hasFamily && family && currentPlan !== 'free' && (
            <div className="space-y-6">
              {/* 家族メンバー */}
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">家族メンバー</h2>
                <div className="space-y-3">
                  {Object.entries(family.members || {}).map(([userId, member]) => {
                    const typedMember = member as FamilyMember;
                    return (
                      <div key={userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">
                            {typedMember.name}
                            {userId === user?.uid && <span className="text-sm text-gray-500 ml-2">(あなた)</span>}
                          </p>
                          <p className="text-sm text-gray-500">
                            {typedMember.role === 'owner' ? '管理者' : typedMember.role === 'parent' ? '親' : '子ども'}
                          </p>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(typedMember.joinedAt).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* 家族招待ボタン */}
                {canManageFamily && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm text-gray-600">
                        メンバー: {getCurrentMemberCount()}/{currentLimits.maxMembers}人
                      </div>
                    </div>
                    <div className="flex gap-3 relative">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => {
                          if (!canInviteMore()) {
                            setError(`${currentPlan}プランでは最大${currentLimits.maxMembers}人まで招待できます。プランをアップグレードしてください。`);
                            return;
                          }
                          setShowInviteOptions(!showInviteOptions);
                        }}
                        disabled={!canInviteMore()}
                      >
                        <ShareIcon className="w-4 h-4 mr-2" />
                        家族を招待
                      </Button>

                      {/* 招待オプションメニュー */}
                      {showInviteOptions && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <button
                            onClick={() => {
                              setShowInviteOptions(false);
                              setShowInviteModal(true);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 text-sm border-b border-gray-100"
                          >
                            📧 メールで招待
                          </button>
                          <button
                            onClick={() => {
                              setShowInviteOptions(false);
                              handleGenerateQR();
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 text-sm border-b border-gray-100"
                          >
                            📱 QRコードで招待
                          </button>
                          <button
                            onClick={() => {
                              setShowInviteOptions(false);
                              handleCopyInviteLink();
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 text-sm"
                          >
                            🔗 招待リンクをコピー
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 子ども管理 */}
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">子ども</h2>
                
                {Object.keys(family.children || {}).length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {Object.entries(family.children || {}).map(([childId, child]) => {
                      const typedChild = child as FamilyChild;
                      const isEditing = editingChildId === childId;
                      
                      return (
                        <div key={childId} className="p-3 bg-gray-50 rounded-lg">
                          {isEditing ? (
                            // 編集モード
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input
                                  type="text"
                                  value={editChildName}
                                  onChange={e => setEditChildName(e.target.value)}
                                  placeholder="子どもの名前"
                                  className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                                <input
                                  type="text"
                                  value={editChildGrade}
                                  onChange={e => setEditChildGrade(e.target.value)}
                                  placeholder="学年（例：小学3年）"
                                  className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                                <input
                                  type="text"
                                  value={editChildSchool}
                                  onChange={e => setEditChildSchool(e.target.value)}
                                  placeholder="学校名"
                                  className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={handleCancelChildEdit}
                                  disabled={isLoading}
                                >
                                  キャンセル
                                </Button>
                                <Button 
                                  variant="primary" 
                                  size="sm" 
                                  onClick={handleSaveChildEdit}
                                  disabled={isLoading || !editChildName.trim()}
                                >
                                  {isLoading ? '保存中...' : '保存'}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // 表示モード
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-800">{typedChild.name}</p>
                                <div className="text-sm text-gray-500">
                                  {typedChild.grade && <span>{typedChild.grade}</span>}
                                  {typedChild.school && <span className="ml-2">{typedChild.school}</span>}
                                  <span className="ml-2">
                                    {typedChild.isRegistered ? '✓登録済み' : '⚬未登録'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {!typedChild.isRegistered && canManageFamily && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleInviteChild(childId)}
                                    disabled={isLoading}
                                    title="子ども用の招待リンクを作成"
                                  >
                                    招待
                                  </Button>
                                )}
                                {canManageFamily && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEditChild(childId, typedChild)}
                                    disabled={isLoading}
                                    title="子どもの情報を編集"
                                  >
                                    <PencilIcon className="w-4 h-4" />
                                  </Button>
                                )}
                                {canManageFamily && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDeleteChild(childId, typedChild.name)}
                                    disabled={isLoading}
                                    title="子どもを削除"
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 mb-4">まだ子どもが登録されていません。</p>
                )}

                {/* 子ども追加フォーム */}
                {showAddChild ? (
                  <div className="p-4 bg-orange-50 rounded-lg space-y-4">
                    <h3 className="font-bold text-lg text-gray-800">子どもの追加</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          お名前 *
                        </label>
                        <input 
                          type="text"
                          value={childName}
                          onChange={(e) => setChildName(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="田中一郎"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          学年
                        </label>
                        <input 
                          type="text"
                          value={childGrade}
                          onChange={(e) => setChildGrade(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="小学3年生"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        学校名
                      </label>
                      <input 
                        type="text"
                        value={childSchool}
                        onChange={(e) => setChildSchool(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        placeholder="○○小学校"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleAddChild}
                        isLoading={isLoading}
                        disabled={!childName.trim() || isLoading}
                      >
                        追加
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={() => {
                          setShowAddChild(false);
                          setChildName('');
                          setChildGrade('');
                          setChildSchool('');
                        }}
                      >
                        キャンセル
                      </Button>
                    </div>
                  </div>
                ) : (
                  canManageFamily && (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        子ども: {getCurrentChildrenCount()}/{currentLimits.maxChildren}人
                      </div>
                      <Button 
                        variant="secondary" 
                        onClick={() => {
                          if (!canAddMoreChildren()) {
                            setError(`${currentPlan}プランでは最大${currentLimits.maxChildren}人まで登録できます。プランをアップグレードしてください。`);
                            return;
                          }
                          setShowAddChild(true);
                        }}
                        disabled={!canAddMoreChildren()}
                      >
                        子どもを追加
                      </Button>
                    </div>
                  )
                )}
              </div>
              
              {/* 成功メッセージ */}
              <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                <p className="text-sm text-green-700">✅ 家族グループが正常に作成されました！</p>
                <p className="text-xs text-green-600 mt-1">
                  家族メンバーや子どもを招待して、みんなでおたよりを共有しましょう。
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (!hasFamily) {
      return (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">家族の管理</h2>
          <p className="text-gray-600 mb-6">
            家族みんなでおたよりやTODOを共有しましょう！
            まずは家族グループを作成してください。
          </p>
          <Button 
            onClick={handleCreateFamily}
            isLoading={isLoading}
            disabled={isLoading}
          >
            家族グループを作成
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* 家族メンバー */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">家族メンバー</h2>
          <div className="space-y-3">
            {Object.entries(family.members).map(([userId, member]) => {
              const typedMember = member as FamilyMember;
              return (
                <div key={userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">
                      {typedMember.name}
                      {userId === user?.uid && <span className="text-sm text-gray-500 ml-2">(あなた)</span>}
                    </p>
                    <p className="text-sm text-gray-500">
                      {typedMember.role === 'owner' ? '管理者' : typedMember.role === 'parent' ? '親' : '子ども'}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(typedMember.joinedAt).toLocaleDateString('ja-JP')}
                  </div>
                </div>
              );
            })}
          </div>
          
          {canManageFamily && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button variant="secondary" size="sm">
                <ShareIcon className="w-4 h-4 mr-2" />
                家族を招待
              </Button>
            </div>
          )}
        </div>

        {/* 子ども管理 */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">子ども</h2>
          
          {Object.keys(family.children).length > 0 ? (
            <div className="space-y-3 mb-4">
              {Object.entries(family.children).map(([childId, child]) => {
                const typedChild = child as FamilyChild;
                return (
                  <div key={childId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{typedChild.name}</p>
                      <div className="text-sm text-gray-500">
                        {typedChild.grade && <span>{typedChild.grade}</span>}
                        {typedChild.school && <span className="ml-2">{typedChild.school}</span>}
                        <span className="ml-2">
                          {typedChild.isRegistered ? '✓登録済み' : '⚬未登録'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!typedChild.isRegistered && (
                        <Button variant="outline" size="sm">
                          招待
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 mb-4">まだ子どもが登録されていません。</p>
          )}

          {showAddChild ? (
            <div className="p-4 bg-orange-50 rounded-lg space-y-4">
              <h3 className="font-bold text-lg text-gray-800">子どもの追加</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    お名前 *
                  </label>
                  <input 
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="田中一郎"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    学年
                  </label>
                  <input 
                    type="text"
                    value={childGrade}
                    onChange={(e) => setChildGrade(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="小学3年生"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  学校名
                </label>
                <input 
                  type="text"
                  value={childSchool}
                  onChange={(e) => setChildSchool(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="○○小学校"
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleAddChild}
                  isLoading={isLoading}
                  disabled={!childName.trim() || isLoading}
                >
                  追加
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setShowAddChild(false);
                    setChildName('');
                    setChildGrade('');
                    setChildSchool('');
                  }}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          ) : (
            canManageFamily && (
              <Button 
                variant="secondary" 
                onClick={() => setShowAddChild(true)}
              >
                子どもを追加
              </Button>
            )
          )}
        </div>

        {/* 共有設定 */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">共有設定</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">おたより共有</p>
                <p className="text-sm text-gray-500">アップロードしたおたよりを家族と共有</p>
              </div>
              <div className="text-sm font-medium text-orange-600">
                {family.settings.shareNotices ? 'ON' : 'OFF'}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">TODO共有</p>
                <p className="text-sm text-gray-500">タスクや予定を家族と共有</p>
              </div>
              <div className="text-sm font-medium text-orange-600">
                {family.settings.shareTasks ? 'ON' : 'OFF'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAccountManagement = () => {

    const getPlanName = (planType: string) => {
      switch (planType) {
        case 'free': return '無料プラン';
        case 'standard': return 'スタンダードプラン';
        case 'pro': return 'プロプラン';
        default: return '無料プラン';
      }
    };

    // トライアル状況をチェック
    const getTrialInfo = () => {
      if (!userProfile?.trialEndDate || !userProfile?.isTrialActive) {
        return null;
      }

      const trialEndDate = new Date(userProfile.trialEndDate);
      const now = new Date();
      const daysLeft = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        isActive: daysLeft > 0,
        daysLeft: Math.max(0, daysLeft),
        endDate: trialEndDate.toLocaleDateString('ja-JP')
      };
    };

    const trialInfo = getTrialInfo();

    const getPlanFeatures = (planType: string) => {
      switch (planType) {
        case 'free':
          return [
            'AI解析：月4回まで',
            'TODOリスト・解析結果：24時間で自動削除',
            '家族と共有：なし（本人のみ）',
            '通知・カレンダー：なし'
          ];
        case 'standard':
          return [
            'AI解析：月30回まで',
            'TODOリスト・解析結果：4週間保存',
            '家族と共有：5人まで',
            'SNS通知・カレンダー出力・自動同期'
          ];
        case 'pro':
          return [
            'AI解析：月200回まで',
            'TODOリスト・解析結果：6ヶ月保存',
            '家族と共有：8人まで',
            'SNS通知・カレンダー出力・自動同期'
          ];
        default:
          return [
            'AI解析：月4回まで',
            'TODOリスト・解析結果：24時間で自動削除',
            '家族と共有：なし（本人のみ）',
            '通知・カレンダー：なし'
          ];
      }
    };

    return (
      <div className="space-y-6">
        {/* プラン情報セクション */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-6">プラン情報</h2>
          
          {/* 現在のプラン */}
          <div className="border rounded-lg p-4 mb-6 bg-orange-50 border-orange-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">現在のご利用プラン</p>
                <h3 className="text-lg font-semibold text-gray-800">
                  {getPlanName(userProfile?.planType || 'free')}
                  {trialInfo?.isActive && (
                    <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                      トライアル中
                    </span>
                  )}
                </h3>
                {/* トライアル情報 */}
                {trialInfo?.isActive && (
                  <p className="text-sm text-green-600 mt-1">
                    無料トライアル残り{trialInfo.daysLeft}日（{trialInfo.endDate}まで）
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-600">
                  {userProfile?.planType === 'free' ? '¥0/月' : 
                   userProfile?.planType === 'standard' ? '¥100/月' : '¥500/月'}
                </div>
                {trialInfo?.isActive && (
                  <p className="text-sm text-green-600">今なら無料！</p>
                )}
              </div>
            </div>
            
            {/* 使用状況 */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>今月の利用状況</span>
                <span>
                  {userProfile?.currentMonthUsage || 0} / {
                    userProfile?.monthlyLimit || 
                    (userProfile?.planType === 'free' ? 4 : 
                     userProfile?.planType === 'standard' ? 30 : 200)
                  } 回
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full" 
                  style={{
                    width: `${Math.min(((userProfile?.currentMonthUsage || 0) / (
                      userProfile?.monthlyLimit || 
                      (userProfile?.planType === 'free' ? 4 : 
                       userProfile?.planType === 'standard' ? 30 : 200)
                    )) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>

            {/* 現在プランの機能一覧 */}
            <div className="space-y-2">
              {getPlanFeatures(userProfile?.planType || 'free').map((feature, index) => (
                <div key={index} className="flex items-center text-sm text-gray-700">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* プランアップグレードボタン */}
          {userProfile?.planType === 'free' && (
            <div className="text-center">
              <Button
                variant="primary"
                onClick={() => openPlanChangeModal('standard')}
                className="mr-4"
              >
                スタンダード14日間無料トライアル
              </Button>
              <Button
                variant="secondary"
                onClick={() => openPlanChangeModal('pro')}
              >
                プロ14日間無料トライアル
              </Button>
            </div>
          )}
          
          {userProfile?.planType === 'standard' && !trialInfo?.isActive && (
            <div className="text-center">
              <Button
                variant="primary"
                onClick={() => openPlanChangeModal('pro')}
              >
                プロ14日間無料トライアル
              </Button>
            </div>
          )}

          {/* トライアル中の場合の表示 */}
          {trialInfo?.isActive && (
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">
                🎉 14日間無料トライアル中！
              </h4>
              <p className="text-sm text-green-700 mb-3">
                すべての機能を無料でお試しいただけます。
                あと{trialInfo.daysLeft}日でトライアルが終了します。
              </p>
              <p className="text-xs text-green-600">
                トライアル終了後は自動的に有料プランに移行します。
                いつでもキャンセル可能です。
              </p>
            </div>
          )}

          {/* プラン比較表 */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-800 mb-4">プラン比較</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-3 text-left">機能</th>
                    <th className="border border-gray-300 p-3 text-center">無料プラン</th>
                    <th className="border border-gray-300 p-3 text-center">スタンダードプラン</th>
                    <th className="border border-gray-300 p-3 text-center">プロプラン</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-3">月間利用回数</td>
                    <td className="border border-gray-300 p-3 text-center">4回まで</td>
                    <td className="border border-gray-300 p-3 text-center">30回まで</td>
                    <td className="border border-gray-300 p-3 text-center">200回まで</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">TODOリスト・解析結果の保存期間</td>
                    <td className="border border-gray-300 p-3 text-center">24時間で自動削除</td>
                    <td className="border border-gray-300 p-3 text-center">4週間保存</td>
                    <td className="border border-gray-300 p-3 text-center">6ヶ月保存</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">家族共有</td>
                    <td className="border border-gray-300 p-3 text-center">なし（本人のみ）</td>
                    <td className="border border-gray-300 p-3 text-center">5人まで</td>
                    <td className="border border-gray-300 p-3 text-center">8人まで</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">通知・カレンダー</td>
                    <td className="border border-gray-300 p-3 text-center">なし</td>
                    <td className="border border-gray-300 p-3 text-center">SNS通知・カレンダー出力・自動同期</td>
                    <td className="border border-gray-300 p-3 text-center">SNS通知・カレンダー出力・自動同期</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">月額料金</td>
                    <td className="border border-gray-300 p-3 text-center">¥0</td>
                    <td className="border border-gray-300 p-3 text-center">¥100</td>
                    <td className="border border-gray-300 p-3 text-center">¥500</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 登録情報セクション */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">登録情報</h2>
            {!isEditingProfile && (
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditingProfile(true);
                  setEditDisplayName(user?.displayName || '');
                  setEditEmail(user?.email || '');
                }}
                icon={<PencilIcon className="w-4 h-4" />}
              >
                編集
              </Button>
            )}
          </div>

          {isEditingProfile ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  表示名（10文字以内）
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => {
                    // ニックネーム（表示名）は10文字以内に制限
                    if (e.target.value.length <= 10) {
                      setEditDisplayName(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="primary"
                  onClick={handleProfileSave}
                  disabled={isLoading}
                >
                  {isLoading ? '保存中...' : '保存'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsEditingProfile(false)}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">表示名</p>
                <p className="text-gray-900">{user?.displayName || '未設定'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">メールアドレス</p>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">登録日</p>
                <p className="text-gray-900">
                  {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('ja-JP') : '不明'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">家族での役割</p>
                <p className="text-gray-900">
                  {userProfile?.familyRole === 'owner' ? 'オーナー' : 
                   userProfile?.familyRole === 'parent' ? '保護者' : 
                   userProfile?.familyRole === 'child' ? '子ども' : '個人'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 危険なアクション */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-4">アカウント操作</h3>
            <div className="space-y-3">
              
              {/* プラン切り替え（スタンダード⇔プロのみ） */}
              {(userProfile?.planType === 'standard' || userProfile?.planType === 'pro') && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">プラン切り替え</p>
                    <p className="text-xs text-gray-500">
                      {userProfile?.planType === 'standard' ? 'プロプランに変更' : 'スタンダードプランに変更'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPlanSwitchModal(true)}
                    className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  >
                    変更
                  </button>
                </div>
              )}

              {/* プラン解約 */}
              {userProfile?.planType !== 'free' && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">プラン解約</p>
                    <p className="text-xs text-gray-500">無料プランに戻ります</p>
                  </div>
                  <button
                    onClick={() => setShowCancelPlanModal(true)}
                    className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                  >
                    解約
                  </button>
                </div>
              )}

              {/* アカウント削除 */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">アカウント削除</p>
                  <p className="text-xs text-gray-500">この操作は取り消せません</p>
                </div>
                <button
                  onClick={() => setShowDeleteAccountModal(true)}
                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">設定</h1>

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {/* 常に家族管理タブを表示 */}
          <button
            onClick={() => setActiveTab('family')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'family'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            家族の管理
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'account'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            アカウント管理
          </button>
        </nav>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6">
          <p className="text-red-700">{error}</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setError(null)}
            className="mt-2"
          >
            閉じる
          </Button>
        </div>
      )}

      {/* タブコンテンツ */}
      {activeTab === 'family' && renderFamilyManagement()}
      {activeTab === 'account' && renderAccountManagement()}

      {/* メール招待モーダル */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">メールで家族を招待</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input 
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="example@email.com"
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleEmailInvite}
                  isLoading={isLoading}
                  disabled={!inviteEmail.trim() || isLoading}
                  className="flex-1"
                >
                  招待を送信
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                  }}
                  className="flex-1"
                >
                  キャンセル
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QRコードモーダル */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">QRコードで招待</h3>
            <div className="space-y-4">
              {/* QRコード表示エリア */}
              <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                <QRCanvas />
                <p className="text-sm text-gray-600 text-center mt-4">
                  このQRコードをスキャンして家族に参加してもらいましょう
                </p>
              </div>
              
              {/* 招待URL */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  招待URL
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={qrCodeData}
                    readOnly
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 bg-white text-xs"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(qrCodeData)}
                  >
                    コピー
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="secondary"
                  onClick={() => {
                    setShowQRModal(false);
                    setQrCodeData('');
                  }}
                  className="flex-1"
                >
                  閉じる
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 招待オプションメニュー外をクリックしたときに閉じる */}
      {showInviteOptions && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowInviteOptions(false)}
        />
      )}

      {/* プラン変更モーダル */}
      {showPlanChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {selectedPlan === 'standard' ? 'スタンダードプラン' : 'プロプラン'}への変更
            </h3>
            
            <div className="mb-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">プラン詳細</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>月額料金:</span>
                    <span className="font-semibold">
                      {selectedPlan === 'standard' ? '¥100' : '¥500'}/月
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI解析回数:</span>
                    <span className="font-semibold">
                      {selectedPlan === 'standard' ? '月30回まで' : '月200回まで'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>保存期間:</span>
                    <span className="font-semibold">
                      {selectedPlan === 'standard' ? '4週間' : '6ヶ月'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>家族共有:</span>
                    <span className="font-semibold">
                      {selectedPlan === 'standard' ? '5人まで' : '8人まで'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 無料トライアル情報 */}
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <h5 className="font-semibold text-green-800">14日間無料トライアル</h5>
                </div>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• 最初の14日間は無料でお試しいただけます</li>
                  <li>• トライアル期間中はすべての機能をご利用可能</li>
                  <li>• いつでもキャンセル可能（料金はかかりません）</li>
                  <li>• トライアル終了後、自動的に有料プランに移行</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>📋 次のステップ:</strong> クレジットカード情報を登録してトライアルを開始します。
                  トライアル期間中は料金が発生しません。
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="primary"
                onClick={handlePlanChange}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? '処理中...' : '14日間無料トライアルを開始'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowPlanChangeModal(false)}
                className="flex-1"
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* プラン切り替えモーダル */}
      {showPlanSwitchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">プラン切り替え</h3>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                {userProfile?.planType === 'standard' 
                  ? 'スタンダードプランからプロプランに切り替えますか？' 
                  : 'プロプランからスタンダードプランに切り替えますか？'}
              </p>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>切り替え後:</strong> 
                  {userProfile?.planType === 'standard' 
                    ? ' ¥500/月、月200回利用、6ヶ月保存、8人まで共有' 
                    : ' ¥100/月、月30回利用、4週間保存、5人まで共有'}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="primary"
                onClick={handlePlanSwitch}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? '切り替え中...' : '切り替える'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowPlanSwitchModal(false)}
                className="flex-1"
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* プラン解約モーダル */}
      {showCancelPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">プラン解約</h3>
            
            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                <p className="text-yellow-800 text-sm mb-2">
                  <strong>解約の影響:</strong>
                </p>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• AI解析が月4回に制限されます</li>
                  <li>• データは24時間後に自動削除されます</li>
                  <li>• 家族共有機能が利用できなくなります</li>
                  <li>• 通知・カレンダー機能が停止します</li>
                </ul>
              </div>
              
              <p className="text-gray-600 text-sm">
                解約は即座に適用されます。いつでも再度アップグレードできます。
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={handleCancelPlan}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? '解約中...' : '解約する'}
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowCancelPlanModal(false)}
                className="flex-1"
              >
                継続する
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* アカウント削除モーダル */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-red-600 mb-4">アカウント削除</h3>
            
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                <p className="text-red-800 text-sm mb-2">
                  <strong>⚠️ 重要:</strong> この操作は取り消せません
                </p>
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• すべてのデータが完全に削除されます</li>
                  <li>• 家族との共有も解除されます</li>
                  <li>• アップロードした画像・履歴が消去されます</li>
                  <li>• 同じアカウントでの再登録はできません</li>
                </ul>
              </div>
              
              <p className="text-gray-600 text-sm">
                本当にアカウントを削除しますか？この操作を実行すると、すべてのデータが永続的に失われます。
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="primary"
                onClick={() => setShowDeleteAccountModal(false)}
                className="flex-1"
              >
                キャンセル
              </Button>
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {isLoading ? '削除中...' : '完全に削除する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* デバッグ情報（開発用） */}
      <div className="mt-8 bg-gray-100 rounded-lg p-4">
        <h3 className="font-medium text-gray-700 mb-2">デバッグ情報（開発用）:</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <div><strong>ユーザーID:</strong> {user?.uid}</div>
          <div><strong>メール:</strong> {user?.email}</div>
          <div><strong>表示名:</strong> {user?.displayName}</div>
          <div><strong>userProfileオブジェクト:</strong> {userProfile ? 'あり' : '❌ なし'}</div>
          <div><strong>プランタイプ:</strong> {userProfile?.planType || 'unknown'} 
            {userProfile?.planType === undefined && ' (undefined)'}
            {userProfile?.planType === null && ' (null)'}
          </div>
          <div><strong>月間制限:</strong> {userProfile?.monthlyLimit || 'unknown'}</div>
          <div><strong>今月の使用量:</strong> {userProfile?.currentMonthUsage || 0}</div>
          <div><strong>家族ID:</strong> {userProfile?.familyId || 'なし'}</div>
          <div><strong>家族での役割:</strong> {userProfile?.familyRole || 'なし'}</div>
          <div><strong>トライアル状況:</strong> {userProfile?.isTrialActive ? '✅ アクティブ' : '❌ 非アクティブ'}</div>
          <div><strong>トライアル終了日:</strong> {userProfile?.trialEndDate ? new Date(userProfile.trialEndDate).toLocaleDateString('ja-JP') : 'なし'}</div>
          <div><strong>環境:</strong> {import.meta.env.DEV ? '開発環境' : '本番環境'}</div>
          <div><strong>テストパパか？:</strong> {user?.displayName === 'テストパパ' ? '✅ Yes' : '❌ No'}</div>
          <div><strong>RAWデータ:</strong> {JSON.stringify(userProfile, null, 2)}</div>
          {user?.displayName === 'テストパパ' && (
            <div className="mt-4 pt-4 border-t border-gray-300">
              <button
                onClick={handleForceResetProfile}
                disabled={isLoading}
                className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
              >
                🔄 プロフィール強制リセット（テスト用）
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
