
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { HomeIcon, DashboardIcon, SettingsIcon, UploadIcon, LogOutIcon } from './Icon';
import { useAppContext } from '../AppContext';
import UsageIndicator from './UsageIndicator';


const Header: React.FC = () => {
  const activeLinkClass = "text-orange-600 bg-orange-100";
  const inactiveLinkClass = "text-gray-500 hover:text-orange-600 hover:bg-orange-100";
  const { isAuthenticated, user, logout } = useAppContext();
  const navigate = useNavigate();
  
  // ロゴは常にランディングページへ、ホームは常にダッシュボードへ
  const logoLink = "/landing";
  const homeLink = "/dashboard";

  const handleLogout = () => {
    logout();
    navigate('/landing');
  };

  const handleNavigation = () => {
    // ナビゲーション時にスクロール位置をリセット（より確実な方法）
    
    // 即座にスクロール
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // 少し遅延させてもう一度
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
    
    // さらに遅延させて確実に
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto'
      });
    }, 50);
  };

  return (
    <>
      <header className="bg-white/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top row: Usage Indicator and User Info */}
          {isAuthenticated && (
            <div className="flex justify-end items-center py-1 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                {/* Usage Indicator */}
                <div className="text-xs">
                  <UsageIndicator />
                </div>
                
                {/* User info */}
                {user && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">
                      こんにちは、{user?.displayName || user?.email}さん
                    </span>
                    {/* Mobile logout button */}
                    <button
                      onClick={handleLogout}
                      className="md:hidden p-1 rounded text-gray-500 hover:text-orange-600 hover:bg-orange-100 transition-colors"
                      aria-label="ログアウト"
                      title="ログアウト"
                    >
                      <LogOutIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <NavLink to={logoLink} className="flex items-center space-x-2 text-2xl font-extrabold text-orange-600 hover:text-orange-700 transition-colors">
                <img 
                  src="/images/icons/icon_origin.png" 
                  alt="おたよりポン！アイコン" 
                  className="w-8 h-8"
                />
                <span className="font-heading">おたよりポン！</span>
              </NavLink>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Desktop Navigation (for authenticated users) */}
              {isAuthenticated && (
                <nav className="hidden md:flex items-center space-x-1">
                  <NavLink 
                    to={homeLink} 
                    end 
                    onClick={handleNavigation}
                    className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? activeLinkClass : inactiveLinkClass}`}
                  >
                    ダッシュボード
                  </NavLink>
                  <NavLink 
                    to="/upload" 
                    onClick={handleNavigation}
                    className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? activeLinkClass : inactiveLinkClass}`}
                  >
                    アップロード
                  </NavLink>
                  <NavLink 
                    to="/settings" 
                    onClick={handleNavigation}
                    className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? activeLinkClass : inactiveLinkClass}`}
                  >
                    設定
                  </NavLink>
                  <button 
                    onClick={handleLogout} 
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-orange-600 hover:bg-orange-100 transition-colors"
                  >
                    ログアウト
                  </button>
                </nav>
              )}
              
              {/* Auth buttons for non-authenticated users */}
              {!isAuthenticated && (
                <div className="flex items-center space-x-2">
                  <NavLink to="/login" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-100 transition-colors">ログイン</NavLink>
                  <NavLink to="/signup" className="px-4 py-2 rounded-md text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 shadow-sm transition-colors">新規登録</NavLink>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav - Only for authenticated users */}
      {isAuthenticated && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around z-50 h-16">
              <NavLink 
                to={homeLink} 
                end 
                onClick={handleNavigation}
                className={({ isActive }) => `flex flex-col items-center justify-center p-2 w-full ${isActive ? 'text-orange-600' : 'text-gray-500'}`}
              >
                  <DashboardIcon className="w-6 h-6" />
                  <span className="text-xs">ダッシュボード</span>
              </NavLink>
              <NavLink 
                to="/upload" 
                onClick={handleNavigation}
                className={({ isActive }) => `flex flex-col items-center justify-center p-2 w-full ${isActive ? 'text-orange-600' : 'text-gray-500'}`}
              >
                  <UploadIcon className="w-6 h-6" />
                  <span className="text-xs">アップロード</span>
              </NavLink>
              <NavLink 
                to="/settings" 
                onClick={handleNavigation}
                className={({ isActive }) => `flex flex-col items-center justify-center p-2 w-full ${isActive ? 'text-orange-600' : 'text-gray-500'}`}
              >
                  <SettingsIcon className="w-6 h-6" />
                  <span className="text-xs">設定</span>
              </NavLink>
          </div>
      )}
    </>
  );
};

export default Header;
