import React from 'react';
import { Menu, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = ({ onToggleSidebar }) => {
  return (
    <header className="h-16 glass-panel border-b border-slate-800/80 fixed top-0 left-0 right-0 z-30 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 lg:hidden transition"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white transition duration-200 group-hover:bg-blue-500">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm sm:text-lg font-extrabold text-white tracking-tight whitespace-nowrap">SmartAttend <span className="text-blue-500">AI</span></span>
          </div>
        </Link>
      </div>

    </header>
  );
};

export default Navbar;
