import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, Camera, FileText, CheckSquare, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = user?.role === 'admin'
    ? [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Users & Roles', path: '/students', icon: Users },
      { name: 'Departments & Classes', path: '/classes', icon: BookOpen },
      { name: 'System Reports', path: '/reports', icon: FileText }
    ]
    : user?.role === 'hod'
      ? [
        { name: 'Department Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Take Attendance', path: '/take-attendance', icon: Camera, highlight: true },
        { name: 'Department Students', path: '/students', icon: Users },
        { name: 'Classes & Subjects', path: '/classes', icon: BookOpen },
        { name: 'Correction Requests', path: '/attendance-review', icon: CheckSquare },
        { name: 'Department Reports', path: '/reports', icon: FileText }
      ]
      : [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Take Attendance', path: '/take-attendance', icon: Camera, highlight: true },
        { name: 'Students', path: '/students', icon: Users },
        { name: 'Assigned Classes', path: '/classes', icon: BookOpen },
        { name: 'Attendance Sessions', path: '/attendance-review', icon: CheckSquare },
        { name: 'Class Reports', path: '/reports', icon: FileText }
      ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 w-64 overflow-y-auto glass-panel border-r border-slate-800/80 z-30 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="p-4 space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Main Navigation</p>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition duration-150 ${isActive
                    ? 'border-l-2 border-blue-500 bg-slate-800/70 text-white'
                    : item.highlight
                      ? 'text-blue-400 hover:bg-slate-800/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {user && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="relative">
              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 glass-panel rounded-2xl shadow-2xl py-2 border border-slate-800 z-50 animate-in fade-in duration-150">
                  <div className="px-4 py-2 border-b border-slate-800/60">
                    <p className="text-sm font-bold text-white">{user.fullName}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold uppercase">
                      {user.role} Account
                    </span>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); logout(); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-medium transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}

              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 border border-slate-800 bg-slate-900/70 p-2 text-left transition hover:border-slate-700 hover:bg-slate-800/80"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 text-xs">
                  <p className="font-semibold text-white leading-tight truncate">{user.fullName}</p>
                  <p className="text-slate-400 capitalize text-[10px]">{user.role}</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
