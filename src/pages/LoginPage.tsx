

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import Button from '../components/Button';
import { sanitize } from '../services/sanitization';
import { sendPasswordResetEmail } from '../services/authService';


const LoginPage: React.FC = () => {
  // パスワードリセット用
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<string|null>(null);
  const [resetError, setResetError] = useState<string|null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetMessage(null);
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(resetEmail);
      setResetMessage('パスワードリセット用のメールを送信しました。メール内のリンクから再設定してください。');
      setResetEmail('');
    } catch (err) {
      setResetError((err as Error).message);
    } finally {
      setResetLoading(false);
    }
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(sanitize(email), password);
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 px-4 sm:px-6 lg:px-8 pb-20 md:pb-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-orange-600">
            おたよりポン！へようこそ
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            アカウントにログインしてください
          </p>
        </div>
  <form className="mt-8 space-y-6 bg-white p-8 rounded-2xl shadow-lg" onSubmit={handleSubmit}>
          {/* パスワードリセットモーダル */}
          {showReset && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
                <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => { setShowReset(false); setResetError(null); setResetMessage(null); }}>&times;</button>
                <h2 className="text-lg font-bold mb-4 text-center">パスワード再設定</h2>
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <input
                    type="email"
                    className="border rounded px-3 py-2 w-full"
                    placeholder="登録メールアドレス"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className="w-full bg-orange-500 text-white rounded py-2 font-semibold hover:bg-orange-600 disabled:opacity-50" disabled={resetLoading}>
                    {resetLoading ? '送信中...' : 'リセットメール送信'}
                  </button>
                  {resetMessage && <div className="text-green-600 text-sm text-center">{resetMessage}</div>}
                  {resetError && <div className="text-red-600 text-sm text-center">{resetError}</div>}
                </form>
              </div>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">メールアドレス</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password-sr" className="sr-only">パスワード</label>
              <input
                id="password-sr"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Button type="submit" isLoading={isLoading}>
              ログイン
            </Button>
          </div>
          <div className="text-right mt-2">
            <button type="button" className="text-sm text-orange-600 hover:underline" onClick={() => setShowReset(true)}>
              パスワードをお忘れの方はこちら
            </button>
          </div>
        </form>
        <p className="mt-2 text-center text-sm text-gray-600">
          アカウントをお持ちでないですか？{' '}
          <Link to="/signup" className="font-medium text-orange-600 hover:text-orange-500">
            無料で新規登録
          </Link>
        </p>
         <p className="text-center text-sm text-gray-600">
          <Link to="/" className="font-medium text-gray-500 hover:text-gray-700">
            &larr; ホームに戻る
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
