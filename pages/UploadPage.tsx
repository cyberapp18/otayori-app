
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import Uploader from '../components/Uploader';
import Spinner from '../components/Spinner';
import ExtractPreview from '../components/ExtractPreview';
import Button from '../components/Button';
import { performOCR } from '../services/ocrService';
import { extractClassNewsletterData } from '../services/geminiService';
import { sanitize } from '../services/sanitization';
import { ClassNewsletterSchema, Notice } from '../types';

enum UploadStep {
  SelectFile,
  ProcessingOCR,
  ProcessingAI,
  Preview,
  Error,
}

// Recursively sanitizes string properties of an object to prevent XSS.
const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
        return sanitize(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    // Avoid trying to process React elements or other complex objects
    if (obj !== null && typeof obj === 'object' && !obj.hasOwnProperty('$$typeof')) { 
        const newObj: { [key: string]: any } = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = sanitizeObject(obj[key]);
            }
        }
        return newObj;
    }
    // Return numbers, booleans, null, etc., as is.
    return obj; 
}


const UploadPage: React.FC = () => {
  const [step, setStep] = useState<UploadStep>(UploadStep.SelectFile);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ClassNewsletterSchema | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);

  const { addNotice, imageRetention, children, isAuthenticated } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    // Record start time when component mounts
    setStartTime(Date.now());
  }, []);

  const handleChildSelect = (childId: string) => {
    setSelectedChildIds(prev =>
        prev.includes(childId) ? prev.filter(id => id !== childId) : [...prev, childId]
    );
  };

  const handleFileSelect = async (file: File, dataUrl: string) => {
    try {
      setImageDataUrl(dataUrl);
      setStep(UploadStep.ProcessingOCR);
      const ocrText = await performOCR(file);
      setRawText(ocrText);
      setStep(UploadStep.ProcessingAI);
      const data = await extractClassNewsletterData(ocrText);
      const sanitizedData = sanitizeObject(data);
      setExtractedData(sanitizedData);
      setStep(UploadStep.Preview);
    } catch (e) {
      const err = e as Error;
      setError(err.message);
      setStep(UploadStep.Error);
    }
  };

  const handleConfirm = async () => {
    if (!extractedData || !rawText) return;

    try {
      setIsSubmitting(true);
      
      const newNotice: Notice = {
        id: `notice-${Date.now()}`,
        familyId: 'family-1', // Mocked
        rawText,
        extractJson: extractedData,
        summary: extractedData.overview, // Summary now comes directly from the overview field
        createdAt: new Date().toISOString(),
        seenBy: [],
        pinned: false,
        originalImage: imageRetention ? imageDataUrl : null,
        childIds: selectedChildIds,
      };

      addNotice(newNotice);

      if (startTime) {
        const magicMomentDuration = (Date.now() - startTime) / 1000;
        console.log(`Magic Moment Achieved: ${magicMomentDuration.toFixed(2)} seconds`);
        // In a real app, you would send this metric to an analytics service.
      }

      navigate('/');
    } catch (e) {
      const err = e as Error;
      setError(err.message);
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
        return (
          extractedData && (
            <div className="space-y-6">
              <ExtractPreview data={extractedData} />

              {isAuthenticated && children.length > 0 && (
                 <div className="bg-white p-6 rounded-xl shadow-md">
                    <h4 className="text-lg font-bold text-gray-800 mb-1">関連するお子さんを選択</h4>
                    <p className="text-sm text-gray-500 mb-4">このおたよりが誰に関するものか選んでください。（複数選択可）</p>
                    <div className="space-y-3">
                        {children.map(child => (
                            <div key={child.id} className="flex items-center p-3 rounded-lg hover:bg-orange-50 transition-colors">
                                <input
                                    type="checkbox"
                                    id={`child-${child.id}`}
                                    checked={selectedChildIds.includes(child.id)}
                                    onChange={() => handleChildSelect(child.id)}
                                    className="h-5 w-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                                />
                                <label htmlFor={`child-${child.id}`} className="ml-3 text-gray-700 font-medium cursor-pointer flex-1">
                                    {child.name} さん
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={handleReset} variant="secondary" disabled={isSubmitting}>やり直す</Button>
                  <Button onClick={handleConfirm} isLoading={isSubmitting}>確定して登録</Button>
              </div>
            </div>
          )
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