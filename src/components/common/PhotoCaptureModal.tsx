import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface PhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Data: string) => void;
  title?: string;
  subtitle?: string;
}

export const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Capture / Upload Photo',
  subtitle = 'Take a clear photograph using device camera or select image from gallery',
}) => {
  const [mode, setMode] = useState<'options' | 'camera' | 'preview'>('options');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera when closing
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setMode('options');
      setCameraError(null);
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setMode('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions or upload an image file instead.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      stopCamera();
      setCapturedImage(dataUrl);
      setMode('preview');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      // compress image on canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(compressed);
        setMode('preview');
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6">
          {mode === 'options' && (
            <div className="space-y-4">
              <button
                onClick={startCamera}
                className="w-full flex items-center justify-center space-x-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-4 px-4 rounded-xl shadow transition"
              >
                <Camera className="w-5 h-5" />
                <span>Open Phone / Device Camera</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center space-x-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-4 px-4 rounded-xl transition border border-slate-300"
              >
                <Upload className="w-5 h-5 text-slate-600" />
                <span>Upload From Gallery / Files</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {mode === 'camera' && (
            <div className="space-y-4">
              {cameraError ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                  <div className="flex items-center space-x-2 font-semibold mb-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Camera Permission Needed</span>
                  </div>
                  <p className="text-xs">{cameraError}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                  >
                    Select File Instead
                  </button>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-white/40 pointer-events-none rounded-xl m-4" />
                </div>
              )}

              <div className="flex items-center justify-between space-x-3 pt-2">
                <button
                  onClick={() => {
                    stopCamera();
                    setMode('options');
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                {!cameraError && (
                  <button
                    onClick={captureFrame}
                    className="flex-1 bg-sky-600 hover:bg-sky-700 text-white py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 shadow"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Snap Photo</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {mode === 'preview' && capturedImage && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-4/3 flex items-center justify-center border border-slate-200 shadow-inner">
                <img src={capturedImage} alt="Captured preview" className="w-full h-full object-contain" />
              </div>

              <div className="flex items-center justify-between space-x-3">
                <button
                  onClick={() => {
                    setCapturedImage(null);
                    setMode('options');
                  }}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 shadow"
                >
                  <Check className="w-4 h-4" />
                  <span>Use This Photo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
