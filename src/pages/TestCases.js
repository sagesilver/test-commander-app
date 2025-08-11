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
import { projectsService } from '../services/projectsService';

const TestCases = () => {
  const { currentUserData, currentOrganization } = useAuth();
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
        author: currentUserData?.displayName || currentUserData?.email || ''
      }));
    }
  }, [currentUserData]);

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

  const resolveTags = (tagIds) => {
    if (!Array.isArray(tagIds)) return [];
    return availableTags.filter(tag => tagIds.includes(tag.id));
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

  const handleNewTestCaseSubmit = async (formData) => {
    try {
      if (!selectedProjectId) {
        window.alert('Cannot create test case. No project is selected. Ask your Organization Admin or Project Manager to create a project and assign you.');
        return;
      }
      await testCaseService.createTestCase(currentOrganization.id, selectedProjectId, {
        ...formData,
        author: currentUserData?.displayName || currentUserData?.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setShowNewTestCaseModal(false);
      setNewTestCaseForm({
        tcid: '',
        name: '',
        description: '',
        author: currentUserData?.displayName || currentUserData?.email || '',
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

  const handleEditTestCaseSubmit = async (formData) => {
    try {
      if (!selectedTestCase?.projectId) {
        window.alert('Cannot update test case. Missing project reference.');
        return;
      }
      await testCaseService.updateTestCase(currentOrganization.id, selectedTestCase.projectId, selectedTestCase.id, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      setShowEditTestCaseModal(false);
      setSelectedTestCase(null);
      setEditTestCaseForm({});
      await loadTestCases();
    } catch (error) {
      console.error('Error updating test case:', error);
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
                    <p className="text-sm text-muted line-clamp-1">{testCase.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${priorityPill(testCase.priority)}`}>
                    {testCase.priority}
                  </span>
                  
                  {testCase.tags && testCase.tags.length > 0 && (
                    <div className="flex gap-1">
                      {resolveTags(testCase.tags).slice(0, 2).map(tag => (
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
      filtered = filtered.filter(tc => 
        tc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.tcid.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
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
        />

        {/* Content */}
        <div className="bg-card rounded-lg shadow-card border border-subtle">
          {viewMode === 'list' ? (
            <TestCasesListView
              organizationId={currentOrganization.id}
              projects={projects}
              selectedProjectId={selectedProjectId}
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
        />
      )}
    </div>
  );
};

export default TestCases;
