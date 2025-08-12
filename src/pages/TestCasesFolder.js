import React, { useEffect, useState } from 'react';
import { Plus, FolderPlus, List, Grid, Folder as FolderIcon, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { folderService } from '../services/folderService';
import { testCaseService } from '../services/testCaseService';

import { useNavigate } from 'react-router-dom';
import TestCaseNewModal from '../components/testcases/TestCaseNewModal';
import TestCaseEditModal from '../components/testcases/TestCaseEditModal';
import TestCaseViewModal from '../components/testcases/TestCaseViewModal';
import InlineTestCasePanel from '../components/testcases/InlineTestCasePanel';
import { useToast } from '../components/Toast';
import TestCaseTree from '../components/testcases/TestCaseTree';
import TestCasesTop from '../components/testcases/TestCasesTop';
import { testTypeService } from '../services/testTypeService';
import { tagService } from '../services/tagService';

const TestCasesFolder = () => {
  const { currentUserData, currentOrganization, getProjects } = useAuth();
  const { push } = useToast() || { push: () => {} };
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);

  const [treeRefreshKey, setTreeRefreshKey] = useState(0);
  // Local modals to keep user on folder screen
  const [showNew, setShowNew] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [inlineMode, setInlineMode] = useState('view');
  const [newForm, setNewForm] = useState({ tcid: '', name: '', description: '', author: '', testType: '', overallResult: 'Not Run', prerequisites: '', priority: 'Medium', tags: [], testSteps: [] });
  const [editForm, setEditForm] = useState({ tcid: '', name: '', description: '', author: '', testType: '', overallResult: '', prerequisites: '', priority: 'Medium', tags: [], testSteps: [] });
  const [expandFolderId, setExpandFolderId] = useState(null);
  const [availableTags, setAvailableTags] = useState([
    { id: 'ui', name: 'UI', color: '#0ea5e9' },
    { id: 'api', name: 'API', color: '#10b981' },
    { id: 'regression', name: 'Regression', color: '#f59e0b' },
    { id: 'security', name: 'Security', color: '#ef4444' },
  ]);
  // Filters/Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterTestType, setFilterTestType] = useState('all');
  const [selectedTagFilterIds, setSelectedTagFilterIds] = useState([]);
  const [orgTypes, setOrgTypes] = useState([]);

  const resolveTags = (tagIds, tagsSnapshot = null) => {
    if (!Array.isArray(tagIds)) return [];
    if (tagsSnapshot && typeof tagsSnapshot === 'object') {
      return tagIds.map((id) => {
        const snap = tagsSnapshot[id];
        if (snap) return { id: snap.id || id, name: snap.name || id, color: snap.color || '#64748b' };
        return { id, name: id, color: '#64748b' };
      });
    }
    const map = new Map(availableTags.map(t => [t.id, t]));
    return tagIds.map(id => map.get(id) || { id, name: id, color: '#64748b' });
  };

  const buildTagsSnapshot = (tagIds) => {
    if (!Array.isArray(tagIds)) return {};
    const byId = new Map(availableTags.map(t => [t.id, t]));
    const snap = {};
    tagIds.forEach((id) => {
      const t = byId.get(id);
      snap[id] = { id, name: t?.name || id, color: t?.color || '#64748b' };
    });
    return snap;
  };

  const organizationId = currentOrganization?.id || currentUserData?.organisationId || '';

  useEffect(() => {
    let mounted = true;
    (async () => {
      const rows = await getProjects(organizationId, { includeInactive: false });
      const actives = Array.isArray(rows)
        ? rows.filter((p) => (p?.status === 'ACTIVE') || (p?.isActive === true))
        : [];
      if (mounted) setProjects(actives);
    })();
    return () => { mounted = false; };
  }, [getProjects, organizationId]);

  // Load organization tags for quick pick
  useEffect(() => {
    (async () => {
      if (!organizationId) return;
      try {
        const tags = await tagService.listOrgTags(organizationId);
        if (Array.isArray(tags) && tags.length > 0) setAvailableTags(tags);
      } catch (_) {}
    })();
  }, [organizationId]);

  const upsertGlobalTag = async (tag) => {
    try {
      const saved = await tagService.upsertOrgTag(organizationId, tag);
      setAvailableTags((prev) => {
        const map = new Map(prev.map(t => [t.id, t]));
        map.set(saved.id, { ...map.get(saved.id), ...saved });
        return Array.from(map.values());
      });
    } catch (_) {}
  };

  const softDeleteGlobalTag = async (tagId) => {
    try {
      await tagService.softDeleteOrgTag(organizationId, tagId);
      setAvailableTags((prev) => prev.filter(t => t.id !== tagId));
    } catch (_) {}
  };

  // Default author to current user name/email for new form
  useEffect(() => {
    const me = currentUserData?.name || currentUserData?.displayName || currentUserData?.email || '';
    setNewForm((p) => ({ ...p, author: p.author || me }));
  }, [currentUserData]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!organizationId) return;
      try {
        const rows = await testTypeService.getResolvedOrgTestTypes(organizationId);
        if (alive) setOrgTypes(rows);
      } catch (e) {
        // ignore
      }
    })();
    return () => { alive = false; };
  }, [organizationId]);

  const toggleFilterTag = (tagId) => {
    setSelectedTagFilterIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  // Clear inline test case window when search/filters change
  useEffect(() => {
    if (searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterTestType !== 'all' || (selectedTagFilterIds && selectedTagFilterIds.length > 0)) {
      setSelectedTestCase(null);
      setInlineMode('view');
    }
  }, [searchTerm, filterStatus, filterPriority, filterTestType, selectedTagFilterIds]);

  return (
    <div className="p-6">
      <TestCasesTop
        title="Test Cases"
        projects={projects}
        selectedProjectId={projectId}
        onChangeProject={(id) => setProjectId(id)}
        onClickNew={() => setShowNew(true)}
        exportData={[]}
        exportFilename="test-cases-export"
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterTestType={filterTestType}
        setFilterTestType={setFilterTestType}
        filterPriority={filterPriority}
        setFilterPriority={setFilterPriority}
        availableTags={availableTags}
        selectedTagIds={selectedTagFilterIds}
        onToggleTag={toggleFilterTag}
        orgTypes={orgTypes}
        onList={() => navigate('/test-cases', { state: { viewMode: 'list' }, replace: true })}
        onGrid={() => navigate('/test-cases', { state: { viewMode: 'grid' }, replace: true })}
        onFolder={() => {}}
        onAddGlobalTag={upsertGlobalTag}
        onDeleteGlobalTag={softDeleteGlobalTag}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-1">
          <TestCaseTree
            organizationId={organizationId}
            projectId={projectId}
            selectedFolderId={selectedFolder?.id || null}
            onSelectFolder={(f) => setSelectedFolder(f)}
            onSelectTestCase={(tc) => { setSelectedTestCase(tc); setInlineMode('view'); }}
            onOpenTestCase={(tc) => { setSelectedTestCase(tc); setEditForm({ ...editForm, ...tc }); setInlineMode('edit'); }}
            refreshKey={treeRefreshKey}
            reloadFolderId={expandFolderId}
            searchTerm={searchTerm}
            filterStatus={filterStatus}
            filterPriority={filterPriority}
            filterTestType={filterTestType}
            selectedTagIds={selectedTagFilterIds}
            organizationUsers={[]}
          />
        </div>
        <div className="card lg:col-span-2">
          <InlineTestCasePanel
            testCase={selectedTestCase}
            mode={inlineMode}
            onModeChange={setInlineMode}
            onSave={async (updates) => {
              try {
                if (!selectedTestCase?.id) return;
                await testCaseService.updateTestCase(organizationId, projectId, selectedTestCase.id, updates);
                setSelectedTestCase((prev) => (prev ? { ...prev, ...updates } : prev));
                setInlineMode('view');
                setTreeRefreshKey((k) => k + 1);
                push?.({ variant: 'success', message: 'Test case updated successfully' });
              } catch (err) {
                push?.({ variant: 'error', message: 'Failed to update test case' });
              }
            }}
            projectMembers={(() => {
              const project = projects.find(p => p.id === projectId);
              const members = project?.members || [];
              return members;
            })()}
            availableTags={availableTags}
          />
        </div>
      </div>

      <TestCaseNewModal
        open={showNew}
        form={newForm}
        onChange={(d) => setNewForm((p) => ({ ...p, ...d }))}
        onAddStep={() => setNewForm((p) => ({ ...p, testSteps: [...p.testSteps, { stepNumber: p.testSteps.length + 1, description: '', testData: '', expectedResult: '', actualResult: '', stepStatus: 'Not Run', notes: '' }] }))}
        onRemoveStep={(i) => setNewForm((p) => ({ ...p, testSteps: p.testSteps.filter((_, idx) => idx !== i).map((s, i2) => ({ ...s, stepNumber: i2 + 1 })) }))}
        onUpdateStep={(i, field, value) => setNewForm((p) => { const arr = [...p.testSteps]; arr[i] = { ...arr[i], [field]: value }; return { ...p, testSteps: arr }; })}
        onSubmit={async (form) => {
          try {
            if (!selectedFolder?.id) return;
            const me = currentUserData?.name || currentUserData?.displayName || currentUserData?.email || '';
            const makeTcid = (name) => {
              const base = (name || 'TC').toString().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 24);
              const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
              return `${base}-${rand}`;
            };
            const payload = {
              ...form,
              tcid: (form.tcid || '').trim() || makeTcid(form.name),
              author: form.author || me,
              folderId: selectedFolder.id,
              tags: Array.isArray(form.tags) ? form.tags : [],
              tags_snapshot: buildTagsSnapshot(Array.isArray(form.tags) ? form.tags : []),
            };
            await testCaseService.createTestCase(organizationId, projectId, payload);
            push({ variant: 'success', message: `Test Case <${payload.tcid}: ${payload.name}> was successfully added to the database` });
            setShowNew(false);
            setNewForm({ tcid: '', name: '', description: '', author: '', testType: '', overallResult: 'Not Run', prerequisites: '', priority: 'Medium', tags: [], testSteps: [] });
            setTreeRefreshKey((k) => k + 1);
          } catch (_) {
            push({ variant: 'error', message: 'Failed to create test case' });
          }
        }}
        onClose={() => setShowNew(false)}
        projectMembers={[]}
        onAddGlobalTag={upsertGlobalTag}
        onDeleteGlobalTag={softDeleteGlobalTag}
        availableTags={availableTags}
      />

      {/* Legacy modals disabled by inline panel for this screen */}


    </div>
  );
};

export default TestCasesFolder;


