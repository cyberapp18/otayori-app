import React, { useState } from 'react';
import Button from '../components/Button';
import { useAppContext } from '../AppContext';

const BugReportPage: React.FC = () => {
  const { user } = useAppContext();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps: '',
    expected: '',
    actual: '',
    browser: '',
    device: '',
    severity: 'medium'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // バリデーション
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('タイトルと詳細は必須項目です。');
      setIsLoading(false);
      return;
    }

    try {
      // TODO: 実際の送信処理（GitHub Issues、Jira等と連携）
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSubmitted(true);
    } catch (err) {
      setError('不具合報告の送信に失敗しました。しばらく後でもう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[60vh] bg-cream pt-8 pb-20 md:pb-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">不具合報告を受け付けました</h2>
            <p className="text-gray-600 mb-6">
              不具合をご報告いただき、ありがとうございます。<br />
              開発チームで確認し、修正対応を進めさせていただきます。
            </p>
            <Button 
              variant="primary" 
              onClick={() => window.history.back()}
            >
              前のページに戻る
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-cream pt-8 pb-20 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">不具合報告</h1>
            <p className="text-gray-600">
              サービスの動作に問題がございましたら、詳細をお教えください。<br />
              できるだけ詳しい情報をご提供いただくことで、迅速な対応が可能になります。
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                不具合のタイトル *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="例：アップロード時にエラーが発生する"
              />
            </div>

            <div>
              <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-2">
                重要度
              </label>
              <select
                id="severity"
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="low">低（軽微な問題）</option>
                <option value="medium">中（通常利用に支障がある）</option>
                <option value="high">高（サービス利用ができない）</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                不具合の詳細 *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="どのような問題が発生したか詳しく説明してください..."
              />
            </div>

            <div>
              <label htmlFor="steps" className="block text-sm font-medium text-gray-700 mb-2">
                再現手順
              </label>
              <textarea
                id="steps"
                name="steps"
                rows={3}
                value={formData.steps}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="1. 〇〇ページにアクセスする&#10;2. △△ボタンをクリックする&#10;3. ..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="expected" className="block text-sm font-medium text-gray-700 mb-2">
                  期待される動作
                </label>
                <textarea
                  id="expected"
                  name="expected"
                  rows={2}
                  value={formData.expected}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="本来どのような動作をするはずか..."
                />
              </div>
              <div>
                <label htmlFor="actual" className="block text-sm font-medium text-gray-700 mb-2">
                  実際の動作
                </label>
                <textarea
                  id="actual"
                  name="actual"
                  rows={2}
                  value={formData.actual}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="実際にはどのような動作をしたか..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="browser" className="block text-sm font-medium text-gray-700 mb-2">
                  ブラウザ・OS
                </label>
                <input
                  type="text"
                  id="browser"
                  name="browser"
                  value={formData.browser}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="例：Chrome 120, Windows 11"
                />
              </div>
              <div>
                <label htmlFor="device" className="block text-sm font-medium text-gray-700 mb-2">
                  デバイス
                </label>
                <input
                  type="text"
                  id="device"
                  name="device"
                  value={formData.device}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="例：PC, iPhone, Android"
                />
              </div>
            </div>

            {user && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>ユーザー情報:</strong> {user.email} として報告されます
                </p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? '送信中...' : '不具合を報告する'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BugReportPage;
