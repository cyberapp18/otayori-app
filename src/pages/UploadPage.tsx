// pages/UploadPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/EnhancedAppContext';
import Uploader from '@/components/Uploader';
import Spinner from '@/components/Spinner';
import ExtractPreview from '@/components/ExtractPreview';
import Button from '@/components/Button';
import { performOCR } from '@/services/ocrService';
import { extractClassNewsletterData } from '@/services/geminiService';
import { sanitize } from '@/services/sanitization';
import { ClassNewsletterSchema, Notice } from '@/types/index';
import type { Task } from "@/types/index";

// normalizeToISODate関数の定義
const normalizeToISODate = (dateStr: string | null, fallbackMonth: string | null): string => {
  if (!dateStr) return new Date().toISOString();
  try {
    const date = new Date(dateStr);
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
};

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

  const { addNotice, imageRetention, children, isAuthenticated, user, addTask } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => { setStartTime(Date.now()); }, []);

  const handleChildSelect = (childId: string) => {
    setSelectedChildIds(prev => prev.includes(childId)
      ? prev.filter(id => id !== childId)
      : [...prev, childId]
    );
  };

  const handleFileSelect = async (file: File, dataUrl: string) => {
    try {
      setImageDataUrl(dataUrl);
      setStep(UploadStep.ProcessingOCR);

      const ocrText = await performOCR(file);
      setRawText(ocrText);

      setStep(UploadStep.ProcessingAI);
      const normalized = await extractClassNewsletterData(ocrText);

      // XSS対策＋null対策
      const sanitized = sanitizeObject(normalized) as ClassNewsletterSchema;
      setExtractedData(sanitized);

      setStep(UploadStep.Preview);
    } catch (e) {
      setError((e as Error).message || '予期せぬエラーが発生しました');
      setStep(UploadStep.Error);
    }
  };

  const handleConfirm = async () => {
    if (!extractedData || !rawText) return;
    try {
      setIsSubmitting(true);

      if (!isAuthenticated) {
        alert("AIによる分析が完了しました！\nログインすると、この情報を保存して家族と共有できます。");
        navigate("/login?from=upload-demo");
        return;
      }

      // 1) Notice の保存（既存のまま）
      const noticeId = `notice-${Date.now()}`;
      const newNotice = {
        id: noticeId,
        familyId: user!.uid,
        rawText,
        extractJson: extractedData,
        summary: extractedData.overview,
        createdAt: new Date().toISOString(),
        seenBy: [],
        pinned: false,
        originalImage: imageRetention ? imageDataUrl : null,
        childIds: selectedChildIds,
      };
      addNotice(newNotice);

      // 2) actions → tasks へ変換（★ここがポイント）
      const tasks: Task[] = extractedData.actions.map((a, i) => ({
        id: `task-${Date.now()}-${i}`,
        familyId: user!.uid,
        noticeId,
        title: a.event_name,
        dueAt: normalizeToISODate(
          a.due_date || a.event_date || null,
          extractedData.header?.issue_month || null
        ),
        assigneeCid: selectedChildIds[0] ?? "unassigned",
        completed: false,
        createdAt: new Date().toISOString(),
        isContinuation: !!a.is_continuation,
        repeatRule: a.repeat_rule ?? null,
        notes: a.notes ?? undefined,
        childIds: selectedChildIds,
      }));

      // 3) 保存
      await Promise.all(tasks.map(t => addTask(t)));

      navigate("/dashboard");
    } catch (e) {
      setError((e as Error).message);
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
    switch (step) {
      case UploadStep.SelectFile:
        return <Uploader onFileSelect={handleFileSelect} />;

      case UploadStep.ProcessingOCR:
        return <Spinner text="画像を解析しています..." />;

      case UploadStep.ProcessingAI:
        return <Spinner text="AIが内容を読み取っています..." />;

      case UploadStep.Preview:
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

            {/* ログイン済みなら子ども選択UI（既存の実装を挿入） */}
            {isAuthenticated && children.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-md">
                {/* TODO: ここに既存の子供選択UIを配置 */}
              </div>
            )}

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

  return <div className="max-w-2xl mx-auto">{renderContent()}</div>;
};

export default UploadPage;
