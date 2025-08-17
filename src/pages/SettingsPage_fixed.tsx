import React, { useState, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import { FamilyService } from '../services/familyService';
import { UserService } from '../services/userService';
import Button from '../components/Button';
import { PencilIcon, TrashIcon, ShareIcon } from '../components/Icon';
import { sanitize } from '../services/sanitization';
import type { FamilyMember, FamilyChild } from '../types';

// タブの種類
type SettingsTab = 'family' | 'personal' | 'notifications';

const SettingsPage: React.FC = () => {
  const { user, userProfile, family, refreshFamily, familyLoading } = useAppContext();
  const [activeTab, setActiveTab] = useState<SettingsTab>('family');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 家族管理状態
  const [showAddChild, setShowAddChild] = useState(false);
  const [childName, setChildName] = useState('');
  const [childGrade, setChildGrade] = useState('');
  const [childSchool, setChildSchool] = useState('');

  const hasFamily = !!family;
  const canManageFamily = userProfile?.familyRole === 'owner' || userProfile?.familyRole === 'parent';
  const isStandardOrAbove = userProfile?.planType === 'standard' || userProfile?.planType === 'pro';

  // デバッグ用ログ
  useEffect(() => {
    console.log('ユーザープロフィール:', userProfile);
    console.log('プランタイプ:', userProfile?.planType);
    console.log('スタンダード以上:', isStandardOrAbove);
    console.log('家族情報:', family);
  }, [userProfile, family, isStandardOrAbove]);

  // スタンダードプラン未満の場合は個人設定タブのみ（テスト用にコメントアウト）
  /*
  useEffect(() => {
    if (!isStandardOrAbove) {
      setActiveTab('personal');
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
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-blue-800 mb-2">家族管理機能（テスト版）</h3>
            <p className="text-blue-700 mb-4">
              通常はスタンダードプラン以上が必要ですが、テスト用に利用できます。
            </p>
          </div>

          {/* 家族作成ボタン（テスト用） */}
          {!hasFamily && (
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
                家族グループを作成（テスト）
              </Button>
            </div>
          )}

          {/* 家族が作成された場合の表示（テスト用） */}
          {hasFamily && family && (
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
                    <div className="flex gap-3">
                      <Button variant="secondary" size="sm">
                        <ShareIcon className="w-4 h-4 mr-2" />
                        家族を招待
                      </Button>
                      <Button variant="outline" size="sm">
                        QRコードで招待
                      </Button>
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
                    <div className="flex gap-3">
                      <Button 
                        variant="secondary" 
                        onClick={() => setShowAddChild(true)}
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

  const renderPersonalSettings = () => (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">個人設定</h2>
      <div className="space-y-4">
        <div>
          <p className="font-medium text-gray-800">プラン</p>
          <p className="text-sm text-gray-500">
            現在: {userProfile?.planType === 'free' ? 'フリープラン' : 
                   userProfile?.planType === 'standard' ? 'スタンダードプラン' : 'プロプラン'}
          </p>
        </div>
        <div>
          <p className="font-medium text-gray-800">使用状況</p>
          <p className="text-sm text-gray-500">
            今月: {userProfile?.currentMonthUsage || 0} / {userProfile?.monthlyLimit || 0} 回
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            onClick={() => setActiveTab('personal')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'personal'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            個人設定
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
      {activeTab === 'personal' && renderPersonalSettings()}
    </div>
  );
};

export default SettingsPage;
