import React, { useState } from 'react';
import WebcamCapture from './WebcamCapture';
import { studentService } from '../services/studentService';
import { X, CheckCircle, AlertCircle, ShieldAlert, Trash2, Camera, RefreshCw } from 'lucide-react';

const FaceEnrollmentModal = ({ student, onClose, onEnrollmentSuccess }) => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleCapture = (dataUrl) => {
    setCapturedImage(dataUrl);
    setError(null);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
    setSuccessMsg(null);
  };

  const handleEnrollSubmit = async () => {
    if (!capturedImage) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await studentService.enrollFace(student._id, capturedImage);
      if (res.success) {
        setSuccessMsg('Face enrollment completed! Pretrained 128-dim embedding stored.');
        if (onEnrollmentSuccess) {
          onEnrollmentSuccess(res.data);
        }
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
      setSuccessMsg('Face enrollment record deleted. Student account remains active.');
      if (onEnrollmentSuccess) {
        onEnrollmentSuccess(null);
      }
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
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          
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

          {/* Success Banner */}
          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

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
              <WebcamCapture onCapture={handleCapture} isProcessing={loading} />
              <p className="text-[11px] text-slate-400 text-center">
                Ensure face is clearly visible under adequate lighting with no head coverings.
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-center">
              <div className="relative inline-block rounded-2xl overflow-hidden border-2 border-blue-500/40 shadow-xl max-h-[300px]">
                <img src={capturedImage} alt="Captured Face" className="max-h-[300px] object-cover scale-x-[-1]" />
                <div className="absolute top-2 right-2 px-2.5 py-1 bg-slate-900/80 backdrop-blur text-[10px] font-bold text-blue-400 rounded-lg border border-blue-500/30">
                  Captured Frame Ready
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleRetake}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retake Photo
                </button>
                <button
                  onClick={handleEnrollSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
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

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex justify-end">
          <button
            onClick={onClose}
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
