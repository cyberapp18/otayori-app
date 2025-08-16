import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '@/EnhancedAppContext';
import { Notice } from '@/types/index';

interface UploadState {
  step: 'select' | 'processing' | 'preview' | 'complete';
  selectedFile: File | null;
  imagePreview: string | null;
  ocrText: string | null;
  extractedData: any | null;
  error: string | null;
  isProcessing: boolean;
}

const TestUploadPageAdvanced: React.FC = () => {
  const { addNotice, isAuthenticated } = useAppContext();
  const navigate = useNavigate();
  
  const [uploadState, setUploadState] = useState<UploadState>({
    step: 'select',
    selectedFile: null,
    imagePreview: null,
    ocrText: null,
    extractedData: null,
    error: null,
    isProcessing: false
  });

  // ファイル選択処理
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadState(prev => ({
        ...prev,
        error: '画像ファイルを選択してください（PNG、JPG、HEIC対応）'
      }));
      return;
    }

    // ファイルサイズチェック（10MB制限）
    if (file.size > 10 * 1024 * 1024) {
      setUploadState(prev => ({
        ...prev,
        error: 'ファイルサイズは10MB以下にしてください'
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadState(prev => ({
        ...prev,
        selectedFile: file,
        imagePreview: result,
        error: null,
        step: 'preview'
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  // ドラッグ&ドロップ処理
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // OCR処理（モック版）
  const performOCR = async (file: File): Promise<string> => {
    // 実際のOCR処理の代わりにモックデータを返す
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒待機
    
    return `学級だより　3年2組　2025年8月
夏休みの宿題について
提出期限：8月31日まで
持参物：
・夏休みの宿題（ドリル）
・読書感想文（原稿用紙2枚以上）
・自由研究（テーマ自由）
・図工作品（サイズ：B4以内）

2学期開始日：9月1日（月）
持参物：
・上履き
・筆記用具
・連絡帳
・雑巾2枚（記名）

保護者会のお知らせ
日時：9月15日（日）14:00-16:00
場所：3年2組教室
内容：2学期の学習内容について
出欠確認票の提出をお願いします。`;
  };

  // AI処理（モック版）
  const performAIExtraction = async (ocrText: string): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5秒待機
    
    return {
      header: {
        title: "学級だより",
        class_name: "3年2組",
        school_name: null,
        issue_month: "2025-08",
        issue_date: "2025-08-14"
      },
      actions: [
        {
          type: "todo",
          event_name: "夏休みの宿題提出",
          event_date: null,
          due_date: "2025-08-31",
          items: [
            "夏休みの宿題（ドリル）",
            "読書感想文（原稿用紙2枚以上）",
            "自由研究（テーマ自由）",
            "図工作品（サイズ：B4以内）"
          ],
          fee: null,
          repeat_rule: null,
          audience: "保護者・児童",
          importance: "high",
          action_required: true,
          notes: null,
          confidence: {
            date: 0.9,
            due: 0.95,
            items: 0.88
          }
        },
        {
          type: "event",
          event_name: "2学期開始",
          event_date: "2025-09-01",
          due_date: null,
          items: [
            "上履き",
            "筆記用具",
            "連絡帳",
            "雑巾2枚（記名）"
          ],
          fee: null,
          repeat_rule: null,
          audience: "保護者・児童",
          importance: "high",
          action_required: true,
          notes: null,
          confidence: {
            date: 0.95,
            due: 0.8,
            items: 0.9
          }
        },
        {
          type: "event",
          event_name: "保護者会",
          event_date: "2025-09-15",
          due_date: "2025-09-10",
          items: [
            "出欠確認票の提出"
          ],
          fee: null,
          repeat_rule: null,
          audience: "保護者",
          importance: "medium",
          action_required: true,
          notes: "2学期の学習内容について",
          confidence: {
            date: 0.9,
            due: 0.85,
            items: 0.8
          }
        }
      ],
      info: [
        {
          title: "2学期開始について",
          summary: "9月1日から2学期が開始されます。必要な持参物をご準備ください。",
          audience: "保護者・児童",
          importance: "medium"
        }
      ]
    };
  };

  // 処理開始
  const handleProcess = async () => {
    if (!uploadState.selectedFile) return;

    setUploadState(prev => ({
      ...prev,
      step: 'processing',
      isProcessing: true,
      error: null
    }));

    try {
      // OCR処理
      const ocrText = await performOCR(uploadState.selectedFile);
      
      setUploadState(prev => ({
        ...prev,
        ocrText
      }));

      // AI処理
      const extractedData = await performAIExtraction(ocrText);
      
      setUploadState(prev => ({
        ...prev,
        extractedData,
        step: 'complete',
        isProcessing: false
      }));

    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        error: '処理中にエラーが発生しました。もう一度お試しください。',
        step: 'preview',
        isProcessing: false
      }));
    }
  };

  // 結果を保存
  const handleSave = () => {
    if (!uploadState.extractedData) return;

    const newNotice: Notice = {
      id: Date.now().toString(),
      familyId: 'test-family',
      rawText: uploadState.ocrText || '',
      extractJson: uploadState.extractedData,
      summary: uploadState.extractedData?.header?.title || 'おたより',
      createdAt: new Date().toISOString(),
      seenBy: [],
      pinned: false,
      originalImage: uploadState.imagePreview || null,
      childIds: []
    };

    addNotice(newNotice);
    navigate('/dashboard');
  };

  // 新しいファイルを選択
  const handleReset = () => {
    setUploadState({
      step: 'select',
      selectedFile: null,
      imagePreview: null,
      ocrText: null,
      extractedData: null,
      error: null,
      isProcessing: false
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          おたより撮影 📷
        </h1>
        <p className="text-gray-600">
          学校からのおたよりを撮影してアップロードしてください
        </p>
      </div>

      {/* エラー表示 */}
      {uploadState.error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-500 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラー</h3>
              <div className="mt-2 text-sm text-red-700">
                {uploadState.error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ステップ1: ファイル選択 */}
      {uploadState.step === 'select' && (
        <div className="space-y-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-orange-300 rounded-lg p-12 text-center hover:border-orange-400 transition-colors cursor-pointer"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <div className="space-y-4">
              <div className="text-6xl">📁</div>
              <div>
                <h3 className="text-lg font-medium text-gray-700">
                  ファイルをドラッグ&ドロップまたはクリック
                </h3>
                <p className="text-gray-500 mt-1">
                  PNG、JPG、HEIC形式に対応（最大10MB）
                </p>
              </div>
            </div>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
            />
          </div>

          {!isAuthenticated && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <span className="text-yellow-500 text-xl mr-3">💡</span>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    ログインすると便利！
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    <Link to="/login" className="underline hover:no-underline">
                      ログイン
                    </Link>
                    すると、処理結果を保存してタスク管理ができます。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ステップ2: プレビューと処理開始 */}
      {uploadState.step === 'preview' && uploadState.imagePreview && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">選択された画像</h2>
            <div className="flex justify-center">
              <img
                src={uploadState.imagePreview}
                alt="選択された画像"
                className="max-h-96 max-w-full object-contain rounded-lg shadow-md"
              />
            </div>
            <div className="mt-4 text-center text-gray-600">
              <p>ファイル名: {uploadState.selectedFile?.name}</p>
              <p>
                サイズ: {((uploadState.selectedFile?.size || 0) / 1024 / 1024).toFixed(2)}MB
              </p>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleProcess}
              className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              🤖 文字認識とAI解析を開始
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              別の画像を選択
            </button>
          </div>
        </div>
      )}

      {/* ステップ3: 処理中 */}
      {uploadState.step === 'processing' && (
        <div className="text-center space-y-6">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">処理中...</h2>
            <p className="text-gray-600">
              画像から文字を読み取り、AI解析を行っています
            </p>
            <div className="mt-4 text-sm text-gray-500">
              通常30秒〜1分程度かかります
            </div>
          </div>
        </div>
      )}

      {/* ステップ4: 完了 */}
      {uploadState.step === 'complete' && uploadState.extractedData && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-green-800 mb-2">
              ✅ 処理完了！
            </h2>
            <p className="text-green-700">
              おたよりの内容を解析しました。以下の結果をご確認ください。
            </p>
          </div>

          {/* 抽出されたデータの表示 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 基本情報 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">📄 基本情報</h3>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="font-medium w-20">タイトル:</span>
                  <span>{uploadState.extractedData.header.title}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-20">クラス:</span>
                  <span>{uploadState.extractedData.header.class_name}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-20">発行月:</span>
                  <span>{uploadState.extractedData.header.issue_month}</span>
                </div>
              </div>
            </div>

            {/* アクション */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">✅ アクション ({uploadState.extractedData.actions.length}件)</h3>
              <div className="space-y-3">
                {uploadState.extractedData.actions.slice(0, 3).map((action: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        action.type === 'event' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {action.type === 'event' ? 'イベント' : 'タスク'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        action.importance === 'high' ? 'bg-red-100 text-red-800' :
                        action.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {action.importance === 'high' ? '重要' : 
                         action.importance === 'medium' ? '普通' : '低'
                        }
                      </span>
                    </div>
                    <div className="font-medium">{action.event_name}</div>
                    <div className="text-sm text-gray-600">
                      {action.due_date && `期限: ${action.due_date}`}
                      {action.event_date && `日時: ${action.event_date}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex space-x-4">
            {isAuthenticated ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  💾 保存してダッシュボードへ
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  🔄 新しいおたよりを追加
                </button>
              </>
            ) : (
              <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  結果を保存するには
                  <Link to="/login" className="font-medium underline hover:no-underline ml-1">
                    ログイン
                  </Link>
                  が必要です
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* フッター */}
      <div className="mt-12 text-center">
        <Link to="/dashboard" className="text-orange-600 hover:underline">
          ← ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
};

export default TestUploadPageAdvanced;
