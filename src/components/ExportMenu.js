import React, { useState, useMemo, useRef } from 'react';
import { Download, FileText, Table, FileSpreadsheet } from 'lucide-react';
import { exportCSV, exportXLSX, exportHTML } from '../utils/exportUtils';

function formatNowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export default function ExportMenu({
  label = 'Export',
  getRows, // () => array of objects
  filenamePrefix = 'export',
}) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef(null);

  const filenameBase = useMemo(() => `${filenamePrefix}-${formatNowStamp()}`, [filenamePrefix]);

  const openMenu = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  };

  const scheduleClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setOpen(false), 150);
  };

  const handleExport = (type) => {
    try {
      const rows = typeof getRows === 'function' ? getRows() : [];
      if (!Array.isArray(rows) || rows.length === 0) {
        // Silent no-op for now; could toast later
      }
      switch (type) {
        case 'csv':
          exportCSV(rows, filenameBase);
          break;
        case 'xlsx':
          exportXLSX(rows, filenameBase);
          break;
        case 'html':
          exportHTML(rows, filenameBase);
          break;
        default:
          break;
      }
    } finally {
      setOpen(false);
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className="flex items-center space-x-2 px-4 py-2 bg-surface-muted border border-subtle text-white rounded-lg hover:brightness-110 transition-colors whitespace-nowrap"
        title="Export"
      >
        <Download className="w-4 h-4" />
        <span>{label}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full w-44 bg-card border border-subtle rounded-lg shadow-lg z-10"
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
          role="menu"
        >
          <div className="py-1">
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-foreground hover:bg-white/10"
              onMouseDown={() => handleExport('csv')}
              role="menuitem"
            >
              <Table className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-foreground hover:bg-white/10"
              onMouseDown={() => handleExport('xlsx')}
              role="menuitem"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export XLSX</span>
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-foreground hover:bg-white/10"
              onMouseDown={() => handleExport('html')}
              role="menuitem"
            >
              <FileText className="w-4 h-4" />
              <span>Export HTML</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


