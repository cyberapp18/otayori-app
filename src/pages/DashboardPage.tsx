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
  const [newTodoDueDate, setNewTodoDueDate] = useState('');
  const [newTodoAssignedTo, setNewTodoAssignedTo] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<'high' | 'medium' | 'low'>('low');
  const [addingTodo, setAddingTodo] = useState(false);

  // 編集用状態
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'low'>('medium');

  // 家族メンバー一覧（実際には家族サービスから取得）
  const [familyMembers] = useState([
    { id: user?.uid || '', name: user?.displayName || 'あなた' },
    { id: 'family1', name: 'パパ' },
    { id: 'family2', name: 'ママ' },
    { id: 'family3', name: '子ども' }
  ]);
  // タスク削除（確認ポップアップ付き）
  const handleDeleteTodo = async (todoId: string, todoTitle: string) => {
    if (!window.confirm(`「${todoTitle}」を削除しますか？\nこの操作は取り消せません。`)) return;
    try {
      await AnalysisService.deleteTodo(todoId);
      setTodos(prev => prev.filter(todo => todo.id !== todoId));
    } catch (error) {
      console.error('Failed to delete todo:', error);
      alert('タスクの削除に失敗しました。');
    }
  };

  // タスク追加（拡張版）
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    setAddingTodo(true);
    try {
      const assignedMember = familyMembers.find(m => m.id === newTodoAssignedTo);
      const todoId = await AnalysisService.addUserTodo(user.uid, {
        title: newTodoTitle,
        description: newTodoDescription,
        dueDate: newTodoDueDate ? new Date(newTodoDueDate) : undefined,
        assignedTo: newTodoAssignedTo || user.uid,
        assignedToName: assignedMember?.name || 'あなた',
        priority: newTodoPriority,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.uid,
        analysisId: ''
      });
      setTodos(prev => [
        { 
          id: todoId, 
          title: newTodoTitle, 
          description: newTodoDescription,
          dueDate: newTodoDueDate ? new Date(newTodoDueDate) : undefined,
          assignedTo: newTodoAssignedTo || user.uid,
          assignedToName: assignedMember?.name || 'あなた',
          priority: newTodoPriority, 
          completed: false, 
          createdAt: new Date(), 
          updatedAt: new Date(), 
          userId: user.uid, 
          analysisId: '' 
        },
        ...prev
      ]);
      setNewTodoTitle('');
      setNewTodoDescription('');
      setNewTodoDueDate('');
      setNewTodoAssignedTo('');
      setNewTodoPriority('low');
    } catch (error) {
      console.error('Failed to add todo:', error);
      alert('タスクの追加に失敗しました。');
    } finally {
      setAddingTodo(false);
    }
  };

  // 編集開始
  const handleEditStart = (todo: TodoItem) => {
    setEditingTodo(todo);
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
    setEditDueDate(todo.dueDate ? todo.dueDate.toISOString().split('T')[0] : '');
    setEditAssignedTo(todo.assignedTo || user.uid);
    setEditPriority(todo.priority);
  };

  // 編集保存
  const handleEditSave = async () => {
    if (!editingTodo || !editTitle.trim()) return;
    try {
      const assignedMember = familyMembers.find(m => m.id === editAssignedTo);
      await AnalysisService.updateTodo(editingTodo.id!, {
        title: editTitle,
        description: editDescription,
        dueDate: editDueDate ? new Date(editDueDate) : undefined,
        assignedTo: editAssignedTo,
        assignedToName: assignedMember?.name || 'あなた',
        priority: editPriority,
        updatedAt: new Date()
      });
      
      setTodos(prev => prev.map(todo => 
        todo.id === editingTodo.id 
          ? {
              ...todo,
              title: editTitle,
              description: editDescription,
              dueDate: editDueDate ? new Date(editDueDate) : undefined,
              assignedTo: editAssignedTo,
              assignedToName: assignedMember?.name || 'あなた',
              priority: editPriority,
              updatedAt: new Date()
            }
          : todo
      ));
      setEditingTodo(null);
    } catch (error) {
      console.error('Failed to update todo:', error);
      alert('タスクの更新に失敗しました。');
    }
  };

  // 編集キャンセル
  const handleEditCancel = () => {
    setEditingTodo(null);
    setEditTitle('');
    setEditDescription('');
    setEditDueDate('');
    setEditAssignedTo('');
    setEditPriority('medium');
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
      // まずローカル状態で完了状態を切り替え（楽観的更新）
      const currentTodo = todos.find(t => t.id === todoId);
      if (!currentTodo) return;

      const newCompletedState = !currentTodo.completed;
      
      setTodos(prev => prev.map(todo => 
        todo.id === todoId 
          ? { ...todo, completed: newCompletedState, updatedAt: new Date() }
          : todo
      ));

      // サーバーに完了状態を更新
      await AnalysisService.updateTodo(todoId, { 
        completed: newCompletedState,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Failed to toggle todo:', error);
      // エラーが発生した場合、状態を元に戻す
      setTodos(prev => prev.map(todo => 
        todo.id === todoId 
          ? { ...todo, completed: !todo.completed }
          : todo
      ));
      alert('タスクの状態変更に失敗しました。');
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
              <form onSubmit={handleAddTodo} className="mb-6 space-y-3 border-b pb-4">
                <h4 className="font-semibold text-gray-800">新しいタスクを追加</h4>
                <input
                  type="text"
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="タスク名"
                  value={newTodoTitle}
                  onChange={e => setNewTodoTitle(e.target.value)}
                  maxLength={50}
                  required
                />
                <textarea
                  className="border border-gray-300 rounded px-3 py-2 w-full h-20 resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="詳細 (任意)"
                  value={newTodoDescription}
                  onChange={e => setNewTodoDescription(e.target.value)}
                  maxLength={200}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={newTodoDueDate}
                    onChange={e => setNewTodoDueDate(e.target.value)}
                  />
                  <select
                    className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={newTodoAssignedTo}
                    onChange={e => setNewTodoAssignedTo(e.target.value)}
                  >
                    <option value="">担当者を選択</option>
                    {familyMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-orange-500 text-white rounded px-4 py-2 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed w-full"
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
                    <h3 className="text-lg font-semibold text-gray-900">TODOリスト</h3>
                    <p className="text-sm text-gray-600">
                      {todos.length > 0 ? `${todos.filter(t => !t.completed).length}件の未完了タスク` : 'タスクはありません'}
                    </p>
                  </div>
                </div>
              </div>

              {dataLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                </div>
              ) : todos.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {todos
                    .sort((a, b) => {
                      // 未完了タスクを上に、完了済みタスクを下に
                      if (a.completed !== b.completed) {
                        return a.completed ? 1 : -1;
                      }
                      // 同じ完了状態の場合は、作成日時の降順（新しいものが上）
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    })
                    .map((todo) => (
                    <div 
                      key={todo.id} 
                      className={`border rounded-lg p-4 transition-all ${
                        todo.completed 
                          ? 'bg-gray-50 border-gray-200 opacity-60' 
                          : 'bg-white border-gray-300 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`font-semibold ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                            {todo.title}
                          </h4>
                          {todo.description && (
                            <p className={`text-sm mt-1 ${todo.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                              {todo.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            {todo.dueDate && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                todo.completed 
                                  ? 'bg-gray-100 text-gray-400'
                                  : todo.dueDate < new Date() 
                                    ? 'bg-red-100 text-red-700' 
                                    : 'bg-blue-100 text-blue-700'
                              }`}>
                                期限: {todo.dueDate.toLocaleDateString('ja-JP')}
                              </span>
                            )}
                            {todo.assignedToName && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                todo.completed 
                                  ? 'bg-gray-100 text-gray-400'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                担当: {todo.assignedToName}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-1 rounded ${
                              todo.completed 
                                ? 'bg-gray-100 text-gray-400'
                                : todo.priority === 'high' 
                                  ? 'bg-red-100 text-red-700' 
                                  : todo.priority === 'medium' 
                                    ? 'bg-yellow-100 text-yellow-700' 
                                    : 'bg-gray-100 text-gray-700'
                            }`}>
                              {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => handleToggleTodo(todo.id!)}
                            className={`p-1 rounded transition-colors ${
                              todo.completed 
                                ? 'text-gray-400 hover:text-gray-600' 
                                : 'text-green-600 hover:text-green-800'
                            }`}
                            title={todo.completed ? '未完了にする' : '完了にする'}
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditStart(todo)}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                            title="編集"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteTodo(todo.id!, todo.title)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                            title="削除"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">現在のタスクはありません</p>
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

      {/* TODO編集モーダル */}
      {editingTodo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">タスクを編集</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">タスク名 *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    maxLength={50}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">詳細</label>
                  <textarea
                    className="w-full border border-gray-300 rounded px-3 py-2 h-20 resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">期限</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={editDueDate}
                    onChange={e => setEditDueDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">実施担当</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={editAssignedTo}
                    onChange={e => setEditAssignedTo(e.target.value)}
                  >
                    {familyMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">優先度</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={editPriority}
                    onChange={e => setEditPriority(e.target.value as 'high' | 'medium' | 'low')}
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleEditCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleEditSave}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
                  disabled={!editTitle.trim()}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
