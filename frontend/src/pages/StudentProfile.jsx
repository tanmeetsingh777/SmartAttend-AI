import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService } from '../services/studentService';
import FaceEnrollmentModal from '../components/FaceEnrollmentModal';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import { User, ArrowLeft, Camera, CheckCircle2, XCircle, Clock, BookOpen, Trash2 } from 'lucide-react';

const StudentProfile = () => {
  const { id } = useParams();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);

  useEffect(() => {
    fetchStudentProfile();
  }, [id]);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      const res = await studentService.getStudentById(id);
      if (res.success) {
        setStudentData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !studentData) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner text="Retrieving student profile & attendance history..." />
      </div>
    );
  }

  const isEnrolled = studentData.faceEnrollment?.status === 'enrolled';

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Bar */}
      <div className="flex items-center gap-3">
        <Link to="/students" className="p-2 glass-panel rounded-xl text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{studentData.fullName}</h1>
          <p className="text-xs text-slate-400">Roll Number: <span className="text-blue-400 font-mono font-bold">{studentData.rollNumber}</span></p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card & Face Status (1 Col) */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold mx-auto shadow-xl shadow-blue-500/20 mb-3">
              {studentData.fullName.charAt(0)}
            </div>
            <h3 className="text-lg font-bold text-white">{studentData.fullName}</h3>
            <p className="text-xs text-slate-400">{studentData.email}</p>
          </div>

          <div className="p-4 rounded-2xl glass-card border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Class Section</span>
              <span className="font-bold text-white">{studentData.classId ? `${studentData.classId.name} (${studentData.classId.section})` : 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Course Subject</span>
              <span className="font-semibold text-blue-400">{studentData.classId?.subject}</span>
            </div>
          </div>

          {/* Biometric Enrollment Status Box */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Face Biometrics</span>
              {isEnrolled ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Enrolled
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Not Enrolled
                </span>
              )}
            </div>

            {isEnrolled && (
              <div className="text-[11px] text-slate-400 space-y-1">
                <p>Model: <span className="text-slate-200 font-mono">{studentData.faceEnrollment.modelName}</span></p>
                <p>Enrolled: {studentData.faceEnrollment.enrolledAt ? new Date(studentData.faceEnrollment.enrolledAt).toLocaleDateString() : 'Active'}</p>
              </div>
            )}

            <button
              onClick={() => setEnrollModalOpen(true)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition"
            >
              <Camera className="w-4 h-4" /> {isEnrolled ? 'Re-enroll Face Data' : 'Enroll Face Biometrics'}
            </button>
          </div>
        </div>

        {/* Stats & History (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Classes"
              value={studentData.stats?.totalClasses || 0}
              subtext="Logged sessions"
              icon={BookOpen}
              color="purple"
            />
            <StatCard
              title="Classes Attended"
              value={studentData.stats?.presentClasses || 0}
              subtext="Marked present"
              icon={CheckCircle2}
              color="green"
            />
            <StatCard
              title="Attendance Rate"
              value={`${studentData.stats?.attendancePercentage || 0}%`}
              subtext="Aggregate percentage"
              icon={Clock}
              color={studentData.stats?.attendancePercentage >= 75 ? 'green' : 'amber'}
            />
          </div>

          {/* History Table */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4">Recent Attendance History</h3>
            
            {studentData.recentAttendance && studentData.recentAttendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Subject / Session</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4 text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {studentData.recentAttendance.map((rec) => (
                      <tr key={rec._id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-bold text-white">{rec.sessionId?.subject || 'Lecture'}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(rec.markedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            rec.status === 'present' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 capitalize">{rec.source}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-300">
                          {rec.source === 'face' ? `${(rec.confidence * 100).toFixed(0)}%` : 'Manual'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">No attendance records found for this student.</p>
            )}
          </div>

        </div>

      </div>

      {/* Face Enrollment Modal */}
      {enrollModalOpen && (
        <FaceEnrollmentModal
          student={studentData}
          onClose={() => setEnrollModalOpen(false)}
          onEnrollmentSuccess={() => fetchStudentProfile()}
        />
      )}

    </div>
  );
};

export default StudentProfile;
