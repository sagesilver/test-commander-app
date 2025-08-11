import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import ColoredIcon from './ColoredIcon';

export default function TestTypeSelect({
  options = [],
  valueCode = '',
  valueLabel = '',
  onChange,
  placeholder = 'Select Test Type',
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = options.find((o) => o.id === valueCode) || null;

  useEffect(() => {
    const onDocClick = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="input-field w-full flex items-center justify-between"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2 truncate">
          {selected?.icon?.url && <ColoredIcon icon={selected.icon} size={18} className="" />}
          <span className="truncate text-left">
            {selected ? selected.name : valueLabel || placeholder}
          </span>
        </span>
        <ChevronDown className="w-4 h-4 text-menu" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-subtle rounded-md shadow-lg max-h-64 overflow-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-menu">No test types available</div>
          ) : (
            options.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`w-full px-3 py-2 flex items-center gap-2 text-sm hover:bg-white/5 ${
                  o.id === valueCode ? 'bg-white/10' : ''
                }`}
                onClick={() => {
                  onChange?.({ code: o.id, name: o.name });
                  setOpen(false);
                }}
              >
                {o.icon?.url && <ColoredIcon icon={o.icon} size={16} />}
                <span className="flex-1 text-foreground text-left truncate">{o.name}</span>
                <span className="text-xs text-menu">{o.id}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}


