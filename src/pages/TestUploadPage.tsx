import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../EnhancedAppContext';

const TestUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppContext();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          おたより画像アップロード
        </h1>
        
        <div className="mb-6 text-center">
          <p className="text-gray-600 mb-4">
            学校からのおたよりを撮影してアップロードすると、AIが内容を解析します
          </p>
          {isAuthenticated ? (
            <p className="text-green-600">
              ログイン済み: {user?.username || user?.email}
            </p>
          ) : (
            <p className="text-orange-600">
              ゲストモード（機能制限あり）
            </p>
          )}
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50">
          <div className="space-y-4">
            <div className="text-4xl text-gray-400">📷</div>
            <h3 className="text-lg font-medium text-gray-700">
              画像をアップロード
            </h3>
            <p className="text-gray-500">
              クリックして画像を選択するか、ここにドラッグ&ドロップ
            </p>
            <div className="pt-4">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="file-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    alert(`ファイル選択済み: ${file.name}\n（処理機能は開発中です）`);
                  }
                }}
              />
              <label
                htmlFor="file-upload"
                className="inline-block px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 cursor-pointer transition-colors"
              >
                画像を選択
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            ホームに戻る
          </button>
          <button
            onClick={() => alert('OCR・AI処理機能は開発中です')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            disabled
          >
            AIで解析（開発中）
          </button>
        </div>

        <div className="mt-8 bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">開発中機能：</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• OCR（文字認識）</li>
            <li>• Gemini AI による内容解析</li>
            <li>• タスク・スケジュール自動抽出</li>
            <li>• Firebase保存機能</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestUploadPage;
