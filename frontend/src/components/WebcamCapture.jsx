import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

const WebcamCapture = ({ onCapture, isProcessing = false, autoCaptureInterval = 0 }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [streamActive, setStreamActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not supported in this browser environment');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreamActive(true);
      setPermissionGranted(true);
    } catch (err) {
      console.error('[Webcam Error]:', err);
      setStreamActive(false);
      setPermissionGranted(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Camera permission denied. Please allow browser camera access.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('No camera detected on this device.');
      } else {
        setErrorMsg(err.message || 'Unable to start camera video stream.');
      }
    }
  }, []);

  // Stop camera tracks (Requirement 32)
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Capture Base64 JPEG frame from canvas
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !streamActive) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    if (onCapture) {
      onCapture(dataUrl);
    }
    return dataUrl;
  }, [streamActive, onCapture]);

  // Handle continuous auto-capture interval if enabled (Requirement 17)
  useEffect(() => {
    if (!autoCaptureInterval || autoCaptureInterval <= 0 || !streamActive || isProcessing) return;

    const intervalId = setInterval(() => {
      captureFrame();
    }, autoCaptureInterval);

    return () => clearInterval(intervalId);
  }, [autoCaptureInterval, streamActive, isProcessing, captureFrame]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden glass-panel border border-slate-800 shadow-2xl bg-black">
      {/* Video element */}
      <video
        ref={videoRef}
        playsInline
        muted
        className={`w-full h-[340px] md:h-[400px] object-cover scale-x-[-1] transition-opacity duration-300 ${
          streamActive ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Face Position Overlay Ring */}
      {streamActive && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-56 h-72 rounded-[40%] border-2 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.2)] animate-pulse flex items-center justify-center">
            <span className="text-[11px] font-semibold tracking-wider uppercase bg-slate-900/80 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30">
              Center Face Here
            </span>
          </div>
        </div>
      )}

      {/* Error or Loading Overlay */}
      {!streamActive && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          {errorMsg ? (
            <div className="max-w-xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Camera Unavailable</h4>
              <p className="text-xs text-slate-400">{errorMsg}</p>
              <button
                onClick={startCamera}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Requesting webcam feed...</p>
            </div>
          )}
        </div>
      )}

      {/* Control overlay */}
      {streamActive && !autoCaptureInterval && (
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3">
          <button
            onClick={captureFrame}
            disabled={isProcessing}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            {isProcessing ? 'Processing Frame...' : 'Capture Snapshot'}
          </button>
        </div>
      )}
    </div>
  );
};

export default WebcamCapture;
