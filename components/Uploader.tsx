import React, { useRef, useState, useEffect } from 'react';
import { CameraIcon, FileIcon, UploadIcon } from './Icon';

interface UploaderProps {
  onFileSelect: (file: File, dataUrl: string) => void;
}

const Uploader: React.FC<UploaderProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Unified file processing logic
  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setImagePreview(dataUrl);
          onFileSelect(file, dataUrl);
        };
        reader.readAsDataURL(file);
    } else {
        alert("画像ファイルを選択してください。");
        setIsDragging(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const startCamera = async () => {
    // Stop any existing stream and reset state
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    setStream(null); 
    setCameraError(null);
    setIsCameraOpen(true); // Render the camera view

    try {
        const newStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        setStream(newStream); // This will trigger the useEffect to attach the stream
    } catch (err: any) { // errをany型として扱う
        console.error("Camera access error:", err);
        // エラーのnameとmessageを表示
        setCameraError(`カメラを起動できませんでした。エラー: ${err.name || '不明なエラー'} - ${err.message || '詳細不明'}`);
        setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
      // The useEffect hook now handles stopping the stream tracks when setStream(null) is called.
      setStream(null);
      setIsCameraOpen(false);
  };

  const handleTakePicture = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg');
            canvas.toBlob(blob => {
                if (blob) {
                    const imageFile = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                    processFile(imageFile);
                }
            }, 'image/jpeg');
        }
        stopCamera();
    }
  };
  
  const handleButtonClick = (type: 'file' | 'camera') => {
    if (type === 'camera') {
        startCamera();
    } else {
        fileInputRef.current?.click();
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
        setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Effect to handle stream lifecycle
  useEffect(() => {
    // Attach stream to video element when it becomes available
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    
    // Cleanup function to stop stream when component unmounts or stream is reset
    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [stream]);

  if (isCameraOpen) {
    return (
        <div className="w-full bg-black rounded-xl shadow-lg p-4 relative aspect-[9/16] sm:aspect-video overflow-hidden">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full rounded-md object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                <div className="w-full h-full border-4 border-white/60 border-dashed rounded-lg shadow-inner"></div>
            </div>
             <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm">
                <p>枠の中に書類を収めてください</p>
            </div>

            <div className="absolute bottom-6 left-4 right-4 flex justify-center items-center gap-8">
                 <button onClick={stopCamera} className="px-6 py-3 bg-gray-900/50 text-white font-bold rounded-full hover:bg-gray-800/70 transition-colors backdrop-blur-sm">
                    キャンセル
                </button>
                <button onClick={handleTakePicture} className="w-20 h-20 bg-white rounded-full border-4 border-orange-500 flex items-center justify-center group" aria-label="Take Picture">
                    <div className="w-16 h-16 bg-orange-500 rounded-full group-hover:bg-orange-600 transition-colors"></div>
                </button>
            </div>
            {cameraError && <p className="absolute top-16 left-4 right-4 text-white bg-red-500/80 p-2 rounded-md text-sm text-center">{cameraError}</p>}
        </div>
    )
  }

  return (
    <div
      className="w-full bg-white rounded-xl shadow-lg p-6"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">おたよりをアップロード</h2>
        <p className="text-sm text-gray-500 mt-1">撮影、ファイル選択、またはドラッグ＆ドロップ</p>
      </div>
      
      {cameraError && <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4 text-sm">{cameraError}</p>}

      {imagePreview ? (
        <div className="mb-4">
          <img src={imagePreview} alt="Preview" className="max-h-64 w-full object-contain rounded-lg" />
        </div>
      ) : (
        <div 
          className={`w-full h-48 border-2 border-dashed rounded-xl flex items-center justify-center mb-4 transition-colors duration-200
            ${isDragging ? 'border-orange-500 bg-orange-100 ring-2 ring-orange-200' : 'border-orange-300 bg-orange-50'}`
          }
        >
          <div className="text-center text-gray-500 pointer-events-none">
            <UploadIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="font-semibold">ここにファイルをドラッグ＆ドロップ</p>
            <p className="text-sm">または下のボタンから選択</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button onClick={() => handleButtonClick('camera')} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors">
          <CameraIcon className="w-6 h-6" />
          カメラで撮影
        </button>
        <button onClick={() => handleButtonClick('file')} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-100 text-orange-700 font-bold rounded-lg hover:bg-orange-200 transition-colors">
          <FileIcon className="w-6 h-6" />
          ファイルを選択
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
    </div>
  );
};

export default Uploader;
