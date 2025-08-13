import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { parseImportFile } from '../utils/importUtils';

export default function ImportButton({ onParsed, onOpenTargetModal }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleSelect = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBusy(true);
    try {
      const result = await parseImportFile(file);
      onParsed?.({ file, ...result });
    } catch (err) {
      onParsed?.({ file, testCases: [], errors: [{ line: 0, message: err?.message || 'Failed to parse file' }] });
    } finally {
      setBusy(false);
      // Reset input so selecting the same file again will retrigger
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="relative inline-block">
      <input
        ref={inputRef}
        type="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        className="hidden"
        onChange={handleSelect}
      />
      <button
        type="button"
        className="flex items-center space-x-2 px-4 py-2 bg-surface-muted border border-subtle text-white rounded-lg hover:brightness-110 transition-colors whitespace-nowrap"
        title="Import"
        onClick={() => onOpenTargetModal ? onOpenTargetModal(() => inputRef.current && inputRef.current.click()) : (inputRef.current && inputRef.current.click())}
        disabled={busy}
      >
        <UploadCloud className="w-4 h-4" />
        <span>{busy ? 'Parsing…' : 'Import'}</span>
      </button>
    </div>
  );
}


