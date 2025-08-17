import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const handleNavigation = () => {
    // リンククリック時にスクロール位置をリセット（より確実な方法）
    // 複数の方法を組み合わせて確実にスクロールをリセット
    
    // 即座にスクロール
    window.scrollTo(0, 0);
    
    // 少し遅延させてもう一度（レンダリング後）
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
    
    // さらに遅延させて確実に
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto'
      });
    }, 100);
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto mb-16 md:mb-0">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* メインナビゲーション */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">🔗 メインナビゲーション</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link 
                  to="/dashboard" 
                  onClick={handleNavigation}
                  className="hover:text-orange-600 transition-colors"
                >
                  ダッシュボード
                </Link>
              </li>
              <li>
                <Link 
                  to="/upload" 
                  onClick={handleNavigation}
                  className="hover:text-orange-600 transition-colors"
                >
                  アップロード
                </Link>
              </li>
              <li>
                <Link 
                  to="/settings" 
                  onClick={handleNavigation}
                  className="hover:text-orange-600 transition-colors"
                >
                  設定
                </Link>
              </li>
            </ul>
          </div>

          {/* サポート・お問い合わせ */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">📞 サポート・お問い合わせ</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link 
                  to="/contact" 
                  onClick={handleNavigation}
                  className="hover:text-orange-600 transition-colors"
                >
                  お問い合わせフォーム
                </Link>
              </li>
              <li>
                <Link 
                  to="/bug-report" 
                  onClick={handleNavigation}
                  className="hover:text-orange-600 transition-colors"
                >
                  不具合報告
                </Link>
              </li>
            </ul>
          </div>

          {/* 法的情報 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">📋 法的情報</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link 
                  to="/terms" 
                  onClick={handleNavigation}
                  className="hover:text-orange-600 transition-colors"
                >
                  利用規約
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy" 
                  onClick={handleNavigation}
                  className="hover:text-orange-600 transition-colors"
                >
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link 
                  to="/legal" 
                  onClick={handleNavigation}
                  className="hover:text-orange-600 transition-colors"
                >
                  特定商取引法に基づく表記
                </Link>
              </li>
              <li>
                <Link 
                  to="/data-policy" 
                  onClick={handleNavigation}
                  className="hover:text-orange-600 transition-colors"
                >
                  個人情報の取り扱いについて
                </Link>
              </li>
            </ul>
          </div>

          {/* その他 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">🌐 その他</h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3">SNS連携</p>
              <div className="flex space-x-3">
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-400 transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"/>
                  </svg>
                </a>
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-gray-500">
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/images/icons/icon_origin.png" 
                alt="おたよりポン！アイコン" 
                className="w-5 h-5"
              />
              <span className="font-medium text-orange-600">おたよりポン！</span>
            </div>
            <span>© 2025 おたよりポン！. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
