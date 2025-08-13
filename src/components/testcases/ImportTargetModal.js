import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function ImportTargetModal({
  open,
  onClose,
  projects = [],
  fetchFolders,
  onConfirm,
}) {
  const [projectId, setProjectId] = useState('');
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setProjectId('');
      setFolderId('');
      setFolders([]);
    }
  }, [open]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!open || !projectId) { setFolders([]); setFolderId(''); return; }
      try {
        setBusy(true);
        const all = await fetchFolders(projectId);
        if (!alive) return;
        setFolders(all || []);
        setFolderId('');
      } finally {
        setBusy(false);
      }
    })();
    return () => { alive = false; };
  }, [open, projectId, fetchFolders]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-subtle rounded-lg shadow-lg w-full max-w-md p-5">
        <button className="absolute top-2 right-2 p-1 rounded hover:bg-white/10" onClick={onClose}>
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-semibold text-foreground mb-4">Select Target Project and Folder</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-menu mb-1">Project</label>
            <select className="input-field w-full" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">Select a project…</option>
              {projects.map(p => (
                <option key={p.id || p.projectId} value={p.id || p.projectId}>{p.name || p.projectName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-menu mb-1">Folder</label>
            <select className="input-field w-full" value={folderId} onChange={(e) => setFolderId(e.target.value)} disabled={!projectId || busy}>
              <option value="">Root (no folder)</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.pathLabel || f.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="px-3 py-1.5 rounded border border-subtle hover:bg-white/10" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            disabled={!projectId || busy}
            onClick={() => onConfirm?.({ projectId, folderId: folderId || null })}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}


