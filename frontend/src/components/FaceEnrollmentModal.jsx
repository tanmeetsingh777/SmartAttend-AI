import React, { useState, useEffect, useCallback, useRef } from 'react';
import WebcamCapture from './WebcamCapture';
import { studentService } from '../services/studentService';
import { X, CheckCircle, AlertCircle, ShieldAlert, Trash2, Camera, RefreshCw, AlertTriangle, Zap } from 'lucide-react';

// Compute Laplacian variance (blur score) from a base64 image using canvas
// Mirrors the AI service quality.py blur check (threshold 30.0)
const computeBlurScore = (dataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Convert to grayscale and apply Laplacian kernel [0,1,0,1,-4,1,0,1,0]
      let variance = 0;
      let count = 0;
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4;
          const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          const top = (data[((y - 1) * width + x) * 4] + data[((y - 1) * width + x) * 4 + 1] + data[((y - 1) * width + x) * 4 + 2]) / 3;
          const bottom = (data[((y + 1) * width + x) * 4] + data[((y + 1) * width + x) * 4 + 1] + data[((y + 1) * width + x) * 4 + 2]) / 3;
          const left = (data[(y * width + x - 1) * 4] + data[(y * width + x - 1) * 4 + 1] + data[(y * width + x - 1) * 4 + 2]) / 3;
          const right = (data[(y * width + x + 1) * 4] + data[(y * width + x + 1) * 4 + 1] + data[(y * width + x + 1) * 4 + 2]) / 3;
          const lap = top + bottom + left + right - 4 * gray;
          variance += lap * lap;
          count++;
        }
      }
      resolve(count > 0 ? variance / count : 0);
    };
    img.onerror = () => resolve(999); // can't check, assume ok
    img.src = dataUrl;
  });
};

