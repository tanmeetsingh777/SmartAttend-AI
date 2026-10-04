import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { attendanceService } from '../services/attendanceService';
import LoadingSpinner from '../components/LoadingSpinner';
import ResponsiveSelect from '../components/ResponsiveSelect';
import { CheckSquare, Search, Edit2, CheckCircle, XCircle, Clock, Save, FileText } from 'lucide-react';

const AttendanceReview = () => {
  const [searchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get('sessionId');

  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(sessionIdFromUrl || '');
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [editStatus, setEditStatus] = useState('present');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionDetails(selectedSessionId);
    }
  }, [selectedSessionId]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getSessions();
      if (res.success && res.data.length > 0) {
        setSessions(res.data);
        if (!selectedSessionId) {
          setSelectedSessionId(res.data[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDetails = async (id) => {
    try {
      const res = await attendanceService.getSessionById(id);
      if (res.success) {
        setSessionData(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (recordId, newStatus) => {
    try {
      await attendanceService.updateRecord(recordId, newStatus, 'Teacher manual override');
      fetchSessionDetails(selectedSessionId);
    } catch (err) {
      alert('Failed to update attendance record');
    }
  };

  const handleSaveEditModal = async (e) => {
    e.preventDefault();
    if (!editingRecord) return;
    try {
      await attendanceService.updateRecord(editingRecord._id, editStatus, editNotes);
      setEditingRecord(null);
      fetchSessionDetails(selectedSessionId);
    } catch (err) {
      alert('Failed to update record');
    }
  };

  const handleFinalize = async () => {
    if (!sessionData?.session) return;
    if (!window.confirm('Finalize session and auto-mark remaining students absent?')) return;
    try {
      await attendanceService.finalizeSession(sessionData.session._id, true);
      fetchSessionDetails(selectedSessionId);
    } catch (err) {
      alert('Failed to finalize session');
    }
  };

  const filteredRecords = sessionData?.records ? sessionData.records.filter(r => {
    if (!search) return true;
    const sName = r.studentId?.fullName?.toLowerCase() || '';
    const sRoll = r.studentId?.rollNumber?.toLowerCase() || '';
    return sName.includes(search.toLowerCase()) || sRoll.includes(search.toLowerCase());
  }) : [];

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Attendance Session Review</h1>
          <p className="text-xs text-slate-400 mt-0.5">Audit, verify & manually adjust session records</p>
        </div>

        {sessions.length > 0 && (
          <ResponsiveSelect value={selectedSessionId} onChange={setSelectedSessionId} className="w-full sm:w-80" options={sessions.map(s => ({ value: s._id, label: `${s.classId?.name} (${s.classId?.section}) - ${s.subject} (${new Date(s.startedAt).toLocaleDateString()})` }))} />
        )}
      </div>

      {loading && !sessionData ? (
        <LoadingSpinner text="Retrieving session records..." />
      ) : !sessionData ? (
        <div className="glass-panel p-12 text-center text-slate-500 rounded-3xl">
          <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold">No attendance session selected</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Summary Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Class Roster</p>
              <h3 className="text-2xl font-extrabold text-white">{sessionData.summary.totalClassStudents}</h3>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
              <p className="text-[10px] font-bold text-emerald-400 uppercase">Present Count</p>
              <h3 className="text-2xl font-extrabold text-emerald-400">{sessionData.summary.presentCount}</h3>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
              <p className="text-[10px] font-bold text-rose-400 uppercase">Absent Count</p>
              <h3 className="text-2xl font-extrabold text-rose-400">{sessionData.summary.absentCount}</h3>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 text-center">
              <p className="text-[10px] font-bold text-amber-400 uppercase">Late Count</p>
              <h3 className="text-2xl font-extrabold text-amber-400">{sessionData.summary.lateCount}</h3>
            </div>
          </div>

          {/* Session Details & Action Bar */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roll or student name..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {sessionData.session.status === 'active' && (
              <button
                onClick={handleFinalize}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Finalize & Auto-Mark Absentees
              </button>
            )}
          </div>

          {/* Records Table */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Attendance Status</th>
                    <th className="py-3 px-4">Detection Source</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4 text-right">Manual Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRecords.map((rec) => (
                    <tr key={rec._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">{rec.studentId?.rollNumber}</td>
                      <td className="py-3 px-4 font-bold text-white">{rec.studentId?.fullName}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${rec.status === 'present'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : rec.status === 'absent'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 capitalize">{rec.source}</td>
                      <td className="py-3 px-4 text-slate-300 font-mono">
                        {rec.source === 'face' ? `${(rec.confidence * 100).toFixed(0)}%` : 'Manual'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(rec.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStatusChange(rec._id, 'present')}
                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold"
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleStatusChange(rec._id, 'absent')}
                            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-bold"
                          >
                            Absent
                          </button>
                          <button
                            onClick={() => handleStatusChange(rec._id, 'late')}
                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-[10px] font-bold"
                          >
                            Late
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default AttendanceReview;
