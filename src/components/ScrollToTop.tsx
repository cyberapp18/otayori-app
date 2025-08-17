import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop: React.FC = () => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // 複数の方法でスクロールをリセット
    const resetScroll = () => {
      // 即座にリセット
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    // 即座に実行
    resetScroll();

    // requestAnimationFrameで確実に実行
    requestAnimationFrame(() => {
      resetScroll();
    });

    // 少し遅延させて再度実行
    const timer = setTimeout(() => {
      resetScroll();
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname, search, hash]); // pathname, search, hash が変わるたびに実行

  return null;
};

export default ScrollToTop;
