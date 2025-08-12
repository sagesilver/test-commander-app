import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight,
  FileText,
  Edit,
  Trash2,
  Copy,
  Eye,
  X,
  Minus,
  Grid,
  List,
  Folder as FolderIcon,
  ArrowUp,
  ArrowDown,
  Circle,
  Download,
  BarChart3,
  ClipboardList,
  ListChecks,
  ListOrdered,
  Info
 } from 'lucide-react';
import TestCasesGrid from '../components/TestCasesGrid';
import TestCasesListView from '../components/testcases/TestCasesListView';
import TagPills from '../components/TagPills';
import TagMultiSelect from '../components/TagMultiSelect';
import ExportMenu from '../components/ExportMenu';
import TestCasesTop from '../components/testcases/TestCasesTop';
import TestTypeSelect from '../components/testcases/TestTypeSelect';
import TestCaseNewModal from '../components/testcases/TestCaseNewModal';
import TestCaseEditModal from '../components/testcases/TestCaseEditModal';
import TestCaseViewModal from '../components/testcases/TestCaseViewModal';
import { useAuth } from '../contexts/AuthContext';
import { testTypeService } from '../services/testTypeService';
import { useLocation, useNavigate } from 'react-router-dom';
import { testCaseService } from '../services/testCaseService';
import { useToast } from '../components/Toast';
import { projectsService } from '../services/projectsService';
import { tagService } from '../services/tagService';

