import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../EnhancedAppContext';

const TestDashboardPage: React.FC = () => {
  const { isAuthenticated, user, notices, tasks } = useAppContext();

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* ヘッダー部分 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          おかえりなさい！
        </h1>
        {isAuthenticated ? (
          <p className="text-gray-600">
            {user?.username || user?.email}さんのダッシュボード
          </p>
        ) : (
          <p className="text-gray-600">
            ゲストモードでご利用中です
          </p>
        )}
      </div>

      {/* クイックアクション */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link
          to="/upload"
          className="bg-orange-500 text-white p-6 rounded-xl shadow-md hover:bg-orange-600 transition-colors"
        >
          <div className="text-center">
            <div className="text-3xl mb-2">📷</div>
            <h3 className="font-bold">おたより撮影</h3>
            <p className="text-sm opacity-90">新しいおたよりを追加</p>
          </div>
        </Link>

        <div className="bg-blue-500 text-white p-6 rounded-xl shadow-md">
          <div className="text-center">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-bold">タスク管理</h3>
            <p className="text-sm opacity-90">{tasks.length}件のタスク</p>
          </div>
        </div>

        <div className="bg-green-500 text-white p-6 rounded-xl shadow-md">
          <div className="text-center">
            <div className="text-3xl mb-2">📚</div>
            <h3 className="font-bold">おたより一覧</h3>
            <p className="text-sm opacity-90">{notices.length}件保存済み</p>
          </div>
        </div>

        <Link
          to="/settings"
          className="bg-purple-500 text-white p-6 rounded-xl shadow-md hover:bg-purple-600 transition-colors"
        >
          <div className="text-center">
            <div className="text-3xl mb-2">⚙️</div>
            <h3 className="font-bold">設定</h3>
            <p className="text-sm opacity-90">アプリ設定</p>
          </div>
        </Link>
      </div>

      {/* メインコンテンツエリア */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 最近のおたより */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            最近のおたより
          </h2>
          {notices.length > 0 ? (
            <div className="space-y-3">
              {notices.slice(0, 3).map((notice, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800">
                    {notice.extractJson?.header?.title || `おたより ${index + 1}`}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {notice.extractJson?.header?.issue_date || '日付未設定'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📭</div>
              <p>まだおたよりがありません</p>
              <Link to="/upload" className="text-orange-600 hover:underline">
                最初のおたよりを追加する
              </Link>
            </div>
          )}
        </div>

        {/* 今日のタスク */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            今日のタスク
          </h2>
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task, index) => (
                <div key={task.id || index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => alert('タスク完了機能は開発中です')}
                    className="w-4 h-4 text-orange-600"
                  />
                  <div className="flex-1">
                    <p className={`${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                      {task.title}
                    </p>
                    {task.dueAt && (
                      <p className="text-sm text-gray-600">
                        期限: {new Date(task.dueAt).toLocaleDateString('ja-JP')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">✅</div>
              <p>今日のタスクはありません</p>
              <p className="text-sm">おたよりを追加すると自動でタスクが生成されます</p>
            </div>
          )}
        </div>
      </div>

      {/* デバッグ情報（開発中のみ） */}
      <div className="mt-8 bg-gray-100 rounded-lg p-4">
        <h3 className="font-medium text-gray-700 mb-2">開発情報:</h3>
        <div className="text-sm text-gray-600 grid grid-cols-2 gap-4">
          <div>認証状態: {isAuthenticated ? '✅ ログイン済み' : '❌ 未ログイン'}</div>
          <div>ユーザー: {user?.email || 'ゲスト'}</div>
          <div>おたより数: {notices.length}件</div>
          <div>タスク数: {tasks.length}件</div>
        </div>
      </div>
    </div>
  );
};

export default TestDashboardPage;
