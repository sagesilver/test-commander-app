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

const TestCasesFolder = () => {
  const { currentUserData, currentOrganization, getProjects, getUsers } = useAuth();
  const { push } = useToast() || { push: () => {} };
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [organizationUsers, setOrganizationUsers] = useState([]);

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

  // Fetch all active users for the organization
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!organizationId) return;
      try {
        const users = await getUsers(organizationId);
        // Filter to only active users
        const activeUsers = users.filter(user => user.isActive !== false);
        if (mounted) {
          setOrganizationUsers(activeUsers);
          console.log('TestCasesFolder: Loaded organization users:', { 
            organizationId, 
            totalUsers: users.length, 
            activeUsers: activeUsers.length,
            users: activeUsers.map(u => ({ id: u.id, name: u.name, email: u.email, isActive: u.isActive }))
          });
        }
      } catch (error) {
        console.error('Error loading organization users:', error);
        if (mounted) setOrganizationUsers([]);
      }
    })();
    return () => { mounted = false; };
  }, [getUsers, organizationId]);

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
                  if (parentId) setExpandFolderId(parentId);
                  else setExpandFolderId(null);
                  setTreeRefreshKey((k) => k + 1);
                  push({ variant: 'success', message: `Folder "${name}" was successfully created` });
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
                  setExpandFolderId(null);
                  setTreeRefreshKey((k) => k + 1);
                  push({ variant: 'success', message: `Folder "${name}" was successfully created` });
                }}
              >
                <FolderIcon className="w-4 h-4" />
                <span>Add Root Folder</span>
              </button>
              {(() => {
                const isAdmin = Array.isArray(currentUserData?.roles) && (currentUserData.roles.includes('APP_ADMIN') || currentUserData.roles.includes('ORG_ADMIN'));
                if (!isAdmin || !selectedFolder?.id) return null;
                return (
                  <button
                    className="text-xs flex items-center gap-2 px-3 py-2 rounded-lg border border-subtle text-red-400 hover:bg-white/10"
                    title="Delete Folder"
                    onClick={async () => {
                      if (!selectedFolder?.id) return;
                      if (!window.confirm(`Delete folder "${selectedFolder?.name}"?`)) return;
                      try {
                        const [childFolders, childTests] = await Promise.all([
                          folderService.listChildren(organizationId, projectId, selectedFolder.id),
                          testCaseService.listTestCasesByFolder(organizationId, projectId, selectedFolder.id),
                        ]);
                        if ((childFolders?.length || 0) > 0 || (childTests?.length || 0) > 0) {
                          push({ variant: 'error', message: 'Cannot delete a non-empty folder. Move or delete its contents first.' });
                          return;
                        }
                        await folderService.deleteFolder(organizationId, projectId, selectedFolder.id);
                        push({ variant: 'success', message: `Folder "${selectedFolder?.name}" was successfully deleted` });
                        setSelectedFolder(null);
                        setTreeRefreshKey((k) => k + 1);
                      } catch (err) {
                        console.error('Folder delete failed', err);
                        push({ variant: 'error', message: 'Failed to delete folder. You may not have permission.' });
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Folder</span>
                  </button>
                );
              })()}
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
                reloadFolderId={expandFolderId}
                searchTerm={searchTerm}
                filterStatus={filterStatus}
                filterPriority={filterPriority}
                filterTestType={filterTestType}
                selectedTagIds={selectedTagFilterIds}
                organizationUsers={organizationUsers}
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
                    // Reflect changes in UI immediately
                    setSelectedTestCase((prev) => (prev ? { ...prev, ...updates } : prev));
                    setInlineMode('view');
                    setTreeRefreshKey((k) => k + 1);
                    push?.({ variant: 'success', message: 'Test case updated successfully' });
                  } catch (err) {
                    console.error('Inline update failed', err);
                    push?.({ variant: 'error', message: 'Failed to update test case' });
                  }
                }}
                projectMembers={organizationUsers}
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
          const me = currentUserData?.name || currentUserData?.displayName || currentUserData?.email || '';
          const makeTcid = (name) => {
            const base = (name || 'TC').toString().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 24);
            const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
            return `${base}-${rand}`;
          };
          const payload = {
            ...newForm,
            tcid: (newForm.tcid || '').trim() || makeTcid(newForm.name),
            author: newForm.author || me,
            folderId: selectedFolder.id,
          };
          await testCaseService.createTestCase(organizationId, projectId, payload);
          push({ variant: 'success', message: `Test Case <${payload.tcid}: ${payload.name}> was successfully added to the database` });
          setShowNew(false);
          setNewForm({ tcid: '', name: '', description: '', author: '', testType: '', overallResult: 'Not Run', prerequisites: '', priority: 'Medium', tags: [], testSteps: [] });
          setTreeRefreshKey((k) => k + 1);
        }}
        onClose={() => setShowNew(false)}
        projectMembers={organizationUsers}
      />

      {/* Legacy modals disabled by inline panel for this screen */}


    </div>
  );
};

export default TestCasesFolder;


