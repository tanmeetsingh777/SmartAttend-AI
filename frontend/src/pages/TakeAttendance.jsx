import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { classService } from '../services/classService';
import { attendanceService } from '../services/attendanceService';
import WebcamCapture from '../components/WebcamCapture';
import LoadingSpinner from '../components/LoadingSpinner';
import ResponsiveSelect from '../components/ResponsiveSelect';
import { Camera, CheckCircle, AlertTriangle, Users, StopCircle, UserCheck, ShieldAlert, Sparkles, Check, RefreshCw } from 'lucide-react';

const TakeAttendance = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(searchParams.get('classId') || '');
  const [subject, setSubject] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [loading, setLoading] = useState(true);

  // Active Session State
  const [activeSession, setActiveSession] = useState(null);
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);
  const [detectionLogs, setDetectionLogs] = useState([]);
  const [presentCount, setPresentCount] = useState(0);

  // AI Feedback Overlay State
  const [aiFeedback, setAiFeedback] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClassId && classes.length > 0) {
      const cls = classes.find(c => c._id === selectedClassId);
      if (cls) {
        const firstSubject = cls.lectureOrder?.[0] || cls.subjectIds?.[0];
        setSubjectId(firstSubject?._id || '');
        setSubject(firstSubject?.name || cls.subject);
      }
    }
  }, [selectedClassId, classes]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await classService.getClasses();
      if (res.success && res.data.length > 0) {
        setClasses(res.data);
        if (!selectedClassId) {
          setSelectedClassId(res.data[0]._id);
          const firstSubject = res.data[0].lectureOrder?.[0] || res.data[0].subjectIds?.[0];
          setSubjectId(firstSubject?._id || '');
          setSubject(firstSubject?.name || res.data[0].subject);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!selectedClassId || !subject) return;

    try {
      setLoading(true);
      const res = await attendanceService.startSession(selectedClassId, subject, subjectId);
      if (res.success) {
        setActiveSession(res.data);
        setPresentCount(0);
        setDetectionLogs([]);
        setAiFeedback(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start attendance session');
    } finally {
      setLoading(false);
    }
  };

  // Called periodically by WebcamCapture frame emitter (e.g. every 800ms)
  const handleFrameCapture = useCallback(async (dataUrl) => {
    if (!activeSession || isProcessingFrame) return;

    setIsProcessingFrame(true);

    try {
      const res = await attendanceService.recognizeFrame(activeSession._id, dataUrl);

      if (!res.success) {
        setAiFeedback({
          status: 'error',
          message: res.message || 'Frame processing error',
          confidence: 0
        });
        return;
      }

      // 1. Student Recognized & Marked Present
      if (res.status === 'marked_present') {
        const student = res.matchedStudent;
        setPresentCount(prev => prev + 1);
        setAiFeedback({
          status: 'marked_present',
          title: `Recognized: ${student.fullName}`,
          subtitle: `Roll Number: ${student.rollNumber}`,
          confidence: Math.round(res.confidence * 100),
          time: new Date().toLocaleTimeString()
        });

        setDetectionLogs(prev => [
          {
            id: Date.now(),
            name: student.fullName,
            roll: student.rollNumber,
            confidence: Math.round(res.confidence * 100),
            status: 'Present',
            time: new Date().toLocaleTimeString()
          },
          ...prev.slice(0, 14)
        ]);
      }
      // 2. Already Marked Present
      else if (res.status === 'already_marked') {
        const student = res.matchedStudent;
        setAiFeedback({
          status: 'already_marked',
          title: `${student?.fullName || 'Student'} Already Marked`,
          subtitle: `Roll: ${student?.rollNumber} • Duplicate Skipped`,
          confidence: Math.round((res.confidence || 1) * 100)
        });
      }
      // 3. Unknown Face
      else if (res.status === 'unknown') {
        setAiFeedback({
          status: 'unknown',
          title: 'Unknown Person Detected',
          subtitle: 'Face not registered in this class roster. Access restricted.',
          confidence: Math.round((res.confidence || 0) * 100)
        });
      }
      // 4. Multiple Faces
      else if (res.status === 'multiple_faces') {
        setAiFeedback({
          status: 'multiple_faces',
          title: 'Multiple Faces Visible',
          subtitle: res.message || 'Only one person should stand in front of camera.',
          confidence: 0
        });
      }
      // 5. No Face or Quality Issue
      else if (res.status === 'quality_error' || res.status === 'no_face') {
        setAiFeedback({
          status: 'info',
          title: res.message || 'Position face clearly in camera circle',
          confidence: 0
        });
      }

    } catch (err) {
      console.error('[Recognition Loop Error]:', err);
    } finally {
      setIsProcessingFrame(false);
    }
  }, [activeSession, isProcessingFrame]);

  const handleStopSession = async () => {
    if (!activeSession) return;
    if (!window.confirm('Do you want to finalize and stop this attendance session? Unmarked students will be auto-marked absent.')) return;

    try {
      setLoading(true);
      await attendanceService.finalizeSession(activeSession._id, true);
      navigate(`/attendance-review?sessionId=${activeSession._id}`);
    } catch (err) {
      alert('Failed to finalize session');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !activeSession) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner text="Initializing facial recognition pipeline..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">

      {/* Session Header */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-start gap-2.5">
            <Camera className="w-6 h-6 text-blue-500" />
            Live AI Facial Recognition Attendance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time biometric attendance matching using 128-dimensional OpenCV SFace embeddings
          </p>
        </div>

        {activeSession ? (
          <button
            onClick={handleStopSession}
            className="w-full md:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition"
          >
            <StopCircle className="w-4 h-4" /> Finalize Attendance Session
          </button>
        ) : (
          <span className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold rounded-xl">
            Session Offline
          </span>
        )}
      </div>

      {!activeSession ? (
        /* Setup / Start Form */
        <div className="max-w-xl mx-auto glass-panel p-4 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <h3 className="text-lg font-bold text-white mb-2">Configure Attendance Session</h3>
          <p className="text-xs text-slate-400 mb-6">Select the academic class section and subject to start live camera scanning.</p>

          <form onSubmit={handleStartSession} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Select Class Section</label>
              <ResponsiveSelect value={selectedClassId} onChange={setSelectedClassId} options={classes.map(c => ({ value: c._id, label: `${c.name} (${c.section}) - ${c.subject}` }))} />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Lecture / Subject</label>
              <ResponsiveSelect
                value={subjectId || subject}
                onChange={(value) => {
                  const selectedClass = classes.find(c => c._id === selectedClassId);
                  const selected = (selectedClass?.lectureOrder || selectedClass?.subjectIds || []).find(item => item._id === value);
                  setSubjectId(selected?._id || '');
                  setSubject(selected?.name || value);
                }}
                options={(classes.find(c => c._id === selectedClassId)?.lectureOrder || classes.find(c => c._id === selectedClassId)?.subjectIds || []).map(item => ({ value: item._id, label: `${item.code} - ${item.name}` }))}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition"
            >
              <Camera className="w-4 h-4" /> Start Live Camera Feed
            </button>
          </form>
        </div>
      ) : (
        /* Active Live Session View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Webcam Feed & AI Overlay (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel p-4 rounded-3xl border border-slate-800 relative">
              <WebcamCapture
                autoCaptureInterval={800} // Send camera frame every 800ms
                onCapture={handleFrameCapture}
                isProcessing={isProcessingFrame}
              />

              {/* Dynamic AI Recognition Card Feedback */}
              {aiFeedback && aiFeedback.status !== 'info' && (
                <div className={`mt-4 p-4 rounded-2xl border transition-all duration-300 ${aiFeedback.status === 'marked_present'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : aiFeedback.status === 'already_marked'
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {aiFeedback.status === 'marked_present' ? (
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                          <Check className="w-6 h-6" />
                        </div>
                      ) : aiFeedback.status === 'already_marked' ? (
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                          <UserCheck className="w-6 h-6" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                          <ShieldAlert className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-white">{aiFeedback.title}</h4>
                        <p className="text-xs text-slate-300">{aiFeedback.subtitle}</p>
                      </div>
                    </div>

                    {aiFeedback.confidence > 0 && (
                      <div className="text-right">
                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-white">
                          {aiFeedback.confidence}% Match
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Session Telemetry Sidebar (1 Col) */}
          <div className="space-y-4">

            {/* Live Count Card */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Present Count (Live)</p>
              <h2 className="text-4xl font-extrabold text-emerald-400 mt-1">{presentCount}</h2>
              <p className="text-[11px] text-slate-400 mt-1">Unique students recognized & logged</p>
            </div>

            {/* Live Recognized Stream Feed */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col h-[400px]">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
                <span>Recent Recognition Log</span>
                <span className="text-[10px] text-blue-400 font-mono">LIVE</span>
              </h4>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {detectionLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-12">
                    Waiting for consenting face in front of webcam...
                  </p>
                ) : (
                  detectionLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-2xl glass-card text-xs flex items-center justify-between border-l-4 border-l-emerald-500">
                      <div>
                        <p className="font-bold text-white">{log.name}</p>
                        <p className="text-[10px] text-slate-400">Roll: {log.roll}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-400">{log.confidence}%</span>
                        <p className="text-[10px] text-slate-500">{log.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default TakeAttendance;
