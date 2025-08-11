import React, { useEffect, useState } from 'react';
import { Plus, FolderPlus, List, Grid, Folder as FolderIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { folderService } from '../services/folderService';
import { testCaseService } from '../services/testCaseService';

import { useNavigate } from 'react-router-dom';
import TestCaseNewModal from '../components/testcases/TestCaseNewModal';
import TestCaseEditModal from '../components/testcases/TestCaseEditModal';
import TestCaseViewModal from '../components/testcases/TestCaseViewModal';
import InlineTestCasePanel from '../components/testcases/InlineTestCasePanel';
import TestCaseTree from '../components/testcases/TestCaseTree';
import TestCasesTop from '../components/testcases/TestCasesTop';
import { testTypeService } from '../services/testTypeService';

const TestCasesFolder = () => {
  const { currentUserData, currentOrganization, getProjects } = useAuth();
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
  const [availableTags] = useState([
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

  const resolveTags = (tagIds) => {
    if (!Array.isArray(tagIds)) return [];
    const map = new Map(availableTags.map(t => [t.id, t]));
    return tagIds.map(id => map.get(id)).filter(Boolean);
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



  return (
    <div className="space-y-6">
      <TestCasesTop
        title="Test Cases"
        projects={projects}
        selectedProjectId={projectId}
        onChangeProject={(id) => { setProjectId(id || ''); setSelectedFolder(null); }}
        onClickNew={() => setShowNew(true)}
        newDisabled={!selectedFolder}
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
      />

      {!projectId ? (
        <div className="text-menu">Choose a project to begin.</div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 justify-between">
            <h3 className="text-lg font-semibold text-foreground">Folders & Test Cases</h3>
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
                searchTerm={searchTerm}
                filterStatus={filterStatus}
                filterPriority={filterPriority}
                filterTestType={filterTestType}
                selectedTagIds={selectedTagFilterIds}
              />
            </div>
            <div className="card lg:col-span-2">
              <InlineTestCasePanel
                testCase={selectedTestCase}
                mode={inlineMode}
                onModeChange={setInlineMode}
                onSave={async (updates) => {
                  if (!selectedTestCase?.id) return;
                  await testCaseService.updateTestCase(organizationId, projectId, selectedTestCase.id, updates);
                  setInlineMode('view');
                  setTreeRefreshKey((k) => k + 1);
                }}
              />
            </div>
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
          setTreeRefreshKey((k) => k + 1);
        }}
        onClose={() => setShowNew(false)}
      />

      {/* Legacy modals disabled by inline panel for this screen */}


    </div>
  );
};

export default TestCasesFolder;


