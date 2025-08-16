import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { UserService, UserProfile } from '@/services/userService';

interface AppContextType {
  // 認証状態
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // 使用量情報
  usageInfo: {
    canUse: boolean;
    remaining: number;
    planType: string;
    needsUpgrade: boolean;
  } | null;
  
  // アクション
  logout: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};

export const EnhancedAppContextProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [usageInfo, setUsageInfo] = useState<AppContextType['usageInfo']>(null);

  // 使用量情報を更新
  const refreshUsage = async () => {
    if (!user) {
      setUsageInfo(null);
      return;
    }

    try {
      const usage = await UserService.checkUsageLimit(user.uid);
      setUsageInfo(usage);
    } catch (error) {
      console.error('Failed to refresh usage info:', error);
      setUsageInfo(null);
    }
  };

  // プロフィール情報を更新
  const refreshProfile = async () => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    try {
      const profile = await UserService.getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      setUserProfile(null);
    }
  };

  // ログアウト
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setUsageInfo(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Firebase Auth状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      setUser(user);
      setIsAuthenticated(!!user);

      if (user) {
        try {
          // ユーザープロフィールの作成・更新
          await UserService.createUserProfile(user);
          
          // プロフィール情報取得
          const profile = await UserService.getUserProfile(user.uid);
          setUserProfile(profile);
          
          // 使用量情報取得
          const usage = await UserService.checkUsageLimit(user.uid);
          setUsageInfo(usage);
        } catch (error) {
          console.error('Failed to initialize user data:', error);
          setUserProfile(null);
          setUsageInfo(null);
        }
      } else {
        setUserProfile(null);
        setUsageInfo(null);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AppContextType = {
    user,
    userProfile,
    isAuthenticated,
    isLoading,
    usageInfo,
    logout,
    refreshUsage,
    refreshProfile
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default EnhancedAppContextProvider;

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
