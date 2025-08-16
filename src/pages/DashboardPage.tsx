
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '@/EnhancedAppContext';
import NoticeCard from '@/components/NoticeCard';
import { Task, RepeatRule, Child } from '@/types/index';
import { CheckCircleIcon, UploadIcon, CalendarIcon, ShareIcon, PencilIcon, TrashIcon } from '@/components/Icon';
import Button from '@/components/Button';
import { sanitize } from '@/services/sanitization';

const formatRepeatRule = (rule: RepeatRule): string => {
    const dayMap: { [key: string]: string } = {
        'MO': '月', 'TU': '火', 'WE': '水', 'TH': '木', 'FR': '金', 'SA': '土', 'SU': '日'
    };
    const days = rule.byDay.map(d => dayMap[d] || d).join('・');
    return `毎週${days}曜日`;
};

const generateIcsContent = (task: Task): string => {
    if (!task.dueAt) return '';
    const startDate = new Date(task.dueAt);
    // For all-day events, the end date is the next day.
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    const formatDate = (date: Date) => date.toISOString().split('T')[0].replace(/-/g, '');

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `UID:${task.id}@otayoripon.app`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, '')}Z`,
        `DTSTART;VALUE=DATE:${formatDate(startDate)}`,
        `DTEND;VALUE=DATE:${formatDate(endDate)}`,
        `SUMMARY:${task.title}`,
        `DESCRIPTION:おたよりポン！からの予定です。\n関連おしらせID: ${task.noticeId}${task.notes ? `\n\nメモ:\n${task.notes}` : ''}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
};


