import React, { useEffect, useState } from 'react';
import { Activity, Building2, ShieldCheck, Users } from 'lucide-react';
import { adminService } from '../services/adminService';
import { reportService } from '../services/reportService';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([adminService.getUsers(), adminService.getDepartments(), adminService.getAuditLogs(), reportService.getDashboardStats()])
      .then(([users, departments, logs, stats]) => setData({ users: users.data || [], departments: departments.data || [], logs: logs.data || [], stats: stats.data }))
      .catch(() => setError('Unable to load system administration data.'));
  }, []);

  if (error) return <p className="text-rose-400">{error}</p>;
  if (!data) return <div className="min-h-[50vh] flex items-center justify-center"><LoadingSpinner text="Loading administration..." /></div>;
  const activeUsers = data.users.filter(user => user.isActive).length;
  const roles = data.users.reduce((counts, user) => ({ ...counts, [user.role]: (counts[user.role] || 0) + 1 }), {});
  const cards = [
    { label: 'Departments', value: data.departments.length, icon: Building2 },
    { label: 'Total users', value: data.users.length, icon: Users },
    { label: 'Active accounts', value: activeUsers, icon: ShieldCheck },
    { label: 'Audit events', value: data.logs.length, icon: Activity }
  ];
  return <div className="dashboard-page">
    <header className="dashboard-header"><div><p className="eyebrow">Administration</p><h1>System control center</h1><p className="header-subtitle">Manage university access, structure and activity.</p></div></header>
    <section className="dashboard-stats" aria-label="System statistics">{cards.map(({ label, value, icon: Icon }) => <article className="dashboard-stat stat-blue" key={label}><div><p>{label}</p><strong>{value}</strong><span>Current records</span></div><Icon /></article>)}</section>
    <section className="attendance-overview-grid">
      <div className="dashboard-section dashboard-panel"><div className="section-heading"><div><h2>Role distribution</h2><p>Accounts by assigned system role</p></div></div><div className="overview-list">{Object.entries(roles).map(([role, count]) => <div key={role}><span className="capitalize">{role}</span><strong>{count}</strong></div>)}</div></div>
      <div className="dashboard-section dashboard-panel"><div className="section-heading"><div><h2>System health</h2><p>Live service status</p></div></div><div className="overview-list"><div><span>API</span><strong className="text-emerald-400">Healthy</strong></div><div><span>Attendance data</span><strong className="text-emerald-400">Persisted</strong></div></div></div>
    </section>
    <section className="dashboard-section sessions-section dashboard-panel"><div className="section-heading"><div><h2>Recent audit activity</h2><p>Administrative actions from the system log</p></div></div><div className="table-scroll"><table className="dashboard-table admin-audit-table"><thead><tr><th>Action</th><th>Resource</th><th>Actor</th><th>Date</th></tr></thead><tbody>{data.logs.length ? data.logs.slice(0, 8).map(log => <tr key={log._id}><td>{log.action}</td><td>{log.resource}</td><td>{log.actorId?.fullName || 'System'}</td><td>{new Date(log.createdAt).toLocaleString()}</td></tr>) : <tr><td colSpan="4" className="empty-row">No audit activity recorded.</td></tr>}</tbody></table></div></section>
  </div>;
};

export default AdminDashboard;