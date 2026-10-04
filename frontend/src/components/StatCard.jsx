import React from 'react';

const StatCard = ({ title, value, subtext, icon: Icon, color = 'blue' }) => {
  const colorStyles = {
    blue: 'text-blue-400 border-blue-500/25',
    green: 'text-emerald-400 border-emerald-500/25',
    amber: 'text-amber-400 border-amber-500/25',
    red: 'text-rose-400 border-rose-500/25',
    purple: 'text-slate-400 border-slate-700'
  };

  return (
    <div className="flex items-start justify-between border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700">
      <div>
        <p className="text-xs font-medium text-slate-400">{title}</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</h3>
        {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
      </div>
      {Icon && (
        <div className={`flex h-8 w-8 items-center justify-center border bg-slate-950/30 ${colorStyles[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};

export default StatCard;