const TaskItem: React.FC<{ task: Task, allChildren: Child[], isOneTime?: boolean }> = ({ task, allChildren, isOneTime = false }) => {
    const { completeTask, updateTask, deleteTask, isAuthenticated, user } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const isCompleted = task.completed;

    // Form state
    const [title, setTitle] = useState(task.title);
    const [dueAt, setDueAt] = useState(task.dueAt || '');
    const [assignee, setAssignee] = useState(task.assigneeCid);
    const [notes, setNotes] = useState(task.notes || '');

    const childNames = task.childIds
        ?.map(id => allChildren.find(c => c.id === id)?.name)
        .filter(Boolean)
        .join('・');

    const handleDelete = () => {
        if (window.confirm(`「${task.title}」を削除してもよろしいですか？`)) {
            deleteTask(task.id);
        }
    };

    const handleAddToCalendar = () => {
        const icsContent = generateIcsContent(task);
        if (!icsContent) return;
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${task.title.replace(/\s/g, '_')}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const handleShareToLine = () => {
        const dashboardUrl = window.location.origin;
    
        const messageParts = [
            '【おたよりポン！ TODOのお知らせ】',
            '',
            `■ タスク名`,
            `${task.title}`,
            '',
            `■ 期限`,
            `${task.dueAt || '未設定'}`,
            '',
            `■ 担当`,
            `${task.assigneeCid}`,
        ];

        if (childNames) {
            messageParts.push('', '■ 対象');
            messageParts.push(childNames);
        }
    
        if (task.notes && task.notes.trim() !== '') {
            messageParts.push('');
            messageParts.push('■ メモ');
            messageParts.push(task.notes);
        }
        
        messageParts.push('');
        messageParts.push('--------------------');
        messageParts.push('▼ アプリで確認する');
        messageParts.push(dashboardUrl);
    
        const text = messageParts.join('\n');
        const encodedText = encodeURIComponent(text);
        const lineUrl = `https://line.me/R/msg/text/?${encodedText}`;
        window.open(lineUrl, '_blank', 'rel=noopener noreferrer');
    };

    const handleSave = () => {
        const finalAssignee = assignee.trim() === '' ? '未割り当て' : assignee;
        const updates: Partial<Task> = {
            title: sanitize(title),
            dueAt: dueAt || null,
            assigneeCid: sanitize(finalAssignee),
            notes: sanitize(notes),
        };
        updateTask(task.id, updates);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTitle(task.title);
        setDueAt(task.dueAt || '');
        setAssignee(task.assigneeCid);
        setNotes(task.notes || '');
        setIsEditing(false);
    };
    
    const canUseFeatures = isAuthenticated;

    if (isEditing && canUseFeatures) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-4 ring-2 ring-orange-400">
                <div className="space-y-4">
                    <div>
                        <label htmlFor={`title-${task.id}`} className="block text-sm font-medium text-gray-700">タスク名</label>
                        <input type="text" id={`title-${task.id}`} value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor={`dueAt-${task.id}`} className="block text-sm font-medium text-gray-700">期限</label>
                            <input type="date" id={`dueAt-${task.id}`} value={dueAt} onChange={e => setDueAt(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor={`assignee-${task.id}`} className="block text-sm font-medium text-gray-700">担当</label>
                            <input type="text" id={`assignee-${task.id}`} value={assignee === '未割り当て' ? '' : assignee} onChange={e => setAssignee(e.target.value)} placeholder="例: ママ, パパ, 太郎" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor={`notes-${task.id}`} className="block text-sm font-medium text-gray-700">メモ</label>
                        <textarea id={`notes-${task.id}`} value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm" placeholder="持ち物、場所、補足情報など"></textarea>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">キャンセル</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">保存する</button>
                </div>
            </div>
        )
    }

    return (
        <div className={`bg-white rounded-xl hover:shadow-lg transition-all shadow-md p-4 ${isCompleted ? 'bg-gray-50' : ''}`}>
            <div className="flex items-start justify-between gap-2">
                <div className={`flex-grow ${isCompleted ? 'opacity-60' : ''}`}>
                    <p className={`font-semibold text-gray-800 ${isCompleted ? 'line-through text-gray-500' : ''}`}>{task.title}</p>
                    
                    {childNames && <p className="text-sm font-semibold text-purple-600 mt-1">対象: {childNames}</p>}

                    {task.repeatRule ? (
                        <p className="text-sm font-medium text-blue-600 mt-1">{formatRepeatRule(task.repeatRule)}</p>
                    ) : task.dueAt ? (
                        <p className="text-sm font-medium text-red-600 mt-1">期限: {task.dueAt}</p>
                    ) : (
                        <p className="text-sm text-gray-500 mt-1">期限未設定</p>
                    )}

                    {task.assigneeCid !== '未割り当て' && <p className="text-sm text-gray-500 mt-1">担当: {task.assigneeCid}</p>}
                    {task.notes && <p className="text-sm text-gray-500 mt-1 pt-1 border-t border-gray-100 whitespace-pre-wrap">{task.notes}</p>}
                    
                    {isCompleted && task.completedBy && (
                        <p className="text-sm font-medium text-green-700 mt-2 flex items-center">
                            <CheckCircleIcon className="w-5 h-5 mr-1.5" />
                            {user?.username === task.completedBy ? "あなたが" : `${task.completedBy}が`}実施済み
                        </p>
                    )}
                </div>
                <div className="flex items-center flex-shrink-0 -mr-2">
                    {!isCompleted && (
                      <>
                        <button onClick={() => canUseFeatures ? setIsEditing(true) : null} className={`p-2 rounded-full group transition-colors ${canUseFeatures ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'}`} disabled={!canUseFeatures} title={canUseFeatures ? "編集する" : "ログインが必要です"}>
                            <PencilIcon className={`w-5 h-5 text-gray-400 ${canUseFeatures && 'group-hover:text-orange-500'} transition-colors`} />
                        </button>
                        <button onClick={() => canUseFeatures ? completeTask(task.id) : null} className={`p-2 rounded-full group transition-colors ${canUseFeatures ? 'hover:bg-green-100' : 'opacity-50 cursor-not-allowed'}`} disabled={!canUseFeatures} title={canUseFeatures ? "完了する" : "ログインが必要です"}>
                            <CheckCircleIcon className={`w-7 h-7 text-gray-300 ${canUseFeatures && 'group-hover:text-green-500'} transition-colors`}/>
                        </button>
                      </>
                    )}
                    <button onClick={() => canUseFeatures ? handleDelete() : null} className={`p-2 rounded-full group transition-colors ${canUseFeatures ? 'hover:bg-red-100' : 'opacity-50 cursor-not-allowed'}`} disabled={!canUseFeatures} title={canUseFeatures ? "削除する" : "ログインが必要です"}>
                        <TrashIcon className={`w-5 h-5 text-gray-400 ${canUseFeatures && 'group-hover:text-red-500'} transition-colors`} />
                    </button>
                </div>
            </div>
            {!isCompleted && isOneTime && task.dueAt && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4">
                    <button onClick={handleAddToCalendar} className="flex items-center gap-1.5 text-xs text-gray-600 font-medium hover:text-orange-600 transition-colors">
                        <CalendarIcon className="w-4 h-4" />
                        カレンダーに追加
                    </button>
                    <button onClick={() => canUseFeatures ? handleShareToLine() : null} className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${canUseFeatures ? 'text-gray-600 hover:text-green-600' : 'text-gray-400 cursor-not-allowed'}`} disabled={!canUseFeatures} title={canUseFeatures ? "LINEで通知" : "ログインが必要です"}>
                        <ShareIcon className="w-4 h-4" />
                        LINEで通知
                    </button>
                </div>
            )}
        </div>
    )
};

const LoginPrompt = () => (
    <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-800 p-4 rounded-r-lg shadow-md" role="alert">
        <p className="font-bold">TODOリストを保存・共有しませんか？</p>
        <p className="mt-2 text-sm">
          ただいまゲストとして利用中です。作成したTODOリストを保持したり、家族と共有したりするにはログインが必要です。
        </p>
        <div className="mt-4 flex items-center gap-4">
          <Link to="/signup" className="inline-block px-6 py-2 bg-orange-500 text-white font-bold text-sm rounded-lg shadow hover:bg-orange-600 transition-colors">
            無料で新規登録
          </Link>
          <Link to="/login" className="font-medium text-orange-700 hover:underline">
            ログインはこちら
          </Link>
        </div>
      </div>
);

const DashboardPage: React.FC = () => {
  const { notices, tasks, isAuthenticated, children } = useAppContext();
  const navigate = useNavigate();
  const [selectedChildId, setSelectedChildId] = useState<string>('all');

  const showLoginPrompt = !isAuthenticated && (tasks.length > 0 || notices.length > 0);
  
  const filteredNotices = notices.filter(notice => {
    if (selectedChildId === 'all') return true;
    return notice.childIds?.includes(selectedChildId);
  });

  const pinnedNotices = filteredNotices.filter(n => n.pinned);
  const otherNotices = filteredNotices.filter(n => !n.pinned);
  
  const recurringTasks = tasks
    .filter(t => t.repeatRule || t.isContinuation)
    .sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);

  const oneTimeTasks = tasks
    .filter(t => !t.repeatRule && !t.isContinuation)
    .sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);

  const hasPendingTasks = tasks.some(t => !t.completed);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">ホーム</h1>
            <p className="text-gray-600 mt-1">{isAuthenticated ? 'こんにちは！今日の予定を確認しましょう。' : 'まずはおたよりをアップロードしてみましょう！'}</p>
        </div>
        <div className="w-full sm:w-auto">
             <Button onClick={() => navigate('/upload')}>
                <UploadIcon className="w-5 h-5 mr-2" />
                おたよりを追加
            </Button>
        </div>
      </div>

      {showLoginPrompt && <LoginPrompt />}

      {oneTimeTasks.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">締切のあるTODO</h2>
          <div className="space-y-3">
            {oneTimeTasks.map(task => <TaskItem key={task.id} task={task} allChildren={children} isOneTime={true} />)}
          </div>
        </div>
      )}

      {recurringTasks.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">日々のTODO</h2>
          <div className="space-y-3">
            {recurringTasks.map(task => <TaskItem key={task.id} task={task} allChildren={children} isOneTime={false} />)}
          </div>
        </div>
      )}
      
      {!hasPendingTasks && (tasks.length > 0 || notices.length > 0) && (
         <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">未完了のTODO</h2>
            <div className="text-center py-6 bg-white rounded-xl shadow-sm">
                <p className="text-gray-500">完了！現在やるべきことはありません。</p>
            </div>
        </div>
      )}

      {notices.length > 0 && isAuthenticated && children.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="text-md font-bold text-gray-700 mb-3">おたよりの絞り込み</h3>
            <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedChildId('all')} className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${selectedChildId === 'all' ? 'bg-orange-500 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    すべて
                </button>
                {children.map(child => (
                    <button key={child.id} onClick={() => setSelectedChildId(child.id)} className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${selectedChildId === child.id ? 'bg-orange-500 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {child.name}
                    </button>
                ))}
            </div>
        </div>
      )}

      {pinnedNotices.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">重要なおしらせ</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {pinnedNotices.map(notice => (
              <NoticeCard key={notice.id} notice={notice} />
            ))}
          </div>
        </div>
      )}

      {otherNotices.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">{selectedChildId === 'all' ? 'すべてのおしらせ' : `${children.find(c=>c.id === selectedChildId)?.name}さんのおしらせ`}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {otherNotices.map(notice => (
              <NoticeCard key={notice.id} notice={notice} />
            ))}
          </div>
        </div>
       )}
       
       {filteredNotices.length === 0 && notices.length > 0 && (
         <div className="text-center py-10 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500">この条件に一致するおしらせはありません。</p>
          </div>
       )}

      {tasks.length === 0 && notices.length === 0 && (
          <div className="text-center py-10 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500">まだお知らせはありません。</p>
            <p className="text-gray-500 mt-2">「おたよりを追加」から始めましょう！</p>
          </div>
      )}
    </div>
  );
};

export default DashboardPage;