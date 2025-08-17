import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { FamilyService } from '../services/familyService';
import Button from '../components/Button';
import Header from '../components/Header';

const InvitePage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { user, userProfile, refreshUser } = useAppContext();
  
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 招待情報の取得
  useEffect(() => {
    const fetchInviteInfo = async () => {
      if (!inviteCode) {
        setError('無効な招待リンクです');
        setIsLoading(false);
        return;
      }

      try {
        const invite = await FamilyService.getInviteByCode(inviteCode);
        if (!invite) {
          setError('招待コードが見つからないか、期限切れです');
        } else {
          setInviteInfo(invite);
        }
      } catch (error) {
        console.error('招待情報取得エラー:', error);
        setError('招待情報の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInviteInfo();
  }, [inviteCode]);

  // 既にログイン済みかつ家族に参加済みの場合はダッシュボードに遷移
  useEffect(() => {
    if (user && userProfile?.familyId) {
      navigate('/dashboard');
    }
  }, [user, userProfile, navigate]);

  // 招待を受け入れる処理
  const handleAcceptInvite = async () => {
    if (!inviteCode || !user) return;

    try {
      setIsProcessing(true);
      setError(null);

      // 招待を受け入れ、家族に参加
      await FamilyService.acceptInvite(inviteCode, user.uid);
      
      // ユーザー情報を再取得
      await refreshUser();
      
      // ダッシュボードに遷移
      navigate('/dashboard', { 
        replace: true,
        state: { message: '家族への参加が完了しました！' }
      });
      
    } catch (error) {
      console.error('招待受け入れエラー:', error);
      setError(error instanceof Error ? error.message : '招待の受け入れに失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // サインアップページに遷移（招待コードを保持）
  const handleSignUp = () => {
    navigate(`/signup?inviteCode=${inviteCode}`, { replace: true });
  };

  // ログインページに遷移（招待コードを保持）
  const handleLogin = () => {
    navigate(`/login?inviteCode=${inviteCode}`, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-orange-50 pb-20 md:pb-8">
        <Header />
        <div className="max-w-md mx-auto pt-20 px-4">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">招待情報を確認しています...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-orange-50 pb-20 md:pb-8">
        <Header />
        <div className="max-w-md mx-auto pt-20 px-4">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-800 mb-4">招待リンクエラー</h1>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={() => navigate('/landing')} className="w-full">
              ホームに戻る
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ユーザーがログインしている場合
  if (user) {
    return (
      <div className="min-h-screen bg-orange-50 pb-20 md:pb-8">
        <Header />
        <div className="max-w-md mx-auto pt-20 px-4">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-center mb-6">
              <div className="text-orange-500 text-5xl mb-4">👨‍👩‍👧‍👦</div>
              <h1 className="text-xl font-bold text-gray-800 mb-2">家族への招待</h1>
              <p className="text-gray-600">
                {inviteInfo?.familyName || '家族'}に招待されました
              </p>
            </div>
            
            {inviteInfo && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-700">
                  <strong>招待者:</strong> {inviteInfo.invitedByName || '家族メンバー'}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>家族名:</strong> {inviteInfo.familyName || '未設定'}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button 
                onClick={handleAcceptInvite}
                isLoading={isProcessing}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? '参加中...' : '家族に参加する'}
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                後で決める
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ユーザーがログインしていない場合
  return (
    <div className="min-h-screen bg-orange-50 pb-20 md:pb-8">
      <Header />
      <div className="max-w-md mx-auto pt-20 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center mb-6">
            <div className="text-orange-500 text-5xl mb-4">👨‍👩‍👧‍👦</div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">家族への招待</h1>
            <p className="text-gray-600">
              {inviteInfo?.familyName || '家族'}に招待されました
            </p>
          </div>
          
          {inviteInfo && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700">
                <strong>招待者:</strong> {inviteInfo.invitedByName || '家族メンバー'}
              </p>
              <p className="text-sm text-gray-700">
                <strong>家族名:</strong> {inviteInfo.familyName || '未設定'}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button onClick={handleSignUp} className="w-full">
              新規登録して参加する
            </Button>
            <Button variant="secondary" onClick={handleLogin} className="w-full">
              ログインして参加する
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-6">
            おたよりポン！のアカウントが必要です
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvitePage;
