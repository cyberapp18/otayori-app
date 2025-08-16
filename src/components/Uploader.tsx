import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { CameraIcon, FileIcon, UploadIcon } from './Icon';

interface UploaderProps {
  onFileSelect: (file: File, dataUrl: string) => void;
  maxFileSize?: number; // MB
  supportedFormats?: string[];
  disabled?: boolean;
}

const Uploader: React.FC<UploaderProps> = ({ 
  onFileSelect, 
  maxFileSize = 10,
  supportedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileReaderRef = useRef<FileReader | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ファイル検証
  const validateFile = useCallback((file: File): string | null => {
    if (!supportedFormats.includes(file.type)) {
      return `サポートされていないファイル形式です。対応形式: ${supportedFormats.join(', ')}`;
    }
    
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return `ファイルサイズが大きすぎます。最大${maxFileSize}MBまで対応しています。`;
    }
    
    return null;
  }, [maxFileSize, supportedFormats]);

  // ファイル処理の最適化
  const processFile = useCallback(async (file: File) => {
    if (disabled || isProcessing) return;
    
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);

    try {
      // 前回のFileReaderをクリーンアップ
      if (fileReaderRef.current) {
        fileReaderRef.current.abort();
      }

      const reader = new FileReader();
      fileReaderRef.current = reader;

      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          if (reader.result && typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('ファイルの読み込みに失敗しました。'));
          }
        };
        reader.onerror = () => reject(new Error('ファイルの読み込み中にエラーが発生しました。'));
        reader.readAsDataURL(file);
      });

      setImagePreview(dataUrl);
      onFileSelect(file, dataUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ファイルの処理中にエラーが発生しました。';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [disabled, isProcessing, validateFile, onFileSelect]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const startCamera = useCallback(async () => {
    if (disabled) return;

    // 既存ストリームのクリーンアップ
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    setStream(null);
    setError(null);
    setIsCameraOpen(true);

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setStream(newStream);
    } catch (err) {
      const error = err as { name?: string; message?: string };
      let errorMessage = 'カメラを起動できませんでした。';
      
      switch (error.name) {
        case 'NotAllowedError':
          errorMessage = 'カメラの使用が許可されていません。ブラウザの設定を確認してください。';
          break;
        case 'NotFoundError':
          errorMessage = 'カメラが見つかりませんでした。';
          break;
        case 'NotReadableError':
          errorMessage = 'カメラが他のアプリケーションで使用中です。';
          break;
        default:
          errorMessage = `カメラエラー: ${error.message || '不明なエラー'}`;
      }
      
      setError(errorMessage);
      setIsCameraOpen(false);
    }
  }, [disabled, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsCameraOpen(false);
  }, [stream]);

  const handleTakePicture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || disabled) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas context を取得できませんでした。');
      }

      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      
      const blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      });

      if (!blob) {
        throw new Error('画像の生成に失敗しました。');
      }

      const imageFile = new File([blob], `capture-${Date.now()}.jpg`, { 
        type: 'image/jpeg' 
      });
      
      stopCamera();
      await processFile(imageFile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '写真撮影に失敗しました。';
      setError(errorMessage);
    }
  }, [disabled, stopCamera, processFile]);

  const handleButtonClick = useCallback((type: 'file' | 'camera') => {
    if (disabled) return;
    
    if (type === 'camera') {
      startCamera();
    } else {
      fileInputRef.current?.click();
    }
  }, [disabled, startCamera]);

  // ドラッグ&ドロップのデバウンス
  const dragTimeoutRef = useRef<NodeJS.Timeout>();

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isDragging) {
      setIsDragging(true);
    }
    
    // デバウンス処理
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
  }, [isDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 少し遅延させて、子要素への移動を考慮
    dragTimeoutRef.current = setTimeout(() => {
      setIsDragging(false);
    }, 100);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  // キーボード対応
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      handleButtonClick('file');
    }
  }, [disabled, handleButtonClick]);

  // クリーンアップ
  useEffect(() => {
    const currentStream = stream;
    const currentFileReader = fileReaderRef.current;
    
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      if (currentFileReader) {
        currentFileReader.abort();
      }
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, [stream]);

  // ストリーム管理
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // メモ化された支援テキスト
  const supportedFormatsText = useMemo(() => 
    supportedFormats.map(format => format.split('/')[1].toUpperCase()).join(', ')
  , [supportedFormats]);

  if (isCameraOpen) {
    return (
      <div className="w-full bg-black rounded-xl shadow-lg p-4 relative aspect-[9/16] sm:aspect-video overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          className="w-full h-full rounded-md object-cover" 
          aria-label="カメラビュー"
        />
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
        
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="w-full h-full border-4 border-white/60 border-dashed rounded-lg shadow-inner" aria-hidden="true"></div>
        </div>
        
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm">
          <p>枠の中に書類を収めてください</p>
        </div>

        <div className="absolute bottom-6 left-4 right-4 flex justify-center items-center gap-8">
          <button 
            onClick={stopCamera}
            disabled={disabled}
            className="px-6 py-3 bg-gray-900/50 text-white font-bold rounded-full hover:bg-gray-800/70 transition-colors backdrop-blur-sm disabled:opacity-50"
            aria-label="カメラを閉じる"
          >
            キャンセル
          </button>
          <button 
            onClick={handleTakePicture}
            disabled={disabled}
            className="w-20 h-20 bg-white rounded-full border-4 border-orange-500 flex items-center justify-center group disabled:opacity-50" 
            aria-label="写真を撮影"
          >
            <div className="w-16 h-16 bg-orange-500 rounded-full group-hover:bg-orange-600 transition-colors"></div>
          </button>
        </div>
        
        {error && (
          <div className="absolute top-16 left-4 right-4 text-white bg-red-500/80 p-2 rounded-md text-sm text-center" role="alert">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`w-full bg-white rounded-xl shadow-lg p-6 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="ファイルをアップロード"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">おたよりをアップロード</h2>
        <p className="text-sm text-gray-500 mt-1">
          撮影、ファイル選択、またはドラッグ＆ドロップ
        </p>
        <p className="text-xs text-gray-400 mt-1">
          対応形式: {supportedFormatsText} | 最大サイズ: {maxFileSize}MB
        </p>
      </div>
      
      {error && (
        <div className="text-red-600 bg-red-100 border border-red-300 p-3 rounded-md mb-4 text-sm" role="alert">
          {error}
        </div>
      )}

      {isProcessing && (
        <div className="mb-4 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          <p className="text-sm text-gray-500 mt-2">処理中...</p>
        </div>
      )}

      {imagePreview ? (
        <div className="mb-4" role="img" aria-label="アップロードされた画像のプレビュー">
          <img src={imagePreview} alt="プレビュー" className="max-h-64 w-full object-contain rounded-lg" />
        </div>
      ) : (
        <div 
          className={`w-full h-48 border-2 border-dashed rounded-xl flex items-center justify-center mb-4 transition-colors duration-200
            ${isDragging ? 'border-orange-500 bg-orange-100 ring-2 ring-orange-200' : 'border-orange-300 bg-orange-50'}`
          }
          role="region"
          aria-label="ファイルドロップエリア"
        >
          <div className="text-center text-gray-500 pointer-events-none">
            <UploadIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" aria-hidden="true" />
            <p className="font-semibold">ここにファイルをドラッグ&ドロップ</p>
            <p className="text-sm">または下のボタンから選択</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={() => handleButtonClick('camera')}
          disabled={disabled || isProcessing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="カメラで撮影"
        >
          <CameraIcon className="w-6 h-6" aria-hidden="true" />
          カメラで撮影
        </button>
        <button 
          onClick={() => handleButtonClick('file')}
          disabled={disabled || isProcessing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-100 text-orange-700 font-bold rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="ファイルを選択"
        >
          <FileIcon className="w-6 h-6" aria-hidden="true" />
          ファイルを選択
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={supportedFormats.join(',')}
        disabled={disabled}
        aria-label="ファイル選択"
      />
    </div>
  );
};

export default Uploader;