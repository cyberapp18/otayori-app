import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface ScrollRestorationProps {
  children?: React.ReactNode;
}

const ScrollRestoration: React.FC<ScrollRestorationProps> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // ページ遷移の度に実行
    const handleRouteChange = () => {
      // 複数の方法でスクロールをリセット
      const resetScroll = () => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        
        // html要素にもスクロールリセットを適用
        const htmlElement = document.querySelector('html');
        if (htmlElement) {
          htmlElement.scrollTop = 0;
        }
      };

      // 即座に実行
      resetScroll();

      // requestAnimationFrameで確実に実行
      requestAnimationFrame(() => {
        resetScroll();
        
        // さらにもう一度requestAnimationFrameで実行
        requestAnimationFrame(() => {
          resetScroll();
        });
      });

      // 少し遅延させても実行
      setTimeout(() => {
        resetScroll();
      }, 10);

      // さらに遅延させても実行
      setTimeout(() => {
        resetScroll();
      }, 100);
    };

    handleRouteChange();
  }, [location.pathname, location.search, location.hash]);

  return <>{children}</>;
};

export default ScrollRestoration;
