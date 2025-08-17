
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
  const logoLink = "/";
  const homeLink = "/dashboard";

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
              {/* Usage Indicator */}
              <UsageIndicator />
              
              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center space-x-2">
                <NavLink to={homeLink} className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                  ダッシュボード
                </NavLink>
                <NavLink to="/upload" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                  アップロード
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? activeLinkClass : inactiveLinkClass}`}>
                  設定
                </NavLink>
              </nav>
              
              {/* Auth buttons for all screen sizes */}
              <div className="flex items-center space-x-2">
                {isAuthenticated ? (
                  <>
                    <span className="hidden sm:inline text-sm font-medium text-gray-700">
                      こんにちは、{user?.displayName || user?.email}さん
                    </span>
                    <button onClick={handleLogout} className="flex items-center p-2 sm:px-3 sm:py-2 rounded-md text-sm font-medium text-gray-500 hover:text-orange-600 hover:bg-orange-100 transition-colors">
                      <LogOutIcon className="w-5 h-5" />
                      <span className="hidden sm:inline ml-1">ログアウト</span>
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink to="/login" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-100 transition-colors">ログイン</NavLink>
                    <NavLink to="/signup" className="px-4 py-2 rounded-md text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 shadow-sm transition-colors">新規登録</NavLink>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
       {/* Mobile Bottom Nav */}
       <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around z-20">
            <NavLink to={homeLink} end className={({ isActive }) => `flex flex-col items-center justify-center p-2 w-full ${isActive ? 'text-orange-600' : 'text-gray-500'}`}>
                <DashboardIcon className="w-6 h-6" />
                <span className="text-xs">ダッシュボード</span>
            </NavLink>
            <NavLink to="/upload" className={({ isActive }) => `flex flex-col items-center justify-center p-2 w-full ${isActive ? 'text-orange-600' : 'text-gray-500'}`}>
                <UploadIcon className="w-6 h-6" />
                <span className="text-xs">アップロード</span>
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center justify-center p-2 w-full ${isActive ? 'text-orange-600' : 'text-gray-500'}`}>
                <SettingsIcon className="w-6 h-6" />
                <span className="text-xs">設定</span>
            </NavLink>
        </div>
    </>
  );
};

export default Header;
