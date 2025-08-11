import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { testTypeService } from '../services/testTypeService';
import { ToggleLeft, ToggleRight, Save, Search } from 'lucide-react';
import ColoredIcon from '../components/testcases/ColoredIcon';

export default function OrgTestTypes() {
  const { currentUserData, currentOrganization } = useAuth();
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const [enabledOnly, setEnabledOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState([]);

  const orgId = currentOrganization?.id || currentUserData?.organisationId || null;
  const canAccess = Array.isArray(currentUserData?.roles) && currentUserData.roles.some((r) => r === 'APP_ADMIN' || r === 'ORG_ADMIN');

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!orgId) return;
      const data = await testTypeService.getResolvedOrgTestTypes(orgId);
      if (alive) {
        setRows(data);
        setLocal(data.map((d) => ({ id: d.id, enabled: d.enabled, override: d.override || null })));
      }
    })();
    return () => { alive = false; };
  }, [orgId]);

  const byId = useMemo(() => new Map(local.map((r) => [r.id, r])), [local]);



  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = rows.map((r) => ({ ...r, ...byId.get(r.id) }));
    const textFiltered = !q ? list : list.filter((t) =>
      t.code?.toLowerCase().includes(q) ||
      t.name?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q)
    );
    return enabledOnly ? textFiltered.filter((t) => t.enabled) : textFiltered;
  }, [rows, filter, byId, enabledOnly]);

  const toggle = (id) => {
    setLocal((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const onSave = async () => {
    if (!orgId) return;
    setSaving(true);
    try {
      const enabledIds = local.filter((r) => r.enabled).map((r) => r.id);
      const overrides = {}; // future: allow editing name/description/icon override
      await testTypeService.setOrgTestTypes({ organizationId: orgId, enabledIds, overrides });
      // Reload
      const data = await testTypeService.getResolvedOrgTestTypes(orgId);
      setRows(data);
      setLocal(data.map((d) => ({ id: d.id, enabled: d.enabled, override: d.override || null })));
    } finally {
      setSaving(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="p-6">
        <div className="bg-card border border-subtle rounded-lg p-4">
          <h2 className="text-foreground font-semibold">Access Denied</h2>
          <p className="text-menu">You need to be an Org Admin to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Test Types (Org)</h1>
          <p className="text-menu">Enable the global test types for this organisation.</p>
        </div>
        <button className="btn-primary flex items-center gap-2" disabled={saving} onClick={onSave}>
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-menu" />
          <input
            className="input-field pl-9"
            placeholder="Filter by name/code/category"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-foreground select-none">
          <input
            type="checkbox"
            className="form-checkbox h-4 w-4"
            checked={enabledOnly}
            onChange={(e) => setEnabledOnly(e.target.checked)}
          />
          Enabled only
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((t) => (
          <div key={t.id} className="bg-card border border-subtle rounded-lg p-4 flex items-start gap-3">
            <ColoredIcon icon={t.icon} size={20} className="mr-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-foreground font-medium">{t.name}</div>
                  <div className="text-menu text-sm">{t.code} {t.category ? `• ${t.category}` : ''}</div>
                </div>
                <button
                  className={`p-2 rounded ${t.enabled ? 'text-green-400 hover:bg-green-900/20' : 'text-menu hover:bg-white/10'}`}
                  onClick={() => toggle(t.id)}
                  title={t.enabled ? 'Enabled' : 'Disabled'}
                >
                  {t.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-sm text-foreground mt-1 line-clamp-2">{t.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


