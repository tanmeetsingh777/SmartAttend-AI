import React, { useEffect, useMemo, useState } from 'react';
import { reportService } from '../services/reportService';
import { classService } from '../services/classService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowUpRight, BookOpen, CalendarDays, CheckCircle2, ClipboardList, RefreshCw, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import HodDashboard from './HodDashboard';

const dateKey = (value) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (value) => new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
const formatTime = (value) => new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [classes, setClasses] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashboardRes, classesRes, reportsRes] = await Promise.all([
        reportService.getDashboardStats(),
        classService.getClasses(),
        reportService.getReports()
      ]);

      if (dashboardRes.success) setDashboard(dashboardRes.data);
      if (classesRes.success) setClasses(classesRes.data || []);
      if (reportsRes.success) setRecords(reportsRes.data?.records || []);
    } catch (err) {
      console.error(err);
      setError('Unable to load attendance data.');
    } finally {
      setLoading(false);
    }
  };

  const today = dateKey(new Date());
  const todayRecords = useMemo(() => records.filter((record) => dateKey(record.markedAt) === today), [records, today]);

  const classRows = useMemo(() => classes.map((classItem) => {
    const classRecords = todayRecords.filter((record) => String(record.classId?._id || record.classId) === String(classItem._id));
    const present = classRecords.filter((record) => record.status === 'present').length;
    const absent = classRecords.filter((record) => record.status === 'absent').length;
    const late = classRecords.filter((record) => record.status === 'late').length;
    const total = present + absent + late;
    return {
      ...classItem,
      present,
      absent,
      late,
      total,
      rate: total ? ((present / total) * 100).toFixed(1) : '0.0'
    };
  }).filter((classItem) => classItem.total > 0), [classes, todayRecords]);

  const sessionCounts = useMemo(() => records.reduce((counts, record) => {
    const sessionId = String(record.sessionId?._id || record.sessionId || '');
    if (!sessionId) return counts;
    if (!counts[sessionId]) counts[sessionId] = { present: 0, total: 0 };
    counts[sessionId].total += 1;
    if (record.status === 'present') counts[sessionId].present += 1;
    return counts;
  }, {}), [records]);

  const chart = useMemo(() => {
    if (!dashboard?.weeklyTrend?.length) return null;
    const width = 760;
    const height = 220;
    const padding = { top: 18, right: 22, bottom: 34, left: 42 };
    const xStep = (width - padding.left - padding.right) / Math.max(dashboard.weeklyTrend.length - 1, 1);
    const points = dashboard.weeklyTrend.map((day, index) => {
      const total = day.present + day.absent + day.late;
      const percentage = total ? (day.present / total) * 100 : null;
      const x = padding.left + index * xStep;
      const y = percentage === null ? null : height - padding.bottom - (percentage / 100) * (height - padding.top - padding.bottom);
      return { ...day, x, y, percentage };
    });
    return { width, height, padding, points };
  }, [dashboard]);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner text="Loading attendance data..." /></div>;
  }

  if (error || !dashboard) {
    return <div className="max-w-xl mx-auto py-16 text-center"><p className="text-rose-400 font-medium mb-4">{error || 'Data loading error'}</p><button onClick={fetchDashboardData} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md font-medium"><RefreshCw className="w-4 h-4" />Try again</button></div>;
  }

  const totalMarked = dashboard.todayPresent + dashboard.todayAbsent + dashboard.todayLate;
  const firstName = user?.fullName?.split(' ')[1] || user?.fullName?.split(' ')[0] || 'there';
  const hasTrendData = chart?.points.some((point) => point.percentage !== null);
  const todayLabel = new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  const overviewItems = [
    { label: 'Present', value: dashboard.todayPresent, tone: 'text-emerald-400' },
    { label: 'Absent', value: dashboard.todayAbsent, tone: 'text-rose-400' },
    { label: 'Late', value: dashboard.todayLate, tone: 'text-amber-400' }
  ];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div><p className="eyebrow">Dashboard</p><h1>Good morning, {firstName}.</h1><p className="header-subtitle">Here&apos;s today&apos;s attendance overview.</p></div>
        <time className="dashboard-date" dateTime={today}>{todayLabel}</time>
      </header>

      <section className="dashboard-stats" aria-label="Attendance statistics">
        <article className="dashboard-stat stat-blue"><div><p>Students</p><strong>{dashboard.totalStudents}</strong><span>Active students</span></div><Users /></article>
        <article className="dashboard-stat stat-neutral"><div><p>Classes</p><strong>{dashboard.totalClasses}</strong><span>Current classes</span></div><BookOpen /></article>
        <article className="dashboard-stat stat-green"><div><p>Today&apos;s attendance</p><strong>{dashboard.attendancePercentage}%</strong><span>{dashboard.todayPresent} of {totalMarked} present</span></div><CheckCircle2 /></article>
        <article className="dashboard-stat stat-amber"><div><p>Sessions today</p><strong>{dashboard.todaySessionsCount}</strong><span>Attendance sessions</span></div><CalendarDays /></article>
      </section>

      <section className={`attendance-overview-grid ${classRows.length === 0 ? 'overview-only' : ''}`}>
        {classRows.length > 0 && <div className="dashboard-section attendance-table-section">
          <div className="section-heading"><div><h2>Today&apos;s attendance</h2><p>Attendance across your assigned classes</p></div>{classRows.length > 0 && <Link to="/reports">View reports</Link>}</div>
          <div className="table-scroll"><table className="dashboard-table"><thead><tr><th>Class</th><th>Present</th><th>Absent</th><th>Late</th><th className="align-right">Rate</th></tr></thead><tbody>{classRows.map((classItem) => <tr key={classItem._id}><td><strong>{classItem.name} ({classItem.section})</strong><small>{classItem.subject}</small></td><td className="present-value">{classItem.present}</td><td className="absent-value">{classItem.absent}</td><td className="late-value">{classItem.late}</td><td className="align-right"><strong>{classItem.rate}%</strong></td></tr>)}</tbody></table></div>
        </div>}

        <aside className="dashboard-section today-overview"><div className="section-heading"><div><h2>Today&apos;s overview</h2><p>Across all assigned classes</p></div></div><div className="overview-list">{overviewItems.map((item) => <div key={item.label}><span>{item.label}</span><strong className={item.tone}>{item.value}</strong></div>)}</div><div className="overview-total"><span>Total marked</span><strong>{totalMarked}</strong></div></aside>
      </section>

      <section className="dashboard-section trend-section"><div className="section-heading"><div><h2>Attendance overview</h2><p>Last 7 days</p></div><ClipboardList /></div>{hasTrendData ? <div className="chart-scroll"><svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="attendance-chart" role="img" aria-label="Attendance percentage over the last 7 days"><g className="chart-grid"><line x1={chart.padding.left} y1={chart.padding.top} x2={chart.width - chart.padding.right} y2={chart.padding.top} /><line x1={chart.padding.left} y1={(chart.height - chart.padding.bottom + chart.padding.top) / 2} x2={chart.width - chart.padding.right} y2={(chart.height - chart.padding.bottom + chart.padding.top) / 2} /><line x1={chart.padding.left} y1={chart.height - chart.padding.bottom} x2={chart.width - chart.padding.right} y2={chart.height - chart.padding.bottom} /></g><g className="chart-labels"><text x="4" y={chart.padding.top + 4}>100%</text><text x="10" y={(chart.height - chart.padding.bottom + chart.padding.top) / 2 + 4}>50%</text><text x="20" y={chart.height - chart.padding.bottom + 4}>0%</text></g><polyline className="chart-line" points={chart.points.filter((point) => point.y !== null).map((point) => `${point.x},${point.y}`).join(' ')} />{chart.points.map((point) => point.y === null ? null : <g key={point.date} className="chart-point"><title>{formatDate(point.date)}: {point.percentage.toFixed(1)}%</title><circle cx={point.x} cy={point.y} r="4" /><text x={point.x} y={chart.height - 10} textAnchor="middle">{formatDate(point.date)}</text></g>)}</svg></div> : <div className="dashboard-empty chart-empty">No attendance data available for the selected period.</div>}</section>

      <section className="dashboard-section sessions-section"><div className="section-heading"><div><h2>Recent sessions</h2><p>Completed and active attendance sessions</p></div><Link to="/attendance-review">View all <ArrowUpRight /></Link></div><div className="table-scroll"><table className="dashboard-table sessions-table"><thead><tr><th>Date</th><th>Class</th><th>Subject</th><th>Present</th><th>Status</th><th></th></tr></thead><tbody>{dashboard.recentSessions?.length ? dashboard.recentSessions.map((session) => { const count = sessionCounts[String(session._id)]; return <tr key={session._id}><td>{formatDate(session.startedAt)}<small>{formatTime(session.startedAt)}</small></td><td><strong>{session.classId?.name} ({session.classId?.section})</strong></td><td>{session.subject}</td><td>{count ? `${count.present}/${count.total}` : '—'}</td><td><span className={`session-status status-${session.status}`}>{session.status}</span></td><td className="align-right"><Link to={`/attendance-review?sessionId=${session._id}`}>Review</Link></td></tr>; }) : <tr><td colSpan="6" className="empty-row">No attendance sessions recorded yet.</td></tr>}</tbody></table></div></section>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'hod') return <HodDashboard />;
  return <TeacherDashboard />;
};

export default Dashboard;
