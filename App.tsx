import React, { useState, createContext, useContext, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import NoticeDetailPage from './pages/NoticeDetailPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import TermsPage from './pages/TermsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import LandingPage from './pages/LandingPage'; // LandingPageをインポート
import Header from './components/Header';
import { Notice, Task, NewsletterAction, User, Child } from './types';
import * as authService from './services/authService';
import * as settingsService from './services/settingsService';
import * as familyService from './services/familyService';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Firebase Authをインポート
import { getApp } from 'firebase/app'; // Firebase Appをインポート

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
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  // Firebase Authの状態に応じて初期値を設定
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [imageRetention, setImageRetention] = useState<boolean>(settingsService.getImageRetention());
  const [familyChildren, setFamilyChildren] = useState<Child[]>([]);
  // ロード中の状態を管理するための新しいstate
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Firebase Authのインスタンスを取得
  const auth = getAuth(getApp());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // ログイン済みの場合
        // NOTE: ここでFirestoreからユーザーの追加プロフィール（birthdate, country, location）をロードする必要があります
        // 現状ではFirebase AuthのUserオブジェクトから直接取得できる情報のみを使用
        const currentUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          username: firebaseUser.displayName || firebaseUser.email || '',
          birthdate: '', // Firestoreから取得
          country: '',   // Firestoreから取得
          location: '',  // Firestoreから取得
        };
        setUser(currentUser);
        setIsAuthenticated(true);
        // 認証後のデータロード（家族情報、おたより、タスクなど）
        // 例: setFamilyChildren(await familyService.getFamilyChildren(currentUser.uid));
      } else {
        // ログアウト済みの場合
        setUser(null);
        setIsAuthenticated(false);
        // データのクリア
        setNotices([]);
        setTasks([]);
        setFamilyChildren([]);
      }
      setLoadingAuth(false); // 認証状態のロードが完了
    });

    return () => unsubscribe();
  }, [auth]);

  const toggleImageRetention = () => {
    const newValue = !imageRetention;
    settingsService.setImageRetention(newValue);
    setImageRetention(newValue);
  };

  const login = async (email: string, password: string) => {
    await authService.login(email, password);
    // onAuthStateChangedリスナーが状態を更新するため、ここでは直接setIsAuthenticatedなどは呼び出さない
    // setNotices([]); // ログイン後のデータロードはonAuthStateChangedで行うか、別途関数で管理
    // setTasks([]);
    // setFamilyChildren([]);
  };

  const logout = () => {
    authService.logout();
    // onAuthStateChangedリスナーが状態を更新するため、ここでは直接setIsAuthenticatedなどは呼び出さない
    // setNotices([]); // ログアウト後のデータクリアはonAuthStateChangedで行う
    // setTasks([]);
    // setFamilyChildren([]);
  };

  const signup = async (newUser: User, password: string) => {
    await authService.signup(newUser, password);
    // onAuthStateChangedリスナーが状態を更新するため、ここでは直接setIsAuthenticatedなどは呼び出さない
  };

  const addNotice = (notice: Notice) => {
    setNotices(prev => [notice, ...prev]);
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
      childIds: notice.childIds, // Pass childIds to tasks
    }));
    if (newTasks.length > 0) {
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

  const addChild = (name: string, age: number) => {
    const newChild = familyService.addChild(name, age);
    setFamilyChildren(prev => [...prev, newChild]);
  };

  const updateChild = (childId: string, updates: Partial<Pick<Child, 'name' | 'age'>>) => {
    familyService.updateChild(childId, updates);
    setFamilyChildren(prev => prev.map(c => c.id === childId ? { ...c, ...updates } : c));
  };

  const deleteChild = (childId: string) => {
    familyService.deleteChild(childId);
    setFamilyChildren(prev => prev.filter(c => c.id !== childId));

    // Remove deleted childId from all tasks
    setTasks(prevTasks =>
      prevTasks.map(task => ({
        ...task,
        childIds: task.childIds?.filter(id => id !== childId),
      }))
    );

    // Remove deleted childId from all notices
    setNotices(prevNotices =>
      prevNotices.map(notice => ({
        ...notice,
        childIds: notice.childIds?.filter(id => id !== childId),
      }))
    );
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
    isAuthenticated,
    user,
    login,
    logout,
    signup,
    imageRetention,
    toggleImageRetention,
    children: familyChildren,
    addChild,
    updateChild,
    deleteChild,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const MainLayout = () => (
    <div className="min-h-screen bg-orange-50 text-gray-800">
      <Header />
      <main className="p-4 pb-24 sm:p-6 sm:pb-24 md:p-6 lg:p-8 max-w-4xl mx-auto">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} /> {/* DashboardPageを/dashboardに移動 */}
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/notice/:id" element={<NoticeDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="*" element={<Navigate to="/dashboard" />} /> {/* 認証済みユーザーのフォールバック */}
        </Routes>
      </main>
    </div>
);


function App() {
  const { isAuthenticated, loadingAuth } = useAppContext(); // loadingAuthも取得

  // 認証状態のロード中
  if (loadingAuth) {
    return <div className="flex justify-center items-center min-h-screen text-xl">Loading authentication...</div>;
  }

  return (
    <HashRouter>
      <Routes>
        {/* 未認証ユーザーでもアクセス可能なパス */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/upload" element={<UploadPage />} /> {/* 未認証でもアクセス可能に */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />

        {/* 認証済みユーザーのみアクセス可能なパス */}
        {isAuthenticated ? (
          <>
            <Route path="/dashboard" element={<DashboardPage />} /> {/* /をDashboardにリダイレクトするため、専用のパスにする */}
            <Route path="/notice/:id" element={<NoticeDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            {/* 認証済みユーザーが未定義のパスにアクセスした場合、DashboardPageへリダイレクト */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        ) : (
          // 未認証ユーザーが認証済みユーザー専用パスにアクセスしようとした場合、LandingPageへリダイレクト
          <Route path="*" element={<Navigate to="/" replace />} />
        )}
      </Routes>
    </HashRouter>
  );
}

export default App;
