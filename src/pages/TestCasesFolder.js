import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, FolderPlus, Upload, List, Grid, Folder as FolderIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { folderService } from '../services/folderService';
import { testCaseService } from '../services/testCaseService';
import { seedMockTestCasesForFolder } from '../utils/seedMockTestCasesForFolder';
import { useNavigate } from 'react-router-dom';
import TagPills from '../components/TagPills';
import TestCaseNewModal from '../components/testcases/TestCaseNewModal';
import TestCaseEditModal from '../components/testcases/TestCaseEditModal';
import TestCaseViewModal from '../components/testcases/TestCaseViewModal';

const FolderTree = ({ organizationId, projectId, onSelect, selectedId, refreshKey = 0, expandFolderId = null }) => {
  const [roots, setRoots] = useState([]);
  const [expanded, setExpanded] = useState(new Set());
  const [children, setChildren] = useState(new Map());
  const [busy, setBusy] = useState(false);
  const clickTimer = useRef(null);

  const toggle = async (folderId) => {
    const isExpanded = expanded.has(folderId);
    const next = new Set(expanded);
    if (isExpanded) {
      next.delete(folderId);
      setExpanded(next);
      return;
    }
    next.add(folderId);
    setExpanded(next);
    if (!children.has(folderId)) {
      setBusy(true);
      try {
        const items = await folderService.listChildren(organizationId, projectId, folderId);
        setChildren((prev) => {
          const m = new Map(prev);
          m.set(folderId, items);
          return m;
        });
      } finally {
        setBusy(false);
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const items = await folderService.listChildren(organizationId, projectId, null);
      if (mounted) setRoots(items);
    })();
    return () => { mounted = false; };
  }, [organizationId, projectId, refreshKey]);

  // When refreshKey changes, reload children for expanded nodes
  useEffect(() => {
    let cancelled = false;
    const reloadExpanded = async () => {
      const ids = Array.from(expanded);
      for (const id of ids) {
        const items = await folderService.listChildren(organizationId, projectId, id);
        if (cancelled) return;
        setChildren((prev) => {
          const m = new Map(prev);
          m.set(id, items);
          return m;
        });
      }
    };
    if (expanded.size > 0) reloadExpanded();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useEffect(() => {
    const ensureExpanded = async () => {
      if (!expandFolderId) return;
      setExpanded((prev) => new Set(prev).add(expandFolderId));
      const items = await folderService.listChildren(organizationId, projectId, expandFolderId);
      setChildren((prev) => {
        const m = new Map(prev);
        m.set(expandFolderId, items);
        return m;
      });
    };
    ensureExpanded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandFolderId]);

  const renderNode = (node, level = 0) => {
    const isSelected = selectedId === node.id;
    const isOpen = expanded.has(node.id);
    const kids = children.get(node.id) || [];
    return (
      <div key={node.id}>
        <button
          className={`w-full text-left px-3 py-2 rounded-md ${isSelected ? 'bg-white/10 text-white' : 'text-menu hover:bg-white/5'}`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => {
            if (clickTimer.current) clearTimeout(clickTimer.current);
            clickTimer.current = setTimeout(() => {
              onSelect(node);
              toggle(node.id);
            }, 160);
          }}
          onDoubleClick={async () => {
            if (clickTimer.current) clearTimeout(clickTimer.current);
            const newName = window.prompt('Rename folder', node.name);
            const finalName = (newName || '').trim();
            if (!finalName || finalName === node.name) return;
            await folderService.renameFolder(organizationId, projectId, node.id, finalName);
            if (!node.parentFolderId) {
              // refresh roots
              const items = await folderService.listChildren(organizationId, projectId, null);
              setRoots(items);
            } else {
              const items = await folderService.listChildren(organizationId, projectId, node.parentFolderId);
              setChildren((prev) => {
                const m = new Map(prev);
                m.set(node.parentFolderId, items);
                return m;
              });
            }
          }}
          title={node.name}
        >
          {node.name}
        </button>
        {isOpen && kids.length > 0 && (
          <div className="ml-2">
            {kids.map((c) => renderNode(c, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {roots.map((r) => renderNode(r))}
      {busy && <div className="text-xs text-menu px-3 py-1">Loading…</div>}
    </div>
  );
};

const statusColors = {
  Passed: 'text-green-400 bg-green-900/20',
  Failed: 'text-red-400 bg-red-900/20',
  'In Progress': 'text-amber-300 bg-amber-900/20',
  'Not Run': 'text-menu bg-white/5',
};

const testTypeColors = {
  Functional: 'text-[rgb(var(--tc-contrast))]',
  Security: 'text-red-400',
  Performance: 'text-purple-300',
  Usability: 'text-green-400',
  Integration: 'text-orange-300',
};

const TestCaseList = ({ organizationId, projectId, folderId, refreshKey = 0, onSingleClick, onDoubleClick, resolveTags }) => {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const clickTimer = useRef(null);

  const refresh = async () => {
    setBusy(true);
    try {
      const items = await testCaseService.listTestCasesByFolder(organizationId, projectId, folderId);
      setRows(items);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!organizationId || !projectId) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, projectId, folderId, refreshKey]);

  if (!folderId) return <div className="text-menu">Select a folder to view test cases.</div>;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Test Cases</h3>
        <button className="btn-secondary text-sm" onClick={refresh}>
          Refresh
        </button>
      </div>
      {busy && <div className="text-xs text-menu">Loading…</div>}
      {rows.length === 0 ? (
        <div className="text-menu text-sm">No test cases in this folder.</div>
      ) : (
        <ul className="divide-y divide-subtle rounded-lg border border-subtle overflow-hidden">
          {rows.map((r) => (
            <li
              key={r.id}
              className="p-4 hover:bg-white/5 cursor-pointer"
              onClick={() => {
                if (clickTimer.current) clearTimeout(clickTimer.current);
                clickTimer.current = setTimeout(() => onSingleClick?.(r), 180);
              }}
              onDoubleClick={() => {
                if (clickTimer.current) clearTimeout(clickTimer.current);
                onDoubleClick?.(r);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-[rgb(var(--tc-icon))]/20 rounded-lg flex items-center justify-center">
                    <span className="text-[rgb(var(--tc-icon))] font-semibold text-sm">TC</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{r.tcid}: {r.name}</h4>
                    <p className="text-sm text-menu mt-1 line-clamp-2" title={r.description}>{r.description}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[r.overallResult] || 'bg-white/5 text-menu'}`}>{r.overallResult || 'Not Run'}</span>
                      <span className={`text-xs font-medium ${testTypeColors[r.testType] || 'text-menu'}`}>{r.testType || ''}</span>
                      <span className="text-xs text-menu">by {r.author || '—'}</span>
                      <span className="text-xs text-menu">{(r.testSteps?.length || 0)} steps</span>
                      {Array.isArray(r.tags) && r.tags.length > 0 && (
                        <div className="ml-2">
                          <TagPills tags={resolveTags(r.tags)} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const TestCasesFolder = () => {
  const { currentUserData, currentOrganization, getProjects } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [treeRefreshKey, setTreeRefreshKey] = useState(0);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  // Local modals to keep user on folder screen
  const [showNew, setShowNew] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [newForm, setNewForm] = useState({ tcid: '', name: '', description: '', author: '', testType: '', overallResult: 'Not Run', prerequisites: '', priority: 'Medium', tags: [], testSteps: [] });
  const [editForm, setEditForm] = useState({ tcid: '', name: '', description: '', author: '', testType: '', overallResult: '', prerequisites: '', priority: 'Medium', tags: [], testSteps: [] });
  const [expandFolderId, setExpandFolderId] = useState(null);
  const [availableTags] = useState([
    { id: 'ui', name: 'UI', color: '#0ea5e9' },
    { id: 'api', name: 'API', color: '#10b981' },
    { id: 'regression', name: 'Regression', color: '#f59e0b' },
    { id: 'security', name: 'Security', color: '#ef4444' },
  ]);

  const resolveTags = (tagIds) => {
    if (!Array.isArray(tagIds)) return [];
    const map = new Map(availableTags.map(t => [t.id, t]));
    return tagIds.map(id => map.get(id)).filter(Boolean);
  };

  const organizationId = currentOrganization?.id || currentUserData?.organisationId || '';

  useEffect(() => {
    let mounted = true;
    (async () => {
      const rows = await getProjects();
      if (mounted) setProjects(rows);
    })();
    return () => { mounted = false; };
  }, [getProjects]);

  const canSeed = Boolean(process.env.REACT_APP_DEV_TOOLS !== 'false') && Boolean(selectedFolder && organizationId && projectId);

  const onSeed = async () => {
    if (!canSeed) return;
    const input = window.prompt('How many mock tests to create? (1-5)', '5');
    const n = Math.max(1, Math.min(5, parseInt(input || '5', 10)));
    setSeeding(true);
    try {
      await seedMockTestCasesForFolder({
        organizationId,
        projectId,
        folderId: selectedFolder.id,
        author: currentUserData?.name || 'Seeder',
        count: n,
      });
      setListRefreshKey((k) => k + 1);
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(`Seeding failed: ${e?.message || e}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Test Cases — Folder View</h1>
          <p className="text-menu mt-1">Select a project, then a folder to view and seed test cases.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input-field h-10 !py-2 w-72"
            value={projectId}
            onChange={(e) => { setProjectId(e.target.value); setSelectedFolder(null); }}
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name || p.projectName || p.id}</option>
            ))}
          </select>
          {/* Primary actions retained here; view toggles move to a row below */}
          <button className="btn-primary text-sm flex items-center gap-2" disabled={!selectedFolder} onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4" />
            New Test Case
          </button>
          {/* Temporary seed button */}
          <button
            className="btn-secondary text-sm flex items-center gap-2"
            disabled={!canSeed || seeding}
            onClick={onSeed}
            title="Temporary: seed up to 5 mock tests into the selected folder"
          >
            <Upload className="w-4 h-4" /> Seed Mock Tests
          </button>
        </div>
      </div>
      {/* View toggles below the primary actions */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex bg-surface-muted rounded-lg p-1 border border-subtle">
          <button
            onClick={() => navigate('/test-cases', { state: { viewMode: 'tree' } })}
            className="p-2 rounded-md transition-colors text-menu hover:text-white"
            title="Tree View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/test-cases', { state: { viewMode: 'grid' } })}
            className="p-2 rounded-md transition-colors text-menu hover:text-white"
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => { /* already on folder view */ }}
            className="p-2 rounded-md transition-colors bg-white/10 text-white"
            title="Folder View"
          >
            <FolderIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!projectId ? (
        <div className="text-menu">Choose a project to begin.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-foreground">Folders</h3>
              <div className="flex items-center gap-2">
                <button
                  className="btn-secondary text-xs flex items-center gap-2"
                  title="Add Folder"
                  onClick={async () => {
                    const name = window.prompt('Folder name');
                    if (!name) return;
                    const parentId = selectedFolder?.id || null;
                    await folderService.createFolder(organizationId, projectId, { name, createdBy: currentUserData?.userId, parentFolderId: parentId });
                    setTreeRefreshKey((k) => k + 1);
                    if (parentId) setExpandFolderId(parentId);
                  }}
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Add Folder</span>
                </button>
                <button
                  className="btn-secondary text-xs flex items-center gap-2"
                  title="Add Root Folder"
                  onClick={async () => {
                    const name = window.prompt('New root folder name');
                    if (!name) return;
                    await folderService.createFolder(organizationId, projectId, { name, createdBy: currentUserData?.userId, parentFolderId: null });
                    setTreeRefreshKey((k) => k + 1);
                  }}
                >
                  <FolderIcon className="w-4 h-4" />
                  <span>Add Root Folder</span>
                </button>
              </div>
            </div>
            <FolderTree
              organizationId={organizationId}
              projectId={projectId}
              onSelect={(f) => setSelectedFolder(f)}
              selectedId={selectedFolder?.id}
              refreshKey={treeRefreshKey}
              expandFolderId={expandFolderId}
            />
          </div>
          <div className="md:col-span-2 card">
            <TestCaseList
              organizationId={organizationId}
              projectId={projectId}
              folderId={selectedFolder?.id || null}
              refreshKey={listRefreshKey}
              onSingleClick={(tc) => { setSelectedTestCase(tc); setShowView(true); }}
              onDoubleClick={(tc) => { setSelectedTestCase(tc); setEditForm({ ...editForm, ...tc }); setShowEdit(true); }}
              resolveTags={resolveTags}
            />
          </div>
        </div>
      )}

      <TestCaseNewModal
        open={showNew}
        form={newForm}
        onChange={(d) => setNewForm((p) => ({ ...p, ...d }))}
        onAddStep={() => setNewForm((p) => ({ ...p, testSteps: [...p.testSteps, { stepNumber: p.testSteps.length + 1, description: '', testData: '', expectedResult: '', actualResult: '', stepStatus: 'Not Run', notes: '' }] }))}
        onRemoveStep={(i) => setNewForm((p) => ({ ...p, testSteps: p.testSteps.filter((_, idx) => idx !== i).map((s, i2) => ({ ...s, stepNumber: i2 + 1 })) }))}
        onUpdateStep={(i, field, value) => setNewForm((p) => { const arr = [...p.testSteps]; arr[i] = { ...arr[i], [field]: value }; return { ...p, testSteps: arr }; })}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!selectedFolder?.id) return;
          await testCaseService.createTestCase(organizationId, projectId, { ...newForm, folderId: selectedFolder.id });
          setShowNew(false);
          setNewForm({ tcid: '', name: '', description: '', author: '', testType: '', overallResult: 'Not Run', prerequisites: '', priority: 'Medium', tags: [], testSteps: [] });
          setListRefreshKey((k) => k + 1);
        }}
        onClose={() => setShowNew(false)}
      />

      <TestCaseViewModal open={showView} testCase={selectedTestCase} onClose={() => setShowView(false)} />

      <TestCaseEditModal
        open={showEdit}
        form={editForm}
        onChange={(d) => setEditForm((p) => ({ ...p, ...d }))}
        onAddStep={() => setEditForm((p) => ({ ...p, testSteps: [...p.testSteps, { stepNumber: p.testSteps.length + 1, description: '', testData: '', expectedResult: '', actualResult: '', stepStatus: 'Not Run', notes: '' }] }))}
        onRemoveStep={(i) => setEditForm((p) => ({ ...p, testSteps: p.testSteps.filter((_, idx) => idx !== i).map((s, i2) => ({ ...s, stepNumber: i2 + 1 })) }))}
        onUpdateStep={(i, field, value) => setEditForm((p) => { const arr = [...p.testSteps]; arr[i] = { ...arr[i], [field]: value }; return { ...p, testSteps: arr }; })}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!selectedTestCase?.id) { setShowEdit(false); return; }
          await testCaseService.updateTestCase(organizationId, projectId, selectedTestCase.id, { ...editForm });
          setShowEdit(false);
          setListRefreshKey((k) => k + 1);
        }}
        onClose={() => setShowEdit(false)}
      />


    </div>
  );
};

export default TestCasesFolder;


