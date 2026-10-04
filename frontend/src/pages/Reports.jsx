import React, { useEffect, useState } from 'react';
import { reportService } from '../services/reportService';
import { classService } from '../services/classService';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import ResponsiveSelect from '../components/ResponsiveSelect';
import { FileText, Download, Filter, Calendar, Users, CheckCircle, XCircle, Clock } from 'lucide-react';

const Reports = () => {
  const [reportsData, setReportsData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchClasses();
    fetchReports();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await classService.getClasses();
      if (res.success) setClasses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedClass) params.classId = selectedClass;
      if (selectedStatus) params.status = selectedStatus;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await reportService.getReports(params);
      if (res.success) {
        setReportsData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = {};
      if (selectedClass) params.classId = selectedClass;
      if (selectedStatus) params.status = selectedStatus;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      await reportService.exportCSV(params);
    } catch (err) {
      alert('Failed to generate CSV export');
    }
  };

  return (
    <div className="space-y-6 pb-12">

      {/* Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-500" />
            Attendance Analytics & Export
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Generate customized university reports & export verified data</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Filter className="w-4 h-4 text-blue-400" /> Report Criteria Filters
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Academic Class</label>
            <ResponsiveSelect value={selectedClass} onChange={setSelectedClass} options={[{ value: '', label: 'All Classes' }, ...classes.map(c => ({ value: c._id, label: `${c.name} (${c.section}) - ${c.subject}` }))]} />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Status</label>
            <ResponsiveSelect value={selectedStatus} onChange={setSelectedStatus} options={[{ value: '', label: 'All Statuses' }, { value: 'present', label: 'Present Only' }, { value: 'absent', label: 'Absent Only' }, { value: 'late', label: 'Late Only' }]} />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={() => { setSelectedClass(''); setSelectedStatus(''); setStartDate(''); setEndDate(''); fetchReports(); }}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
          >
            Reset Filters
          </button>
          <button
            onClick={fetchReports}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 shadow-md shadow-blue-500/20"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Report Summary Cards */}
      {reportsData?.stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Filtered Records"
            value={reportsData.stats.totalRecords}
            subtext="Logs matching active criteria"
            icon={FileText}
            color="purple"
          />
          <StatCard
            title="Present Logs"
            value={reportsData.stats.presentCount}
            subtext="Recognized / Marked present"
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Absent Logs"
            value={reportsData.stats.absentCount}
            subtext="Marked absent"
            icon={XCircle}
            color="red"
          />
          <StatCard
            title="Filtered Attendance %"
            value={`${reportsData.stats.attendancePercentage}%`}
            subtext="Calculated: (Present / Total) × 100"
            icon={Clock}
            color={reportsData.stats.attendancePercentage >= 75 ? 'green' : 'amber'}
          />
        </div>
      )}

      {/* Reports Data Table */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        {loading ? (
          <LoadingSpinner text="Generating attendance reports..." />
        ) : !reportsData || reportsData.records.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-12">No attendance records match the selected filter criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reportsData.records.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{r.studentId?.rollNumber}</td>
                    <td className="py-3 px-4 font-bold text-white">{r.studentId?.fullName}</td>
                    <td className="py-3 px-4 text-slate-300">{r.classId ? `${r.classId.name} (${r.classId.section})` : 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-400">{r.classId?.subject}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(r.markedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${r.status === 'present'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : r.status === 'absent'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 capitalize">{r.source}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-300">
                      {r.source === 'face' ? `${(r.confidence * 100).toFixed(0)}%` : 'Manual'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Reports;
