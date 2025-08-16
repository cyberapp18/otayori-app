import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notice, Task, User, Child, NewsletterAction } from '@/types/index';
import * as authService from '@/services/authService';
import * as settingsService from '@/services/settingsService';
import * as familyService from '@/services/familyService';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getApp } from 'firebase/app';

interface AppContextType {
  notices: Notice[];
  setNotices: React.Dispatch<React.SetStateAction<Notice[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addNotice: (notice: Notice) => void;
  completeTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  children: Child[];
  addChild: (name: string, age: number) => void;
  updateChild: (childId: string, updates: Partial<Pick<Child, 'name' | 'age'>>) => void;
  deleteChild: (childId: string) => void;
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (user: User, password: string) => Promise<void>;
  imageRetention: boolean;
  toggleImageRetention: () => void;
  loadingAuth: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const EnhancedAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 初期のサンプルデータ（認証前）
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
    }
  ]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [imageRetention, setImageRetention] = useState<boolean>(settingsService.getImageRetention());
  const [familyChildren, setFamilyChildren] = useState<Child[]>([]);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Firebase Authの状態監視
  const auth = getAuth(getApp());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // ログイン済みの場合
        const currentUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          username: firebaseUser.displayName || firebaseUser.email || '',
          birthdate: '',
          country: '',
          location: '',
        };
        setUser(currentUser);
        setIsAuthenticated(true);
        
        // 認証後のデータロード（実際のFirestoreデータに置き換え）
        // TODO: 実際のFirestoreからデータをロード
        // setNotices(await loadUserNotices(currentUser.uid));
        // setTasks(await loadUserTasks(currentUser.uid));
        // setFamilyChildren(await familyService.getFamilyChildren(currentUser.uid));
      } else {
        // ログアウト済みの場合
        setUser(null);
        setIsAuthenticated(false);
        // データのクリア（ゲストモード用のサンプルデータを残す）
        setNotices([
          {
            id: 'guest-1',
            familyId: 'guest-family',
            rawText: 'ゲストモード：サンプルおたよりです',
            extractJson: {
              header: {
                title: 'サンプルおたより',
                class_name: 'ゲストクラス',
                school_name: null,
                issue_month: '2025-08',
                issue_date: '2025-08-14'
              },
              actions: [],
              info: []
            },
            summary: 'ゲスト用サンプル',
            createdAt: new Date().toISOString(),
            seenBy: [],
            pinned: false,
            originalImage: null,
            childIds: []
          }
        ]);
        setTasks([]);
        setFamilyChildren([]);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const toggleImageRetention = () => {
    const newValue = !imageRetention;
    settingsService.setImageRetention(newValue);
    setImageRetention(newValue);
  };

  // Firebase Auth統合ログイン（元のApp.tsxから）
  const login = async (email: string, password: string) => {
    await authService.login(email, password);
    // onAuthStateChangedが状態を更新
  };

  // テスト用の簡易ログイン（後方互換性のため）
  const testLogin = async (testUser: User) => {
    // テストモード用の即座ログイン
    setUser(testUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    authService.logout();
    // onAuthStateChangedが状態をクリア
  };

  const signup = async (newUser: User, password: string) => {
    await authService.signup(newUser, password);
    // onAuthStateChangedが状態を更新
  };

  // 元のApp.tsxの高度なaddNotice（タスク自動生成機能付き）
  const addNotice = (notice: Notice) => {
    setNotices(prev => [notice, ...prev]);
    
    // おたよりからタスクを自動生成
    if (notice.extractJson.actions && notice.extractJson.actions.length > 0) {
      const newTasks: Task[] = notice.extractJson.actions.map((action: NewsletterAction, index) => ({
        id: `task-${Date.now()}-${index}`,
        familyId: notice.familyId,
        noticeId: notice.id,
        title: `${action.is_continuation ? '(継続) ' : ''}${action.event_name}`,
        dueAt: action.due_date,
        isContinuation: action.is_continuation,
        repeatRule: action.repeat_rule,
        assigneeCid: '未割り当て',
        completed: false,
        createdAt: new Date().toISOString(),
        childIds: notice.childIds,
      }));
      
      setTasks(prev => [...newTasks, ...prev]);
    }
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

  // 子供管理機能（元のApp.tsxから）
  const addChild = (name: string, age: number) => {
    const newChild: Child = {
      id: Date.now().toString(),
      familyId: user?.uid || 'test-family',
      name,
      age,
      createdAt: new Date().toISOString(),
    };
    setFamilyChildren(prev => [...prev, newChild]);
  };

  const updateChild = (childId: string, updates: Partial<Pick<Child, 'name' | 'age'>>) => {
    setFamilyChildren(prev => prev.map(child => 
      child.id === childId ? { ...child, ...updates } : child
    ));
  };

  const deleteChild = (childId: string) => {
    setFamilyChildren(prev => prev.filter(child => child.id !== childId));
  };

  const value = {
    notices,
    setNotices,
    tasks,
    setTasks,
    addNotice,
    completeTask,
    updateTask,
    deleteTask,
    children: familyChildren,
    addChild,
    updateChild,
    deleteChild,
    isAuthenticated,
    user,
    login,
    logout,
    signup,
    imageRetention,
    toggleImageRetention,
    loadingAuth
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// 後方互換性のため、元の関数も提供
export { EnhancedAppProvider as AppProvider };
export const MinimalAppProvider = EnhancedAppProvider;
