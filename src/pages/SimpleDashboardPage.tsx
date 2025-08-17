import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { UploadIcon, BellIcon, CalendarIcon } from '../components/Icon';

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, usageInfo, isLoading } = useAppContext();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              ログインが必要です
            </h2>
            <p className="mt-4 text-gray-600">
              ダッシュボードにアクセスするには、ログインしてください。
            </p>
            <div className="mt-6">
              <Link
                to="/login"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
              >
                ログインする
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            こんにちは、{user?.displayName || 'ゲスト'}さん！
          </h1>
          <p className="mt-2 text-gray-600">
            おたよりポン！へようこそ。まずはおたよりをアップロードしてみましょう。
          </p>
        </div>

        {/* 使用状況カード */}
        {usageInfo && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">使用状況</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">プラン</p>
                <p className="text-2xl font-bold text-blue-600">
                  {usageInfo.planType === 'free' ? '無料プラン' : 
                   usageInfo.planType === 'standard' ? 'スタンダード' : 'プロプラン'}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">残り使用回数</p>
                <p className="text-2xl font-bold text-green-600">{usageInfo.remaining}回</p>
              </div>
              <div className={`p-4 rounded-lg ${usageInfo.canUse ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-sm text-gray-600">ステータス</p>
                <p className={`text-2xl font-bold ${usageInfo.canUse ? 'text-green-600' : 'text-red-600'}`}>
                  {usageInfo.canUse ? '利用可能' : '制限中'}
                </p>
              </div>
            </div>
            {usageInfo.needsUpgrade && (
              <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                <p className="text-orange-800">
                  月間利用制限に達しました。より多くご利用いただくには、プランのアップグレードをご検討ください。
                </p>
              </div>
            )}
          </div>
        )}

        {/* アクションカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/upload"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-lg">
                <UploadIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600">
                  おたよりをアップロード
                </h3>
                <p className="text-sm text-gray-600">
                  写真を撮って内容を自動で読み取り
                </p>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <BellIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">通知</h3>
                <p className="text-sm text-gray-600">新しい通知はありません</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">今月の予定</h3>
                <p className="text-sm text-gray-600">予定はありません</p>
              </div>
            </div>
          </div>
        </div>

        {/* メッセージ */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">はじめに</h2>
          <p className="text-gray-600 mb-4">
            おたよりポン！は、学校からのおたよりを簡単に管理できるアプリです。
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>スマートフォンでおたよりを撮影するだけで、内容を自動で読み取ります</li>
            <li>重要な期限や予定を見逃すことがありません</li>
            <li>家族全員で情報を共有できます</li>
          </ul>
          <div className="mt-6">
            <Link
              to="/upload"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
            >
              今すぐ始める
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
