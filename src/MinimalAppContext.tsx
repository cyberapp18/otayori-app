import React, { createContext, useContext, useState } from 'react';
import { Notice, Task, User, Child } from '@/types/index';

interface MinimalAppContextType {
  notices: Notice[];
  tasks: Task[];
  isAuthenticated: boolean;
  user: User | null;
  children: Child[];
  addNotice: (notice: Notice) => void;
  completeTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  login: (user: User) => Promise<void>;
  logout: () => void;
}

const MinimalAppContext = createContext<MinimalAppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(MinimalAppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const MinimalAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // サンプルデータで初期化
  const [notices, setNotices] = useState<Notice[]>([
    {
      id: '1',
      familyId: 'test-family',
      rawText: '遠足のお知らせ - 10月15日（火）に秋の遠足を実施します...',
      extractJson: {
        header: {
          title: '遠足のお知らせ',
          class_name: '3年2組',
          school_name: '○○小学校',
          issue_month: '2025-10',
          issue_date: '2025-10-01'
        },
        actions: [],
        info: []
      },
      summary: '秋の遠足について',
      createdAt: '2025-08-10T10:00:00Z',
      seenBy: [],
      pinned: false,
      originalImage: null,
      childIds: []
    },
    {
      id: '2',
      familyId: 'test-family',
      rawText: '学級懇談会のお知らせ - 9月20日（金）15:00より開催...',
      extractJson: {
        header: {
          title: '学級懇談会のお知らせ',
          class_name: '3年2組',
          school_name: '○○小学校',
          issue_month: '2025-09',
          issue_date: '2025-09-05'
        },
        actions: [],
        info: []
      },
      summary: '学級懇談会について',
      createdAt: '2025-08-05T14:30:00Z',
      seenBy: [],
      pinned: true,
      originalImage: null,
      childIds: []
    }
  ]);
  
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'task-1',
      familyId: 'test-family',
      noticeId: '1',
      title: '遠足の参加確認書を提出',
      dueAt: '2025-10-10T23:59:59Z',
      assigneeCid: 'child-1',
      completed: false,
      createdAt: '2025-08-10T10:00:00Z',
      isContinuation: false,
      repeatRule: null
    },
    {
      id: 'task-2',
      familyId: 'test-family',
      noticeId: '2',
      title: '懇談会の出欠確認',
      dueAt: '2025-09-18T23:59:59Z',
      assigneeCid: 'child-1',
      completed: true,
      createdAt: '2025-08-05T14:30:00Z',
      isContinuation: false,
      repeatRule: null,
      completedBy: 'test@example.com',
      completedAt: '2025-08-12T09:15:00Z'
    },
    {
      id: 'task-3',
      familyId: 'test-family',
      noticeId: '1',
      title: '遠足のお弁当を準備',
      dueAt: '2025-10-15T07:00:00Z',
      assigneeCid: 'child-1',
      completed: false,
      createdAt: '2025-08-10T10:00:00Z',
      isContinuation: false,
      repeatRule: null
    }
  ]);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [familyChildren, setFamilyChildren] = useState<Child[]>([]);

  const addNotice = (notice: Notice) => {
    setNotices(prev => [notice, ...prev]);
  };

  const completeTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            completed: true,
            completedBy: user?.username || 'ゲスト',
            completedAt: new Date().toISOString(),
          } 
        : task
    ));
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, ...updates } : task));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  const login = async (user: User) => {
    // 簡易テスト用ログイン
    setIsAuthenticated(true);
    setUser(user);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setNotices([]);
    setTasks([]);
    setFamilyChildren([]);
  };

  const value = {
    notices,
    tasks,
    isAuthenticated,
    user,
    children: familyChildren,
    addNotice,
    completeTask,
    updateTask,
    deleteTask,
    login,
    logout,
  };

  return <MinimalAppContext.Provider value={value}>{children}</MinimalAppContext.Provider>;
};