const TestCases = () => {
  const { currentUserData, currentOrganization, getUsers } = useAuth();
  const { push } = useToast() || { push: () => {} };
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedNodes, setExpandedNodes] = useState(['project-1', 'function-1', 'function-2', 'subsystem-1', 'subsystem-2', 'subsystem-3']);
  const [showNewTestCaseModal, setShowNewTestCaseModal] = useState(false);
  const [showViewTestCaseModal, setShowViewTestCaseModal] = useState(false);
  const [showEditTestCaseModal, setShowEditTestCaseModal] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid' | 'folder'
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterTestType, setFilterTestType] = useState('all');
  const [availableTags, setAvailableTags] = useState([
    { id: 'ui', name: 'UI', color: '#0ea5e9' },
    { id: 'api', name: 'API', color: '#10b981' },
    { id: 'regression', name: 'Regression', color: '#f59e0b' },
    { id: 'security', name: 'Security', color: '#ef4444' },
  ]);
  const [selectedTagFilterIds, setSelectedTagFilterIds] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orgTypes, setOrgTypes] = useState([]);
  // Projects
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  // Organization users for Test Author dropdown
  const [organizationUsers, setOrganizationUsers] = useState([]);
  // List view refresh signal to reload visible nodes after saves
  const [listRefreshKey, setListRefreshKey] = useState(0);
  
  // Form state for new test case
  const [newTestCaseForm, setNewTestCaseForm] = useState({
    tcid: '',
    name: '',
    description: '',
    author: '',
    testType: '',
    testTypeCode: '',
    priority: 'Medium',
    overallResult: '',
    prerequisites: '',
    testSteps: [],
    tags: []
  });

  // Form state for editing test case
  const [editTestCaseForm, setEditTestCaseForm] = useState({});

  // Load test cases and projects from backend
  useEffect(() => {
    if (currentOrganization?.id && currentUserData) {
      loadTestCases();
      loadOrgTestTypes();
      loadProjects();
      loadOrganizationUsers();
    }
  }, [currentOrganization?.id, currentUserData]);

  // Respect navigation state (e.g., from Folder view)
  useEffect(() => {
    const desired = location?.state?.viewMode;
    if (desired === 'grid' || desired === 'list') {
      setViewMode(desired);
    }
  }, [location?.state]);

  // Update new test case form author when user data changes
  useEffect(() => {
    if (currentUserData) {
      setNewTestCaseForm(prev => ({
        ...prev,
        author: currentUserData?.name || currentUserData?.displayName || currentUserData?.email || ''
      }));
    }
  }, [currentUserData]);

  // Load organization tags
  useEffect(() => {
    // Load organization tags
    (async () => {
      if (!currentOrganization?.id) return;
      try {
        const tags = await tagService.listOrgTags(currentOrganization.id);
        if (Array.isArray(tags) && tags.length > 0) {
          setAvailableTags(tags);
        }
      } catch (_) {
        // fallback to defaults already set
      }
    })();
  }, [currentOrganization?.id]);

  const loadTestCases = async () => {
    try {
      setLoading(true);
      const data = await testCaseService.getAllTestCases(currentOrganization.id);
      setTestCases(data);
    } catch (error) {
      console.error('Error loading test cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrgTestTypes = async () => {
    try {
      const types = await testTypeService.getResolvedOrgTestTypes(currentOrganization.id);
      setOrgTypes(types);
    } catch (error) {
      console.error('Error loading test types:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const rows = await projectsService.getProjectsForUser(currentUserData, { organizationId: currentOrganization.id, includeInactive: false });
      const actives = Array.isArray(rows)
        ? rows.filter((p) => (p?.status === 'ACTIVE') || (p?.isActive === true))
        : [];
      setProjects(actives);
      if (actives.length === 1) {
        setSelectedProjectId(actives[0].id || actives[0].projectId);
      } else {
        setSelectedProjectId(null);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
      setSelectedProjectId(null);
    }
  };

  const loadOrganizationUsers = async () => {
    try {
      const users = await getUsers(currentOrganization.id);
      setOrganizationUsers(users);
    } catch (error) {
      console.error('Error loading organization users:', error);
    }
  };

  const priorityPill = (p) => {
    switch (p) {
      case 'High':
        return 'border text-red-800 bg-red-100 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30';
      case 'Medium':
        return 'border text-blue-800 bg-blue-100 border-blue-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-900/30';
      case 'Low':
        return 'border text-green-800 bg-green-100 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30';
      default:
        return 'border text-gray-800 bg-gray-100 border-gray-200 dark:bg-white/10 dark:text-menu dark:border-white/10';
    }
  };

  const resolveTags = (tagIds, snapshot = null) => {
    if (!Array.isArray(tagIds)) return [];
    if (snapshot && typeof snapshot === 'object') {
      return tagIds.map((id) => {
        const s = snapshot[id];
        if (s) return { id: s.id || id, name: s.name || id, color: s.color || '#64748b' };
        return { id, name: id, color: '#64748b' };
      });
    }
    const byId = new Map(availableTags.map(t => [t.id, t]));
    return tagIds.map((id) => byId.get(id) || { id, name: id, color: '#64748b' });
  };

  const addOrUpdateTag = (tag) => {
    setAvailableTags(prev => {
      const existing = prev.find(t => t.id === tag.id);
      if (existing) {
        return prev.map(t => t.id === tag.id ? tag : t);
      }
      return [...prev, tag];
    });
  };

  const toggleFilterTag = (tagId) => {
    setSelectedTagFilterIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleViewTestCase = (testCase) => {
    setSelectedTestCase(testCase);
    setShowViewTestCaseModal(true);
  };

  const handleEditTestCase = (testCase) => {
    setSelectedTestCase(testCase);
    setEditTestCaseForm({
      ...testCase,
      testSteps: testCase.testSteps || []
    });
    setShowEditTestCaseModal(true);
  };

  const handleDuplicateTestCase = (testCase) => {
    const duplicatedTestCase = {
      ...testCase,
      tcid: `${testCase.tcid}-COPY`,
      name: `${testCase.name} (Copy)`,
      overallResult: '',
      testSteps: testCase.testSteps.map(step => ({ ...step, result: '' }))
    };
    setNewTestCaseForm(duplicatedTestCase);
    setShowNewTestCaseModal(true);
  };

  const handleDeleteTestCase = async (testCase) => {
    if (window.confirm(`Are you sure you want to delete test case "${testCase.name}"?`)) {
      try {
        if (!testCase.projectId) {
          window.alert('Unable to delete: missing project reference on this test case.');
          return;
        }
        await testCaseService.deleteTestCase(currentOrganization.id, testCase.projectId, testCase.id);
        await loadTestCases();
      } catch (error) {
        console.error('Error deleting test case:', error);
      }
    }
  };

  const handleBulkEdit = (selectedTestCases) => {
    // Implement bulk edit functionality
    console.log('Bulk edit:', selectedTestCases);
  };

  const handleBulkDelete = async (selectedTestCases) => {
    if (window.confirm(`Are you sure you want to delete ${selectedTestCases.length} test cases?`)) {
      try {
        await Promise.all(selectedTestCases.map(tc => {
          if (!tc.projectId) {
            return Promise.resolve();
          }
          return testCaseService.deleteTestCase(currentOrganization.id, tc.projectId, tc.id);
        }));
        await loadTestCases();
      } catch (error) {
        console.error('Error bulk deleting test cases:', error);
      }
    }
  };

  const buildTagsSnapshot = (tagIds) => {
    if (!Array.isArray(tagIds)) return {};
    const byId = new Map(availableTags.map(t => [t.id, t]));
    const snapshot = {};
    tagIds.forEach((id) => {
      const t = byId.get(id);
      snapshot[id] = {
        id,
        name: t?.name || id,
        color: t?.color || '#64748b',
      };
    });
    return snapshot;
  };

  const handleNewTestCaseSubmit = async (formData) => {
    try {
      if (!selectedProjectId) {
        window.alert('Cannot create test case. No project is selected. Ask your Organization Admin or Project Manager to create a project and assign you.');
        return;
      }
      const makeTcid = (name) => {
        const base = (name || 'TC').toString().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 24);
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `${base}-${rand}`;
      };
      const payload = {
        ...formData,
        tcid: (formData?.tcid || '').trim() || makeTcid(formData?.name),
        author: currentUserData?.name || currentUserData?.displayName || currentUserData?.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: Array.isArray(formData.tags) ? formData.tags : [],
        tags_snapshot: buildTagsSnapshot(Array.isArray(formData.tags) ? formData.tags : []),
      };
      await testCaseService.createTestCase(currentOrganization.id, selectedProjectId, payload);
      push({ variant: 'success', message: `Test Case <${payload.tcid}: ${payload.name}> was successfully added to the database` });
      setShowNewTestCaseModal(false);
      setNewTestCaseForm({
        tcid: '',
        name: '',
        description: '',
        author: currentUserData?.name || currentUserData?.displayName || currentUserData?.email || '',
        testType: '',
        testTypeCode: '',
        priority: 'Medium',
        overallResult: '',
        prerequisites: '',
        testSteps: [],
        tags: []
      });
      await loadTestCases();
    } catch (error) {
      console.error('Error creating test case:', error);
    }
  };

  // Shared saver for consistent updates across views
  const saveTestCaseUpdates = async ({ id, projectId, updates }) => {
    if (!id || !projectId) {
      window.alert('Cannot update test case. Missing identifiers.');
      return false;
    }
    try {
      // Ensure snapshot accompanies tag changes
      const tags = Array.isArray(updates?.tags) ? updates.tags : undefined;
      const withSnapshot = typeof tags !== 'undefined'
        ? { ...updates, tags_snapshot: buildTagsSnapshot(tags) }
        : updates;

      await testCaseService.updateTestCase(currentOrganization.id, projectId, id, {
        ...withSnapshot,
        updatedAt: new Date().toISOString(),
      });
      // Optimistic local update: list/grid
      setTestCases((prev) => (Array.isArray(prev)
        ? prev.map(tc => tc.id === id ? { ...tc, ...withSnapshot } : tc)
        : prev));
      // Keep selected copy in sync if open elsewhere
      setSelectedTestCase((prev) => (prev && prev.id === id ? { ...prev, ...withSnapshot } : prev));
      // Merge any newly used tag ids into availableTags so they render immediately
      if (Array.isArray(withSnapshot?.tags) && withSnapshot.tags.length > 0) {
        setAvailableTags((prev) => {
          const seen = new Set(prev.map(t => t.id));
          const additions = withSnapshot.tags
            .filter(id => !seen.has(id))
            .map(id => ({ id, name: id, color: '#64748b' }));
          return additions.length > 0 ? [...prev, ...additions] : prev;
        });
      }
      push({ variant: 'success', message: 'Test case updated successfully' });
      // Notify list view to reload expanded rows without full page refresh
      setListRefreshKey((k) => k + 1);
      return true;
    } catch (error) {
      console.error('Error updating test case:', error);
      push({ variant: 'error', message: 'Failed to update test case' });
      return false;
    }
  };

  const handleEditTestCaseSubmit = async (formData) => {
    try {
      if (!selectedTestCase?.projectId) {
        window.alert('Cannot update test case. Missing project reference.');
        return;
      }
      const ok = await saveTestCaseUpdates({
        id: selectedTestCase.id,
        projectId: selectedTestCase.projectId,
        updates: {
          // Ensure arrays/strings are well-formed
          name: formData.name,
          description: formData.description || '',
          author: formData.author || '',
          testType: formData.testType || '',
          testTypeCode: formData.testTypeCode || '',
          priority: formData.priority || 'Medium',
          prerequisites: formData.prerequisites || '',
          tags: Array.isArray(formData.tags) ? formData.tags : [],
          testSteps: Array.isArray(formData.testSteps) ? formData.testSteps : [],
        }
      });
      if (!ok) return;
      setShowEditTestCaseModal(false);
      setSelectedTestCase(null);
      setEditTestCaseForm({});
      // No hard reload required, but keep data fresh
      // await loadTestCases(); // optional; optimistic update already applied
    } catch (error) {
      console.error('Error updating test case:', error);
      push({ variant: 'error', message: 'Failed to update test case' });
    }
  };

  // Form handlers for new test case
  const handleNewTestCaseChange = (updates) => {
    setNewTestCaseForm(prev => ({ ...prev, ...updates }));
  };

  const handleNewTestCaseAddStep = () => {
    const newStep = {
      stepNumber: (newTestCaseForm.testSteps.length + 1),
      description: '',
      testData: '',
      expectedResult: '',
      stepStatus: 'Not Run',
      notes: ''
    };
    setNewTestCaseForm(prev => ({
      ...prev,
      testSteps: [...prev.testSteps, newStep]
    }));
  };

  const handleNewTestCaseRemoveStep = (index) => {
    setNewTestCaseForm(prev => ({
      ...prev,
      testSteps: prev.testSteps.filter((_, i) => i !== index).map((step, i) => ({
        ...step,
        stepNumber: i + 1
      }))
    }));
  };

  const handleNewTestCaseUpdateStep = (index, field, value) => {
    setNewTestCaseForm(prev => ({
      ...prev,
      testSteps: prev.testSteps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  // Form handlers for edit test case
  const handleEditTestCaseChange = (updates) => {
    setEditTestCaseForm(prev => ({ ...prev, ...updates }));
  };

  const handleEditTestCaseAddStep = () => {
    const newStep = {
      stepNumber: (editTestCaseForm.testSteps.length + 1),
      description: '',
      testData: '',
      expectedResult: '',
      stepStatus: 'Not Run',
      notes: ''
    };
    setEditTestCaseForm(prev => ({
      ...prev,
      testSteps: [...prev.testSteps, newStep]
    }));
  };

  const handleEditTestCaseRemoveStep = (index) => {
    setEditTestCaseForm(prev => ({
      ...prev,
      testSteps: prev.testSteps.filter((_, i) => i !== index).map((step, i) => ({
        ...step,
        stepNumber: i + 1
      }))
    }));
  };

  const handleEditTestCaseUpdateStep = (index, field, value) => {
    setEditTestCaseForm(prev => ({
      ...prev,
      testSteps: prev.testSteps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => 
      prev.includes(nodeId) 
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  const renderNode = (node, level = 0) => {
    const isExpanded = expandedNodes.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isProject = node.type === 'project';
    const isFunction = node.type === 'function';
    const isSubsystem = node.type === 'subsystem';

    return (
      <div key={node.id} className="mb-1">
        <div 
          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors border border-subtle`}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren && (
            <button className="p-1 hover:bg-white/10 rounded text-menu hover:text-foreground">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          
          <div className="flex items-center gap-2 flex-1">
            {isProject && <FolderIcon className="h-5 w-5 text-blue-600" />}
            {isFunction && <ListChecks className="h-5 w-5 text-green-600" />}
            {isSubsystem && <ListOrdered className="h-5 w-5 text-yellow-600" />}
            
            <span className={`font-medium text-foreground`}>
              {node.name}
            </span>
            
            {isSubsystem && node.testCases && (
              <span className="text-sm text-menu">
                ({node.testCases.length} test cases)
              </span>
            )}
          </div>

          {isSubsystem && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (projects.length === 0) {
                  window.alert('Cannot create test case. No projects exist for this organization. Ask your Organization Admin or Project Manager to create a project.');
                  return;
                }
                if (!selectedProjectId) {
                  window.alert('Select a project first to create a test case.');
                  return;
                }
                setShowNewTestCaseModal(true);
              }}
              className="p-2 hover:bg-white/10 rounded-lg text-[rgb(var(--tc-icon))] hover:brightness-110 transition-colors"
              title="Add Test Case"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="ml-6 border-l border-subtle pl-4">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}

        {isSubsystem && node.testCases && (
          <div className="ml-6 mt-2 space-y-2">
            {node.testCases.map(testCase => (
              <div
                key={testCase.id}
                className="flex items-center justify-between p-3 bg-card border border-subtle rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-menu" />
                    <span className="font-medium text-foreground">{testCase.tcid}</span>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{testCase.name}</h4>
                     <p className="text-sm text-muted line-clamp-1">{(() => { const d=document.createElement('div'); d.innerHTML=testCase.description||''; return d.textContent||d.innerText||'';})()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${priorityPill(testCase.priority)}`}>
                    {testCase.priority}
                  </span>
                  
                  {testCase.tags && testCase.tags.length > 0 && (
                    <div className="flex gap-1">
                      {resolveTags(testCase.tags, testCase.tags_snapshot).slice(0, 2).map(tag => (
                        <span
                          key={tag.id}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tag.color }}
                          title={tag.name}
                        />
                      ))}
                      {testCase.tags.length > 2 && (
                        <span className="text-xs text-menu">+{testCase.tags.length - 2}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleViewTestCase(testCase)}
                      className="p-1 hover:bg-white/10 rounded text-menu hover:text-foreground"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditTestCase(testCase)}
                      className="p-1 hover:bg-white/10 rounded text-menu hover:text-foreground"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicateTestCase(testCase)}
                      className="p-1 hover:bg-white/10 rounded text-menu hover:text-foreground"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTestCase(testCase)}
                      className="p-1 hover:bg-white/10 rounded text-menu hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const getFilteredTestCases = () => {
    let filtered = testCases;
    
    // Search filter
    if (searchTerm) {
      const sanitize = (html) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html || '';
        return (tmp.textContent || tmp.innerText || '').toLowerCase();
      };
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(tc => {
        const desc = sanitize(tc.description);
        return (
          tc.name.toLowerCase().includes(q) ||
          tc.tcid.toLowerCase().includes(q) ||
          desc.includes(q) ||
          tc.author.toLowerCase().includes(q)
        );
      });
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(tc => tc.overallResult === filterStatus);
    }
    
    // Test type filter
    if (filterTestType !== 'all') {
      filtered = filtered.filter(tc => tc.testType === filterTestType);
    }
    
    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(tc => tc.priority === filterPriority);
    }

    // Tag filter
    if (selectedTagFilterIds.length > 0) {
      const selectedSet = new Set(selectedTagFilterIds);
      filtered = filtered.filter(tc => 
        Array.isArray(tc.tags) && tc.tags.some(id => selectedSet.has(id))
      );
    }
    
    return filtered;
  };

  const filteredTestCases = getFilteredTestCases();

  const upsertGlobalTag = async (tag) => {
    if (!tag || !currentOrganization?.id) return;
    try {
      const saved = await tagService.upsertOrgTag(currentOrganization.id, tag);
      setAvailableTags((prev) => {
        const map = new Map(prev.map(t => [t.id, t]));
        map.set(saved.id, { ...map.get(saved.id), ...saved });
        return Array.from(map.values());
      });
    } catch (e) {
      console.error('Failed to upsert tag', e);
    }
  };

  const softDeleteGlobalTag = async (tagId) => {
    if (!tagId || !currentOrganization?.id) return;
    try {
      await tagService.softDeleteOrgTag(currentOrganization.id, tagId);
      // Remove from available list used by selectors
      setAvailableTags((prev) => prev.filter(t => t.id !== tagId));
      // No need to change existing test cases (snapshot fallback later if needed)
    } catch (e) {
      console.error('Failed to delete tag', e);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <TestCasesTop
          title="Test Cases"
          projects={projects}
          selectedProjectId={selectedProjectId}
          onChangeProject={(id) => setSelectedProjectId(id)}
          onClickNew={() => {
            if (projects.length === 0) {
              window.alert('Cannot create test case. No projects exist for this organization. Ask your Organization Admin or Project Manager to create a project and assign you.');
              return;
            }
            if (!selectedProjectId) {
              window.alert('Select a project first to create a test case.');
              return;
            }
            setShowNewTestCaseModal(true);
          }}
          exportData={filteredTestCases}
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
          onList={() => setViewMode('list')}
          onGrid={() => setViewMode('grid')}
          onFolder={() => navigate('/test-cases-folder', { state: { viewMode: 'folder' }, replace: true })}
          onAddGlobalTag={upsertGlobalTag}
          onDeleteGlobalTag={softDeleteGlobalTag}
        />

        {/* Content */}
        <div className="bg-card rounded-lg shadow-card border border-subtle">
          {viewMode === 'list' ? (
            <TestCasesListView
              organizationId={currentOrganization.id}
              projects={projects}
              selectedProjectId={selectedProjectId}
              refreshKey={listRefreshKey}
              searchTerm={searchTerm}
              filterStatus={filterStatus}
              filterPriority={filterPriority}
              filterTestType={filterTestType}
              selectedTagIds={selectedTagFilterIds}
              resolveTags={resolveTags}
              onViewTestCase={handleViewTestCase}
              onEditTestCase={handleEditTestCase}
              onDuplicateTestCase={handleDuplicateTestCase}
              onDeleteTestCase={handleDeleteTestCase}
              organizationUsers={organizationUsers}
            />
          ) : (
            <TestCasesGrid
              testCases={filteredTestCases}
              onViewTestCase={handleViewTestCase}
              onEditTestCase={handleEditTestCase}
              onDeleteTestCase={handleDeleteTestCase}
              onDuplicateTestCase={handleDuplicateTestCase}
              onBulkEdit={handleBulkEdit}
              onBulkDelete={handleBulkDelete}
              resolveTags={resolveTags}
              onFilterByTag={(id) => toggleFilterTag(id)}
              organizationUsers={organizationUsers}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showNewTestCaseModal && (
        <TestCaseNewModal
          open={showNewTestCaseModal}
          form={newTestCaseForm}
          onChange={handleNewTestCaseChange}
          onAddStep={handleNewTestCaseAddStep}
          onRemoveStep={handleNewTestCaseRemoveStep}
          onUpdateStep={handleNewTestCaseUpdateStep}
          onSubmit={handleNewTestCaseSubmit}
          onClose={() => setShowNewTestCaseModal(false)}
          projectMembers={organizationUsers}
          onAddGlobalTag={upsertGlobalTag}
          onDeleteGlobalTag={softDeleteGlobalTag}
          availableTags={availableTags}
        />
      )}

      {showEditTestCaseModal && selectedTestCase && (
        <TestCaseEditModal
          open={showEditTestCaseModal}
          form={editTestCaseForm}
          onChange={handleEditTestCaseChange}
          onAddStep={handleEditTestCaseAddStep}
          onRemoveStep={handleEditTestCaseRemoveStep}
          onUpdateStep={handleEditTestCaseUpdateStep}
          onSubmit={handleEditTestCaseSubmit}
          onClose={() => {
            setShowEditTestCaseModal(false);
            setSelectedTestCase(null);
            setEditTestCaseForm({});
          }}
          projectMembers={organizationUsers}
          onAddGlobalTag={upsertGlobalTag}
          onDeleteGlobalTag={softDeleteGlobalTag}
          availableTags={availableTags}
        />
      )}

      {showViewTestCaseModal && selectedTestCase && (
        <TestCaseViewModal
          open={showViewTestCaseModal}
          testCase={selectedTestCase}
          onClose={() => {
            setShowViewTestCaseModal(false);
            setSelectedTestCase(null);
          }}
          onEdit={() => {
            setShowViewTestCaseModal(false);
            setShowEditTestCaseModal(true);
          }}
          resolveTags={resolveTags}
          organizationUsers={organizationUsers}
        />
      )}
    </div>
  );
};

export default TestCases;
