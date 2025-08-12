import React, { useEffect, useState } from 'react';
import { Plus, FolderPlus, List, Grid, Folder as FolderIcon, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';
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
  const [showInlinePanel, setShowInlinePanel] = useState(false);
  const [newForm, setNewForm] = useState({ tcid: '', name: '', description: '', author: '', testType: '', overallResult: 'Not Run', prerequisites: '', priority: 'Medium', tags: [], testSteps: [] });
  const [editForm, setEditForm] = useState({ tcid: '', name: '', description: '', author: '', testType: '', overallResult: '', prerequisites: '', priority: 'Medium', tags: [], testSteps: [] });
  const [expandFolderId, setExpandFolderId] = useState(null);
  const [expandKey, setExpandKey] = useState(0);
  const [expandOnSelect, setExpandOnSelect] = useState(false);
  const [expandAllKey, setExpandAllKey] = useState(0);
  const [collapseAllKey, setCollapseAllKey] = useState(0);
  
  // Filters/Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterTestType, setFilterTestType] = useState('all');
  
  const [orgTypes, setOrgTypes] = useState([]);

  

  

  const organizationId = currentOrganization?.id || currentUserData?.organisationId || '';

  useEffect(() => {
    let mounted = true;
    (async () => {
      const rows = await getProjects(organizationId, { includeInactive: false });
      const actives = Array.isArray(rows)
        ? rows.filter((p) => (p?.status === 'ACTIVE') || (p?.isActive === true))
        : [];
      if (mounted) setProjects(actives);
      // Default: no specific project selected -> show all roots; hide inline panel
      if (mounted) setShowInlinePanel(false);
      if (mounted) setProjectId('');
    })();
    return () => { mounted = false; };
  }, [getProjects, organizationId]);

  // Tags removed

  

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

  

  // Clear inline test case window when search/filters change
  useEffect(() => {
    if (searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterTestType !== 'all') {
      setSelectedTestCase(null);
      setInlineMode('view');
    }
  }, [searchTerm, filterStatus, filterPriority, filterTestType]);

  return (
    <div className="p-6">
      {/* Global toggle to expand details when hidden */}
      {!showInlinePanel && (
        <div className="relative">
          <button
            className="absolute right-0 -mt-2 mb-2 p-1 rounded hover:bg-white/10 text-menu hover:text-foreground"
            title="Show details"
            onClick={() => setShowInlinePanel(true)}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
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
        
        orgTypes={orgTypes}
        onList={() => navigate('/test-cases', { state: { viewMode: 'list' }, replace: true })}
        onGrid={() => navigate('/test-cases', { state: { viewMode: 'grid' }, replace: true })}
        onFolder={() => {}}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`card relative pt-12 ${showInlinePanel ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
          {/* Header controls: Add Root, Add Folder, Expand toggle */}
          <div className="absolute top-2 right-2 flex items-center gap-3">
            {/* Add Root / Add Folder */}
            <button
              className="px-3 py-1.5 text-sm rounded-md bg-white/10 hover:bg-white/20 border border-subtle disabled:opacity-50 inline-flex items-center gap-2"
              title="Add Root Folder"
              disabled={!(projectId || selectedFolder?.projectId)}
              onClick={async () => {
                const name = (window.prompt('Create root folder name') || '').trim();
                if (!name) return;
                try {
                  const targetProjectId = selectedFolder?.projectId || projectId;
                  await folderService.createFolder(organizationId, targetProjectId, { name, parentFolderId: null });
                  setTreeRefreshKey((k) => k + 1);
                } catch (_) {}
              }}
            >
              <FolderIcon className="w-4 h-4 text-[rgb(var(--tc-icon))]" />
              <span>Add Root</span>
            </button>
            <button
              className="px-3 py-1.5 text-sm rounded-md bg-white/10 hover:bg-white/20 border border-subtle disabled:opacity-50 inline-flex items-center gap-2"
              title="Add Subfolder"
              disabled={!selectedFolder?.id}
              onClick={async () => {
                const name = (window.prompt('Create subfolder name') || '').trim();
                if (!name) return;
                try {
                  const targetProjectId = selectedFolder?.projectId || projectId;
                  await folderService.createFolder(organizationId, targetProjectId, { name, parentFolderId: selectedFolder.id });
                  setExpandFolderId(selectedFolder.id);
                  setTreeRefreshKey((k) => k + 1);
                } catch (_) {}
              }}
            >
              <FolderPlus className="w-4 h-4 text-[rgb(var(--tc-icon))]" />
              <span>Add Folder</span>
            </button>
            <label className="flex items-center select-none" title="Expand or collapse all projects and folders">
              <input
                type="checkbox"
                className="sr-only"
                checked={expandOnSelect}
                onChange={(e) => {
                  const on = e.target.checked;
                  setExpandOnSelect(on);
                  if (on) setExpandAllKey((k) => k + 1);
                  else setCollapseAllKey((k) => k + 1);
                }}
              />
              <span className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${expandOnSelect ? 'bg-green-600' : 'bg-white/10 border border-subtle'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${expandOnSelect ? 'translate-x-6' : 'translate-x-1'}`}></span>
              </span>
              <span className="ml-2 text-sm text-menu">Expand</span>
            </label>
          </div>
          {projectId ? (
            <TestCaseTree
              organizationId={organizationId}
              projectId={projectId}
              selectedFolderId={selectedFolder?.id || null}
              onSelectFolder={(f) => { setSelectedFolder(f); if (expandOnSelect && f?.id) setExpandKey((k) => k + 1); }}
              onSelectTestCase={(tc) => { setSelectedTestCase(tc); setInlineMode('view'); setShowInlinePanel(true); }}
              onOpenTestCase={(tc) => { setSelectedTestCase(tc); setEditForm({ ...editForm, ...tc }); setInlineMode('edit'); setShowInlinePanel(true); }}
              refreshKey={treeRefreshKey}
              reloadFolderId={expandFolderId}
              expandTargetFolderId={selectedFolder?.id || null}
              expandRequestKey={expandKey}
              expandAllKey={expandAllKey}
              collapseAllKey={collapseAllKey}
              inlinePanelOpen={showInlinePanel}
              enableDragDrop={false}
              searchTerm={searchTerm}
              filterStatus={filterStatus}
              filterPriority={filterPriority}
              filterTestType={filterTestType}
              selectedTagIds={[]}
              organizationUsers={[]}
            />
          ) : (
            <div className="space-y-4">
              {projects.map((p) => (
                <div key={p.id || p.projectId}>
                  {/* Removed project label line per request */}
                  <TestCaseTree
                    organizationId={organizationId}
                    projectId={p.id || p.projectId}
                    selectedFolderId={null}
                    onSelectFolder={(f) => { setSelectedFolder(f); if (expandOnSelect && f?.id) setExpandKey((k) => k + 1); }}
                    onSelectTestCase={(tc) => { setSelectedTestCase(tc); setInlineMode('view'); setShowInlinePanel(true); }}
                    onOpenTestCase={(tc) => { setSelectedTestCase(tc); setEditForm({ ...editForm, ...tc }); setInlineMode('edit'); setShowInlinePanel(true); }}
                    refreshKey={treeRefreshKey}
                    reloadFolderId={expandFolderId}
                    expandTargetFolderId={selectedFolder?.id || null}
                    expandRequestKey={expandKey}
                    expandAllKey={expandAllKey}
                    collapseAllKey={collapseAllKey}
                    inlinePanelOpen={showInlinePanel}
                    enableDragDrop={false}
                    searchTerm={searchTerm}
                    filterStatus={filterStatus}
                    filterPriority={filterPriority}
                    filterTestType={filterTestType}
                    selectedTagIds={[]}
                    organizationUsers={[]}
                  />
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-menu">No projects to display.</div>
              )}
            </div>
          )}
        </div>
        {showInlinePanel && (
          <div className="card lg:col-span-2 relative">
            <button
              className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 text-menu hover:text-foreground"
              title="Close details"
              onClick={() => setShowInlinePanel(false)}
            >
              <X className="w-4 h-4" />
            </button>
            <InlineTestCasePanel
              testCase={selectedTestCase}
              mode={inlineMode}
              onModeChange={setInlineMode}
              onSave={async (updates) => {
                try {
                if (!selectedTestCase?.id) return;
                const targetProjectId = selectedTestCase?.projectId || selectedFolder?.projectId || projectId;
                await testCaseService.updateTestCase(organizationId, targetProjectId, selectedTestCase.id, updates);
                  setSelectedTestCase((prev) => (prev ? { ...prev, ...updates } : prev));
                  setInlineMode('view');
                  setTreeRefreshKey((k) => k + 1);
                  push?.({ variant: 'success', message: 'Test case updated successfully' });
                } catch (err) {
                  push?.({ variant: 'error', message: 'Failed to update test case' });
                }
              }}
              projectMembers={(() => {
              const effectiveProjectId = selectedTestCase?.projectId || selectedFolder?.projectId || projectId;
              const project = projects.find(p => p.id === effectiveProjectId);
                const members = project?.members || [];
                return members;
              })()}
            />
          </div>
        )}
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
              
            };
            const targetProjectId = selectedFolder?.projectId || projectId;
            await testCaseService.createTestCase(organizationId, targetProjectId, payload);
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
        
      />

      {/* Legacy modals disabled by inline panel for this screen */}


    </div>
  );
};

export default TestCasesFolder;


