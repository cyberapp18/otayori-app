import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { auth } from './services/firebase';
import { UserService, UserProfile } from './services/userService';
import * as authService from './services/authService';
import { User as AppUser } from './types';

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
  signup: (userData: AppUser, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
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
      const usageData = await UserService.checkUsageLimit(user.uid);
      setUsageInfo(usageData);
    } catch (error) {
      console.error('使用量情報の更新に失敗:', error);
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
      console.error('ログアウトに失敗:', error);
    }
  };

  // サインアップ
  const signup = async (userData: AppUser, password: string) => {
    try {
      await authService.signup(userData, password);
      // Firebase認証の状態変更により、自動的にuseEffectが実行されてユーザー情報が更新される
    } catch (error) {
      console.error('サインアップに失敗:', error);
      throw error; // エラーをUIに伝播
    }
  };

  // ログイン
  const login = async (email: string, password: string) => {
    try {
      await authService.login(email, password);
      // Firebase認証の状態変更により、自動的にuseEffectが実行されてユーザー情報が更新される
    } catch (error) {
      console.error('ログインに失敗:', error);
      throw error; // エラーをUIに伝播
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
    refreshProfile,
    signup,
    login
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default EnhancedAppContextProvider;
