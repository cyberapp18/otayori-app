import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { EnhancedAppContextProvider, useAppContext } from './AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ScrollRestoration from './components/ScrollRestoration';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import UploadPage from './pages/UploadPage';
import NoticeDetailPage from './pages/NoticeDetailPage';
import SettingsPage from './pages/SettingsPage';
import LandingPage from './pages/LandingPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import InvitePage from './pages/InvitePage';
import ContactPage from './pages/ContactPage';
import BugReportPage from './pages/BugReportPage';
import LegalPage from './pages/LegalPage';
import DataPolicyPage from './pages/DataPolicyPage';

// ホームページコンポーネント（認証状態に応じて分岐）
const HomePage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAppContext();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />;
};

// 認証が必要なページのラッパー
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAppContext();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// 未認証時のみアクセス可能なページのラッパー
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAppContext();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const App: React.FC = () => {
  // グローバルなスクロール制御を設定
  React.useEffect(() => {
    // スクロール動作を無効化（即座にスクロール）
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.scrollBehavior = 'auto';
    
    return () => {
      // クリーンアップ
      document.documentElement.style.scrollBehavior = '';
      document.body.style.scrollBehavior = '';
    };
  }, []);

  return (
    <EnhancedAppContextProvider>
      <Router>
        <ScrollToTop />
        <ScrollRestoration>
          <div className="min-h-screen bg-cream pb-20 md:pb-0 flex flex-col" style={{ scrollBehavior: 'auto' }}>
            <Header />
            <main className="pt-20 md:pt-24 flex-1" style={{ scrollBehavior: 'auto' }}>
              <Routes>
                {/* ホームページ（認証状態に応じて分岐） */}
                <Route path="/" element={<HomePage />} />
                {/* 明示的なランディングページ（ヘッダーから直接アクセス用） */}
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                
                {/* 招待ページ（認証不要） */}
                <Route path="/invite/:inviteCode" element={<InvitePage />} />
                
                {/* 未認証時のみ */}
                <Route path="/login" element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                } />
                <Route path="/signup" element={
                  <PublicRoute>
                    <SignUpPage />
                  </PublicRoute>
                } />
                <Route path="/verify-email" element={<EmailVerificationPage />} />
                
                {/* 認証が必要なページ */}
                <Route path="/dashboard" element={<DashboardPage />} />
                
                {/* アップロードページは未ログインでもアクセス可能 */}
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/notice/:id" element={
                  <ProtectedRoute>
                    <NoticeDetailPage />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } />
                
                {/* フッター用の新しいページ */}
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/bug-report" element={<BugReportPage />} />
                <Route path="/legal" element={<LegalPage />} />
                <Route path="/data-policy" element={<DataPolicyPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </ScrollRestoration>
      </Router>
    </EnhancedAppContextProvider>
  );
};

export default App;
