
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
import Header from './components/Header';
import { Notice, Task, NewsletterAction, User, Child } from './types';
import * as authService from './services/authService';
import * as settingsService from './services/settingsService';
import * as familyService from './services/familyService';

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

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [imageRetention, setImageRetention] = useState<boolean>(settingsService.getImageRetention());
  const [familyChildren, setFamilyChildren] = useState<Child[]>([]);

  useEffect(() => {
    const handleAuthChange = () => {
      const authStatus = authService.isAuthenticated();
      setIsAuthenticated(authStatus);
      setUser(authService.getCurrentUser());

      if (authStatus) {
        setFamilyChildren(familyService.getChildren());
      } else {
        // Clear data on logout
        setNotices([]);
        setTasks([]);
        setFamilyChildren([]);
      }
    };

    handleAuthChange(); // Initial load
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const toggleImageRetention = () => {
    const newValue = !imageRetention;
    settingsService.setImageRetention(newValue);
    setImageRetention(newValue);
  };

  const login = async (email: string, password: string) => {
    await authService.login(email, password);
    setNotices([]);
    setTasks([]);
    setIsAuthenticated(true);
    setUser(authService.getCurrentUser());
    setFamilyChildren(familyService.getChildren());
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setNotices([]);
    setTasks([]);
    setFamilyChildren([]);
  };

  const signup = async (newUser: User, password: string) => {
    await authService.signup(newUser, password);
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
          <Route path="/" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/notice/:id" element={<NoticeDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
);


function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/verify-email" element={<EmailVerificationPage />} />
            <Route path="/*" element={<MainLayout />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}

export default App;