const FaceEnrollmentModal = ({ student, onClose, onEnrollmentSuccess }) => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [blurScore, setBlurScore] = useState(null); // null = not computed yet
  const autoCloseTimerRef = useRef(null);

  const BLUR_THRESHOLD = 30.0; // must match ai-service/.env BLUR_THRESHOLD

  const handleClose = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
      if (window.__smartattend_active_stream) {
        try {
          window.__smartattend_active_stream.getTracks().forEach((track) => track.stop());
        } catch (e) {
          console.warn('[Modal Close Camera Stop Error]:', e);
        }
        window.__smartattend_active_stream = null;
      }
    };
  }, []);

  const handleCapture = useCallback(async (dataUrl) => {
    setCapturedImage(dataUrl);
    setError(null);
    setBlurScore(null);
    // Run blur check in background immediately after capture
    const score = await computeBlurScore(dataUrl);
    setBlurScore(score);
  }, []);

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
    setSuccessMsg(null);
    setBlurScore(null);
    setIsSuccess(false);
  };

  const isBlurry = blurScore !== null && blurScore < BLUR_THRESHOLD;
  const blurLabel = blurScore === null
    ? null
    : isBlurry
      ? `Too blurry (score: ${blurScore.toFixed(1)}) — retake in better light`
      : `Sharp image ✓ (score: ${blurScore.toFixed(1)})`;

  const handleEnrollSubmit = async () => {
    if (!capturedImage) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await studentService.enrollFace(student._id, capturedImage);
      if (res.success) {
        setIsSuccess(true);
        setSuccessMsg('Face enrollment completed! Pretrained 128-dim embedding stored.');
        if (onEnrollmentSuccess) {
          onEnrollmentSuccess(res.data);
        }
        // Auto-close modal after 1.8 seconds so user gets clear feedback and returns to the updated student list
        autoCloseTimerRef.current = setTimeout(() => {
          handleClose();
        }, 1800);
      } else {
        setError(res.message || 'Enrollment failed validation.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to communicate with AI Service');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEnrollment = async () => {
    if (!window.confirm(`Are you sure you want to remove the stored face enrollment data for ${student.fullName}?`)) return;
    setLoading(true);
    try {
      await studentService.deleteEnrollment(student._id);
      setIsSuccess(true);
      setSuccessMsg('Face enrollment record deleted. Student account remains active.');
      if (onEnrollmentSuccess) {
        onEnrollmentSuccess(null);
      }
      autoCloseTimerRef.current = setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete enrollment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl glass-panel rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-400" />
              Facial Biometric Enrollment
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Student: <span className="text-white font-medium">{student?.fullName}</span> (Roll: {student?.rollNumber})
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-3">
          
          {isSuccess ? (
            <div className="py-8 px-4 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                  <CheckCircle className="w-10 h-10 animate-pulse text-emerald-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-lg font-bold text-white tracking-wide">
                  Face Enrolled Successfully!
                </h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  {successMsg || `128-dimensional biometric embedding saved for ${student?.fullName}.`}
                </p>
              </div>

              <div className="p-3 max-w-sm mx-auto rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-around">
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> 128-dim Vector Stored
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">Raw Photo Discarded</span>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/25 transition flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Privacy Notice (Requirement 33) */}
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-blue-200">Biometric Consent Notice:</span>
                  <p className="text-[11px] text-blue-300/90 mt-0.5">
                    Face enrollment extracts non-reversible 128-dimensional facial embedding vectors solely for automated class attendance verification. Only enroll with explicit student consent. Raw images are not stored.
                  </p>
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Camera / Snapshot Preview */}
              {!capturedImage ? (
                <div className="space-y-2">
                  <WebcamCapture onCapture={handleCapture} isProcessing={loading} stopOnCapture={true} />
                  <p className="text-[11px] text-slate-400 text-center">
                    Ensure face is clearly visible under adequate lighting with no head coverings.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-center">
                  <div className={`relative inline-block rounded-2xl overflow-hidden shadow-xl max-h-[200px] border-2 transition-all ${
                    blurScore === null
                      ? 'border-blue-500/40'
                      : isBlurry
                        ? 'border-amber-500/60'
                        : 'border-emerald-500/60'
                  }`}>
                    <img src={capturedImage} alt="Captured Face" className="max-h-[200px] object-cover scale-x-[-1]" />

                    {/* Quality Badge — top-right corner */}
                    <div className={`absolute top-2 right-2 px-2.5 py-1 backdrop-blur text-[10px] font-bold rounded-lg border flex items-center gap-1.5 ${
                      blurScore === null
                        ? 'bg-slate-900/80 text-blue-400 border-blue-500/30'
                        : isBlurry
                          ? 'bg-amber-900/90 text-amber-300 border-amber-500/50'
                          : 'bg-emerald-900/90 text-emerald-300 border-emerald-500/50'
                    }`}>
                      {blurScore === null ? (
                        <><RefreshCw className="w-3 h-3 animate-spin" /> Checking quality...</>
                      ) : isBlurry ? (
                        <><AlertTriangle className="w-3 h-3" /> Too Blurry</>
                      ) : (
                        <><Zap className="w-3 h-3" /> Sharp Image</>
                      )}
                    </div>
                  </div>

                  {/* Blur warning strip */}
                  {isBlurry && (
                    <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span><strong>Image too blurry</strong> (score: {blurScore.toFixed(1)} / 30 min). Clean your camera and retake in better light.</span>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-3 pt-1">
                    <button
                      onClick={handleRetake}
                      disabled={loading}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retake Photo
                    </button>
                    <button
                      onClick={handleEnrollSubmit}
                      disabled={loading || isBlurry}
                      title={isBlurry ? 'Image is too blurry — please retake' : ''}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition"
                    >
                      {loading ? 'Validating & Extracting Embedding...' : 'Confirm & Generate Embedding'}
                    </button>
                  </div>
                </div>
              )}

              {/* Delete Enrollment Button (Requirement 15 & 33) */}
              {student?.faceEnrollment?.status === 'enrolled' && (
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-300">Enrolled Status: Active</p>
                    <p className="text-[10px] text-slate-500">Model: {student.faceEnrollment.modelName || 'OpenCV_YuNet_SFace'}</p>
                  </div>
                  <button
                    onClick={handleDeleteEnrollment}
                    disabled={loading}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Face Data
                  </button>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex justify-end">
          <button
            onClick={handleClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default FaceEnrollmentModal;
