import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { testTypeService } from '../services/testTypeService';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import ColoredIcon from '../components/testcases/ColoredIcon';

const emptyForm = { code: '', name: '', category: '', description: '', iconName: '', iconUrl: '' };
const QUICK_COLORS = [
  'rgb(2,74,242)',
  'rgb(251,95,246)',
  'rgb(245,37,0)',
  'rgb(255,234,0)',
  'rgb(40,236,14)',
  'rgb(249,127,26)'
];

export default function AdminGlobalTestTypes() {
  const { currentUserData } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  

  const roleArray = Array.isArray(currentUserData?.roles)
    ? currentUserData.roles
    : Object.keys(currentUserData?.roles || {}).filter((k) => currentUserData.roles[k] === true);
  const canAccess = roleArray.includes('APP_ADMIN');
  
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        let rows = await testTypeService.listGlobalTestTypes();
        if (!rows || rows.length === 0) {
          await testTypeService.seedDefaultsIfEmpty();
          rows = await testTypeService.listGlobalTestTypes();
        } else if (rows.length < 10) {
          // Ensure any missing defaults are backfilled
          await testTypeService.seedMissingDefaults();
          rows = await testTypeService.listGlobalTestTypes();
        }
        if (alive) setItems(rows);
        
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((t) =>
      t.code?.toLowerCase().includes(q) ||
      t.name?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q)
    );
  }, [items, filter]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowEditor(true);
  };
  const openEdit = (t) => {
    setEditingId(t.id);
    setForm({
      code: t.code,
      name: t.name,
      category: t.category || '',
      description: t.description || '',
      iconName: t.icon?.name || '',
      iconUrl: t.icon?.url || '',
      colorLight: t.icon?.colorLight || '#60a5fa',
      colorDark: t.icon?.colorDark || '#60a5fa',
    });
    setShowEditor(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      category: form.category.trim() || null,
      description: form.description.trim(),
      icon: { pack: 'lucide', name: form.iconName.trim(), src: 'local', url: form.iconUrl.trim(), colorLight: form.colorLight, colorDark: form.colorDark },
      status: 'ACTIVE',
    };
    if (!editingId) {
      await testTypeService.createGlobalTestType(payload);
    } else {
      const updates = { ...payload };
      delete updates.code;
      await testTypeService.updateGlobalTestType(editingId, updates);
    }
    const rows = await testTypeService.listGlobalTestTypes();
    setItems(rows);
    setShowEditor(false);
  };

  const onArchive = async (t) => {
    if (!window.confirm(`Archive test type "${t.name}"?`)) return;
    await testTypeService.archiveGlobalTestType(t.id);
    setItems(await testTypeService.listGlobalTestTypes());
  };

  if (!canAccess) {
    return (
      <div className="p-6">
        <div className="bg-card border border-subtle rounded-lg p-4">
          <h2 className="text-foreground font-semibold">Access Denied</h2>
          <p className="text-menu">You need to be an App Admin to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Test Types (Global)</h1>
          <p className="text-menu">Add, edit, and archive the global test types and their icons.</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openNew}>
          <Plus className="w-4 h-4" /> New Test Type
        </button>
      </div>


      <div className="flex items-center gap-2">
        <div className="relative w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-menu" />
          <input
            className="input-field pl-9"
            placeholder="Filter by name/code/category"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="text-menu">Loading…</div>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className="bg-card border border-subtle rounded-lg p-4 flex items-start gap-3">
              <ColoredIcon icon={t.icon} size={20} className="mr-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-foreground font-medium">{t.name}</div>
                    <div className="text-menu text-sm">{t.code} {t.category ? `• ${t.category}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-menu hover:text-white hover:bg-white/10 rounded" onClick={() => openEdit(t)} title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded" onClick={() => onArchive(t)} title="Archive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-foreground mt-1 line-clamp-2">{t.description}</div>
                <div className="text-xs mt-1">
                  <span className={`px-2 py-0.5 rounded-full ${t.status === 'ACTIVE' ? 'bg-green-900/20 text-green-400' : 'bg-white/5 text-menu'}`}>{t.status}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-subtle rounded-2xl p-6 w-full max-w-xl">
            <h3 className="text-xl font-semibold text-foreground mb-4">{editingId ? 'Edit Test Type' : 'New Test Type'}</h3>
            <form onSubmit={onSubmit} className="space-y-3">
              {!editingId && (
                <div>
                  <label className="block text-sm text-foreground mb-1">Code</label>
                  <input className="input-field" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required />
                </div>
              )}
              <div>
                <label className="block text-sm text-foreground mb-1">Name</label>
                <input className="input-field" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm text-foreground mb-1">Category</label>
                <input className="input-field" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-foreground mb-1">Description</label>
                <textarea rows={3} className="input-field" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-foreground mb-1">Icon Name (lucide)</label>
                  <input className="input-field" value={form.iconName} onChange={(e) => setForm((p) => ({ ...p, iconName: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1">Icon URL</label>
                  <input className="input-field" value={form.iconUrl} onChange={(e) => setForm((p) => ({ ...p, iconUrl: e.target.value }))} required />
                </div>
              </div>

              {/* Live previews */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border border-subtle rounded-md p-3">
                  <div className="text-xs text-menu mb-2">Light Preview</div>
                  <div className="w-full h-20 rounded-md flex items-center justify-center" style={{ background: '#f5f5f5', border: '1px solid #e5e7eb' }}>
                    {form.iconUrl ? (
                      <span
                        aria-hidden="true"
                        style={{
                          WebkitMaskImage: `url(${form.iconUrl})`,
                          maskImage: `url(${form.iconUrl})`,
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                          backgroundColor: form.colorLight || '#60a5fa',
                          width: '56px',
                          height: '56px',
                          display: 'inline-block',
                        }}
                      />
                    ) : (
                      <span className="text-xs text-menu">No icon</span>
                    )}
                  </div>
                  {/* Quick picks for light */}
                  <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
                    {QUICK_COLORS.map((c) => (
                      <button
                        key={`ql-${c}`}
                        type="button"
                        aria-label="quick color"
                        onClick={() => setForm((p) => ({ ...p, colorLight: c }))}
                        className="rounded-full border border-subtle hover:brightness-110"
                        style={{ width: 16, height: 16, backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="border border-subtle rounded-md p-3">
                  <div className="text-xs text-menu mb-2">Dark Preview</div>
                  <div className="w-full h-20 rounded-md flex items-center justify-center" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {form.iconUrl ? (
                      <span
                        aria-hidden="true"
                        style={{
                          WebkitMaskImage: `url(${form.iconUrl})`,
                          maskImage: `url(${form.iconUrl})`,
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                          backgroundColor: form.colorDark || '#60a5fa',
                          width: '56px',
                          height: '56px',
                          display: 'inline-block',
                        }}
                      />
                    ) : (
                      <span className="text-xs text-menu">No icon</span>
                    )}
                  </div>
                  {/* Quick picks for dark */}
                  <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
                    {QUICK_COLORS.map((c) => (
                      <button
                        key={`qd-${c}`}
                        type="button"
                        aria-label="quick color"
                        onClick={() => setForm((p) => ({ ...p, colorDark: c }))}
                        className="rounded-full border border-subtle hover:brightness-110"
                        style={{ width: 16, height: 16, backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-foreground mb-1">Icon Colour (Light Mode)</label>
                  <input type="color" className="input-field h-10" value={form.colorLight || '#60a5fa'} onChange={(e) => setForm((p) => ({ ...p, colorLight: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1">Icon Colour (Dark Mode)</label>
                  <input type="color" className="input-field h-10" value={form.colorDark || '#60a5fa'} onChange={(e) => setForm((p) => ({ ...p, colorDark: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowEditor(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editingId ? 'Save' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


