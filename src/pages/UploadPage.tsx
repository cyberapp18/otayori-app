// pages/UploadPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import Uploader from '../components/Uploader';
import Spinner from '../components/Spinner';
import ExtractPreview from '../components/ExtractPreview';
import Button from '../components/Button';
import { performOCR } from '../services/ocrService';
import { extractClassNewsletterData } from '../services/geminiService';
import { sanitize } from '../services/sanitization';
import { UserService } from '../services/userService';
import { AnalysisService } from '../services/analysisService';
import { ClassNewsletterSchema } from '../types';

enum UploadStep {
  SelectFile,
  ProcessingOCR,
  ProcessingAI,
  Preview,
  Error,
}

// 全フィールドにXSS対策（React要素は無視）
const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') return sanitize(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj && typeof obj === 'object' && !obj.$$typeof) {
    const out: Record<string, any> = {};
    for (const k of Object.keys(obj)) out[k] = sanitizeObject(obj[k]);
    return out;
  }
  return obj;
};

const UploadPage: React.FC = () => {
  const [step, setStep] = useState<UploadStep>(UploadStep.SelectFile);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ClassNewsletterSchema | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [usageInfo, setUsageInfo] = useState<any>(null);

  const { isAuthenticated, user, usageInfo: contextUsageInfo } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => { 
    setStartTime(Date.now()); 
    // usageInfoを取得
    if (contextUsageInfo) {
      setUsageInfo(contextUsageInfo);
    } else if (user && isAuthenticated) {
      // フォールバックとして直接取得
      UserService.checkUsageLimit(user.uid).then(setUsageInfo);
    }
  }, [user, isAuthenticated, contextUsageInfo]);

  const handleChildSelect = (childId: string) => {
    setSelectedChildIds(prev => prev.includes(childId)
      ? prev.filter(id => id !== childId)
      : [...prev, childId]
    );
  };

  const handleFileSelect = async (file: File, dataUrl: string) => {
    // プラン制限チェック
    if (isAuthenticated && user) {
      const currentUsage = await UserService.checkUsageLimit(user.uid);
      setUsageInfo(currentUsage);
      
      if (!currentUsage.canUse) {
        setError(`今月の利用制限に達しました。残り${currentUsage.remaining}回です。プランをアップグレードするか、来月まで待ってください。`);
        setStep(UploadStep.Error);
        return;
      }
    }

    console.log('handleFileSelect called with:', file.name);
    try {
      setImageDataUrl(dataUrl);
      setStep(UploadStep.ProcessingOCR);
      setStartTime(Date.now());

      // 実際のOCRを実行
      console.log('Starting OCR processing...');
      const ocrResult = await performOCR(file);
      console.log('OCR completed, text length:', ocrResult.length);
      
      if (!ocrResult || ocrResult.trim().length === 0) {
        throw new Error('画像からテキストを抽出できませんでした。');
      }
      
      setRawText(ocrResult);
      setStep(UploadStep.ProcessingAI);

      // 実際のAI解析を実行
      console.log('Starting AI analysis...');
      const aiResult = await extractClassNewsletterData(ocrResult);
      console.log('AI analysis completed:', aiResult);
      
      // サニタイズ
      const sanitizedData = sanitizeObject(aiResult);
      setExtractedData(sanitizedData);
      setStep(UploadStep.Preview);
    } catch (e) {
      console.error('Error in handleFileSelect:', e);
      const errorMessage = (e as Error).message || '予期せぬエラーが発生しました';
      setError(errorMessage);
      setStep(UploadStep.Error);
    }
  };

  const handleConfirm = async () => {
    if (!extractedData || !rawText) return;
    try {
      setIsSubmitting(true);
      console.log('🚀 Starting confirm process...');

      if (!isAuthenticated) {
        alert("AIによる分析が完了しました！\nログインすると、この情報を保存して家族と共有できます。");
        navigate("/login?from=upload-demo");
        return;
      }

      console.log('✅ User authenticated:', user?.uid);

      // 使用量をインクリメント（認証済みユーザーのみ）
      if (user) {
        console.log('📊 Incrementing usage...');
        await UserService.incrementUsage(user.uid);
        console.log('✅ Usage incremented for user:', user.uid);
        
        console.log('💾 Saving analysis...', {
          userId: user.uid,
          rawTextLength: rawText.length,
          extractedData,
          selectedChildIds,
          hasImageData: !!imageDataUrl
        });

        // 解析結果を保存
        const analysisId = await AnalysisService.saveAnalysis(
          user.uid,
          rawText,
          extractedData,
          selectedChildIds,
          // 開発環境では画像データを渡さない
          import.meta.env.DEV ? undefined : (imageDataUrl || undefined)
        );
        console.log('✅ Analysis saved with ID:', analysisId);

        // 保存成功メッセージ
        alert('解析結果が正常に保存されました！ダッシュボードで確認できます。');
      }
      
      console.log('🎯 Navigating to dashboard...');
      navigate("/dashboard");
    } catch (e) {
      console.error('❌ Error in handleConfirm:', e);
      setError(`保存に失敗しました: ${(e as Error).message}`);
      setStep(UploadStep.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(UploadStep.SelectFile);
    setError(null);
    setRawText(null);
    setExtractedData(null);
    setStartTime(Date.now());
    setIsSubmitting(false);
    setSelectedChildIds([]);
    setImageDataUrl(null);
  };

  const renderContent = () => {
    console.log('renderContent called, current step:', step);
    switch (step) {
      case UploadStep.SelectFile:
        return (
          <div className="space-y-6">
            {/* 使用状況表示 */}
            {isAuthenticated && usageInfo && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">利用状況</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">プラン</p>
                    <p className="text-lg font-bold text-blue-600">
                      {usageInfo.planType === 'free' ? '無料プラン' : 
                       usageInfo.planType === 'standard' ? 'スタンダード' : 'プロプラン'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">残り回数</p>
                    <p className={`text-lg font-bold ${usageInfo.canUse ? 'text-green-600' : 'text-red-600'}`}>
                      {usageInfo.remaining}回
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">状態</p>
                    <p className={`text-lg font-bold ${usageInfo.canUse ? 'text-green-600' : 'text-red-600'}`}>
                      {usageInfo.canUse ? '利用可能' : '制限中'}
                    </p>
                  </div>
                </div>
                {usageInfo.needsUpgrade && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                    <p className="text-orange-800 text-sm">
                      今月の利用制限に達しました。プランをアップグレードしてより多くご利用ください。
                    </p>
                  </div>
                )}
              </div>
            )}
            <Uploader onFileSelect={handleFileSelect} />
          </div>
        );

      case UploadStep.ProcessingOCR:
        return <Spinner text="画像を解析しています..." />;

      case UploadStep.ProcessingAI:
        return <Spinner text="AIが内容を読み取っています..." />;

      case UploadStep.Preview:
        console.log('Rendering preview step, extractedData:', extractedData);
        return extractedData ? (
          <div className="space-y-6">
            <ExtractPreview data={extractedData} />

            {/* 未ログインは保存不可の案内 */}
            {!isAuthenticated && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <h4 className="text-blue-800 font-bold mb-2">✨ AI分析完了！</h4>
                <p className="text-blue-700 text-sm mb-3">
                  おたよりの内容をAIが自動で整理しました。
                  <br />ログインすると、この情報を保存して家族と共有できます。
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/signup')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    新規登録して保存
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200"
                  >
                    ログインして保存
                  </button>
                </div>
              </div>
            )}

            {/* ログイン済みなら子ども選択UI（後で実装予定） */}
            {/* {isAuthenticated && children && Array.isArray(children) && children.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-md">
                <div>子ども選択UIをここに実装予定</div>
              </div>
            )} */}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleReset} variant="secondary" disabled={isSubmitting}>
                やり直す
              </Button>
              <Button onClick={handleConfirm} isLoading={isSubmitting}>
                {isAuthenticated ? '確定して登録' : '体験完了'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center p-8">
            <p>データの読み込みに失敗しました。</p>
            <Button onClick={handleReset}>やり直す</Button>
          </div>
        );

      case UploadStep.Error:
        return (
          <div className="text-center p-8 bg-white rounded-xl shadow-md">
            <h3 className="text-xl font-bold text-red-600">エラーが発生しました</h3>
            <p className="mt-2 text-gray-600">{error}</p>
            <div className="mt-6">
              <Button onClick={handleReset}>もう一度試す</Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="max-w-2xl mx-auto pb-20 md:pb-8">{renderContent()}</div>;
};

export default UploadPage;
