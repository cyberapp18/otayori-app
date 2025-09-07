import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { UploadIcon, BellIcon, CalendarIcon, CheckIcon, ClockIcon } from '../components/Icon';
import { AnalysisService, TodoItem, NotificationItem, AnalysisRecord } from '../services/analysisService';
import Button from '../components/Button';

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, isLoading, usageInfo } = useAppContext();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // 新規TODOフォーム用
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDescription, setNewTodoDescription] = useState('');
  const [addingTodo, setAddingTodo] = useState(false);
  // タスク削除
  const handleDeleteTodo = async (todoId: string) => {
    if (!window.confirm('このタスクを削除しますか？')) return;
    try {
      await AnalysisService.deleteTodo(todoId);
      setTodos(prev => prev.filter(todo => todo.id !== todoId));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  // タスク追加
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    setAddingTodo(true);
    try {
      const todoId = await AnalysisService.addUserTodo(user.uid, {
        title: newTodoTitle,
        description: newTodoDescription,
        priority: 'low',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.uid,
        analysisId: ''
      });
      setTodos(prev => [
        { id: todoId, title: newTodoTitle, description: newTodoDescription, priority: 'low', completed: false, createdAt: new Date(), updatedAt: new Date(), userId: user.uid, analysisId: '' },
        ...prev
      ]);
      setNewTodoTitle('');
      setNewTodoDescription('');
    } catch (error) {
      console.error('Failed to add todo:', error);
    } finally {
      setAddingTodo(false);
    }
  };

  // データを読み込み
  const loadDashboardData = async () => {
    if (!user || !isAuthenticated) return;
    
    setDataLoading(true);
    try {
      const [todosData, notificationsData, analysesData] = await Promise.all([
        AnalysisService.getUserTodos(user.uid, false),
        AnalysisService.getUserNotifications(user.uid, true),
        AnalysisService.getUserAnalyses(user.uid, 5)
      ]);

      setTodos(todosData);
      setNotifications(notificationsData);
      setRecentAnalyses(analysesData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // TODO完了の切り替え
  const handleToggleTodo = async (todoId: string) => {
    try {
      await AnalysisService.toggleTodoCompletion(todoId);
      // ローカル状態を更新
      setTodos(prev => prev.filter(todo => todo.id !== todoId));
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  // 通知を既読にする
  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      await AnalysisService.markNotificationAsRead(notificationId);
      // ローカル状態を更新
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // データの読み込み
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      loadDashboardData();
    }
  }, [isAuthenticated, user, isLoading]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream pt-8 pb-20 md:pb-8">
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
    <div className="min-h-screen bg-cream pt-8 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            こんにちは、{user?.displayName || 'ゲスト'}さん！
          </h1>
          <p className="mt-2 text-gray-600">
            おたよりポン！へようこそ。今日のタスクと通知をご確認ください。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* アクションカード */}
          <div className="lg:col-span-1">
            <div className="grid grid-cols-1 gap-6">
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <BellIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">通知</h3>
                      <p className="text-sm text-gray-600">
                        {notifications.length > 0 ? `${notifications.length}件の新しい通知` : '新しい通知はありません'}
                      </p>
                    </div>
                  </div>
                </div>
                {dataLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {notifications.slice(0, 3).map((notification) => (
                      <div key={notification.id} className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-800">{notification.title}</h4>
                            <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                          </div>
                          <button 
                            onClick={() => handleMarkNotificationRead(notification.id!)}
                            className="text-blue-600 hover:text-blue-800 ml-2"
                            title="既読にする"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">新しい通知はありません</p>
                )}
              </div>
            </div>
          </div>

          {/* TODOリスト */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* 新規TODO追加フォーム */}
              <form onSubmit={handleAddTodo} className="mb-4 flex flex-col gap-2">
                <input
                  type="text"
                  className="border rounded px-2 py-1 w-full"
                  placeholder="新しいタスクのタイトル"
                  value={newTodoTitle}
                  onChange={e => setNewTodoTitle(e.target.value)}
                  maxLength={40}
                  required
                />
                <input
                  type="text"
                  className="border rounded px-2 py-1 w-full"
                  placeholder="詳細 (任意)"
                  value={newTodoDescription}
                  onChange={e => setNewTodoDescription(e.target.value)}
                  maxLength={100}
                />
                <button
                  type="submit"
                  className="bg-green-500 text-white rounded px-3 py-1 mt-1 hover:bg-green-600 disabled:opacity-50"
                  disabled={addingTodo || !newTodoTitle.trim()}
                >
                  {addingTodo ? '追加中...' : 'タスク追加'}
                </button>
              </form>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <ClockIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">今日のタスク</h3>
                    <p className="text-sm text-gray-600">
                      {todos.length > 0 ? `${todos.length}件のタスクがあります` : 'タスクはありません'}
                    </p>
                  </div>
                </div>
              </div>
              {dataLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                </div>
              ) : todos.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {todos.slice(0, 5).map((todo) => (
                    <div key={todo.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                      <button
                        onClick={() => handleToggleTodo(todo.id!)}
                        className="mt-0.5 text-green-600 hover:text-green-800"
                        title="完了にする"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-800">{todo.title}</h4>
                        {todo.description && (
                          <p className="text-xs text-gray-600 mt-1">{todo.description}</p>
                        )}
                        {todo.dueDate && (
                          <p className="text-xs text-red-600 mt-1">
                            期限: {todo.dueDate.toLocaleDateString('ja-JP')}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        todo.priority === 'high' ? 'bg-red-100 text-red-700' :
                        todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
                      </span>
                      <button
                        onClick={() => handleDeleteTodo(todo.id!)}
                        className="ml-2 text-gray-400 hover:text-red-500"
                        title="削除"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">現在のタスクはありません</p>
              )}
            </div>
          </div>

          {/* 最近の解析結果 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <CalendarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">最近の解析結果</h3>
                    <p className="text-sm text-gray-600">
                      {recentAnalyses.length > 0 ? `${recentAnalyses.length}件の結果` : '解析結果はありません'}
                    </p>
                  </div>
                </div>
              </div>
              {dataLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                </div>
              ) : recentAnalyses.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {recentAnalyses.map((analysis) => (
                    <div key={analysis.id} className="border border-gray-200 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">
                        {analysis.extractedData?.header?.title || '無題のおたより'}
                      </h4>
                      <p className="text-xs text-gray-600 mb-2">
                        {analysis.extractedData?.header?.class_name && 
                         `${analysis.extractedData.header.class_name} - `}
                        {analysis.createdAt.toLocaleDateString('ja-JP')}
                      </p>
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {analysis.extractedData?.overview || '概要なし'}
                      </p>
                      {analysis.extractedData?.actions && analysis.extractedData.actions.length > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          {analysis.extractedData.actions.length}件のアクション項目
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-2">まだ解析結果がありません</p>
                  <Link to="/upload" className="text-orange-600 hover:underline text-sm">
                    最初のおたよりを分析する
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* はじめにメッセージ（新規ユーザー向け） */}
        {recentAnalyses.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">はじめに</h2>
            <p className="text-gray-600 mb-4">
              おたよりポン！は、学校からのおたよりを簡単に管理できるアプリです。
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>スマートフォンでおたよりを撮影するだけで、内容を自動で読み取ります</li>
              <li>重要な期限や予定を見逃すことがありません</li>
              <li>家族全員で情報を共有できます</li>
              <li>TODOリストで必要なアクションを管理できます</li>
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
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
