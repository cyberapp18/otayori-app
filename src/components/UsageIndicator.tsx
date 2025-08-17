import React from 'react';
import { useAppContext } from '../AppContext';
import { Link } from 'react-router-dom';

const UsageIndicator: React.FC = () => {
  const { isAuthenticated, usageInfo, isLoading } = useAppContext();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-sm">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
        <span>読み込み中...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // 未ログイン体験モード表示
    return (
      <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-sm">
        <span>今日は 0/1 回（体験）</span>
      </div>
    );
  }

  if (!usageInfo) {
    return null;
  }

  const getPlanDisplayName = (plan: string): string => {
    switch (plan) {
      case 'free': return '無料';
      case 'standard': return 'スタンダード';
      case 'pro': return 'プロ';
      default: return plan;
    }
  };

  const getStatusColor = (remaining: number, needsUpgrade: boolean): string => {
    if (needsUpgrade || remaining === 0) return 'bg-red-100 text-red-800 border-red-200';
    if (remaining <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <div className={`flex items-center space-x-2 px-3 py-1 border rounded-full text-sm ${getStatusColor(usageInfo.remaining, usageInfo.needsUpgrade)}`}>
      <span>
        今月 あと{usageInfo.remaining}回 
        <span className="ml-1 text-xs opacity-75">
          ({getPlanDisplayName(usageInfo.planType)})
        </span>
      </span>
      {usageInfo.needsUpgrade && (
        <Link
          to="/pricing"
          className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
        >
          アップグレード
        </Link>
      )}
    </div>
  );
};

export default UsageIndicator;
