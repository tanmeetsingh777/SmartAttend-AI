import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

const ResponsiveSelect = ({ value, onChange, options, placeholder = 'Select an option', className = '' }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const selected = options.find(option => String(option.value) === String(value));

  useEffect(() => {
    const close = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        className="w-full min-w-0 flex items-center justify-between gap-2 px-3 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white text-left focus:outline-none focus:border-blue-500"
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-2xl">
          {options.map(option => (
            <button
              type="button"
              role="option"
              aria-selected={String(option.value) === String(value)}
              key={String(option.value)}
              onClick={() => { onChange(option.value); setOpen(false); }}
              className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-blue-600 hover:text-white"
            >
              <span className="truncate">{option.label}</span>
              {String(option.value) === String(value) && <Check className="w-3.5 h-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResponsiveSelect;
