import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EnhancedAppProvider, useAppContext } from './EnhancedAppContext';
import Header from './components/Header';

// ページコンポーネントをインポート
import LandingPage from './pages/LandingPage';

// テスト版ページ
import TestUploadPage from './pages/TestUploadPage';
import TestUploadPageAdvanced from './pages/TestUploadPageAdvanced';
import TestDashboardPage from './pages/TestDashboardPage';
import TestLoginPage from './pages/TestLoginPage';

// 本格版ページ（元のコンポーネント）
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import NoticeDetailPage from './pages/NoticeDetailPage';
import SignUpPage from './pages/SignUpPage';

const AppContent: React.FC = () => {
  const { loadingAuth } = useAppContext();

  // Firebase認証の初期化中はローディング画面を表示
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-gray-700">おたよりポン！を読み込み中...</h2>
          <p className="text-gray-500 mt-2">Firebase認証を確認しています</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 text-gray-800">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          {/* ランディングページ */}
          <Route path="/" element={<LandingPage />} />
          
          {/* テスト版ページ（段階的移行用） */}
          <Route path="/test-dashboard" element={<TestDashboardPage />} />
          <Route path="/test-upload" element={<TestUploadPageAdvanced />} />
          <Route path="/test-upload-simple" element={<TestUploadPage />} />
          <Route path="/test-login" element={<TestLoginPage />} />
          
          {/* 本格版ページ（元のUI/機能） */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notice/:id" element={<NoticeDetailPage />} />
          
          {/* 未定義ルートのリダイレクト */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <EnhancedAppProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </EnhancedAppProvider>
  );
};

export default App;
