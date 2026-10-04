import React from 'react';

const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-3">
      <div className="relative w-10 h-10">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500/20 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      {text && <p className="text-sm font-medium text-slate-400">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
