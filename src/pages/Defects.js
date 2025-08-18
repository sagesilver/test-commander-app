import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DefectsGrid from '../components/DefectsGrid';
import { defectService } from '../services/defectService';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';
import RichTextEditor from '../components/common/RichTextEditor';
import RichTextViewer from '../components/common/RichTextViewer';
import { getUsersByOrganization } from '../services/userService';
import { useToast } from '../components/Toast';


 
import { 
  Plus, 
  AlertTriangle,
  Clock,
  MessageSquare,
  Paperclip,
  X,
  Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ExportMenu from '../components/ExportMenu';

const Defects = () => {
  const [showNewDefectModal, setShowNewDefectModal] = useState(false);
  const [showViewDefectModal, setShowViewDefectModal] = useState(false);
  const [showEditDefectModal, setShowEditDefectModal] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState(null);
  const { getProjects, user, currentOrganization } = useAuth();
  const [projectsList, setProjectsList] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referenceValues, setReferenceValues] = useState({
    status: [],
    severity: [],
    priority: [],
    reproducibility: [],
    resolution: []
  });
  const [organizationUsers, setOrganizationUsers] = useState([]);
  const { push } = useToast() || { push: () => {} };



  const [newDefectForm, setNewDefectForm] = useState({
    title: '',
    description: '',
    severity: '',
    priority: '',
    project: '',
    module: '',
    assignedTo: '',
    raisedBy: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    environment: '',
    browser: '',
    operatingSystem: ''
  });

  const [editDefectForm, setEditDefectForm] = useState({
    title: '',
    description: '',
    status: '',
    severity: '',
    priority: '',
    project: '',
    module: '',
    assignedTo: '',
    raisedBy: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    environment: '',
    browser: '',
    operatingSystem: ''
  });

  // Load accessible projects for selector (future filtering)
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (typeof getProjects === 'function') {
          const rows = await getProjects();
          if (active) setProjectsList(Array.isArray(rows) ? rows : []);
        }
      } catch (_) {
        if (active) setProjectsList([]);
      }
    })();
    return () => { active = false; };
  }, [getProjects]);

  // Initialize reference values if they don't exist
  const initializeReferenceValues = async () => {
    if (!currentOrganization?.id) return;
    
    try {
      const initializeFunction = httpsCallable(functions, 'initializeDefectReferenceValues');
      await initializeFunction({ organizationId: currentOrganization.id });
      
      // Reload reference values
      const [statusValues, severityValues, priorityValues, reproducibilityValues, resolutionValues] = await Promise.all([
        defectService.getReferenceValues(currentOrganization.id, 'defect_status'),
        defectService.getReferenceValues(currentOrganization.id, 'defect_severity'),
        defectService.getReferenceValues(currentOrganization.id, 'defect_priority'),
        defectService.getReferenceValues(currentOrganization.id, 'defect_reproducibility'),
        defectService.getReferenceValues(currentOrganization.id, 'defect_resolution')
      ]);

      setReferenceValues({
        status: statusValues,
        severity: severityValues,
        priority: priorityValues,
        reproducibility: reproducibilityValues,
        resolution: resolutionValues
      });
    } catch (error) {
      console.error('Error initializing reference values:', error);
    }
  };

  // Load defects and reference values
  useEffect(() => {
    let active = true;
    
    const loadData = async () => {
      if (!currentOrganization?.id) return;
      
      try {
        setLoading(true);
        
        // Load reference values
        const [statusValues, severityValues, priorityValues, reproducibilityValues, resolutionValues] = await Promise.all([
          defectService.getReferenceValues(currentOrganization.id, 'defect_status'),
          defectService.getReferenceValues(currentOrganization.id, 'defect_severity'),
          defectService.getReferenceValues(currentOrganization.id, 'defect_priority'),
          defectService.getReferenceValues(currentOrganization.id, 'defect_reproducibility'),
          defectService.getReferenceValues(currentOrganization.id, 'defect_resolution')
        ]);

        // If no reference values exist, initialize them
        if (statusValues.length === 0) {
          await initializeReferenceValues();
          
          // Reload reference values after initialization
          const [newStatusValues, newSeverityValues, newPriorityValues, newReproducibilityValues, newResolutionValues] = await Promise.all([
            defectService.getReferenceValues(currentOrganization.id, 'defect_status'),
            defectService.getReferenceValues(currentOrganization.id, 'defect_severity'),
            defectService.getReferenceValues(currentOrganization.id, 'defect_priority'),
            defectService.getReferenceValues(currentOrganization.id, 'defect_reproducibility'),
            defectService.getReferenceValues(currentOrganization.id, 'defect_resolution')
          ]);
          
          if (active) {
            setReferenceValues({
              status: newStatusValues,
              severity: newSeverityValues,
              priority: newPriorityValues,
              reproducibility: newReproducibilityValues,
              resolution: newResolutionValues
            });
          }
        } else if (active) {
          setReferenceValues({
            status: statusValues,
            severity: severityValues,
            priority: priorityValues,
            reproducibility: reproducibilityValues,
            resolution: resolutionValues
          });
        }

        // Load organization users
        const users = await getUsersByOrganization(currentOrganization.id);
        if (active) {
          setOrganizationUsers(users);
        }

        // Load defects for all projects
        const allDefects = await defectService.getAllDefects(currentOrganization.id);
        
        // Map project names and user names to defects
        const defectsWithResolvedNames = allDefects.map(defect => {
          const project = projectsList.find(p => p.id === defect.projectId);
          const assignedUser = organizationUsers.find(u => u.id === defect.assignedTo);
          const raisedByUser = organizationUsers.find(u => u.id === defect.raisedBy) || 
                               organizationUsers.find(u => u.id === defect.reporterId) ||
                               organizationUsers.find(u => u.id === defect.reporter);
          
          return {
            ...defect,
            projectName: project?.name || project?.projectName || defect.projectId,
            assignedToName: assignedUser?.displayName || assignedUser?.email || assignedUser?.name || defect.assignedTo || 'Unassigned',
            raisedByName: raisedByUser?.displayName || raisedByUser?.email || raisedByUser?.name || defect.raisedBy || defect.reporterId || defect.reporter || 'Unknown'
          };
        });
        
        if (active) {
          setDefects(defectsWithResolvedNames);
        }
      } catch (error) {
        console.error('Error loading defects data:', error);
        if (active) {
          setDefects([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => { active = false; };
  }, [currentOrganization?.id, projectsList]);

  const statusColors = {
    open: 'bg-red-900/20 text-red-400',
    in_progress: 'bg-amber-900/20 text-amber-300',
    in_review: 'bg-blue-900/20 text-blue-300',
    blocked: 'bg-purple-900/20 text-purple-300',
    resolved: 'bg-green-900/20 text-green-400',
    verified: 'bg-emerald-900/20 text-emerald-400',
    closed: 'bg-white/5 text-menu',
    archived: 'bg-gray-900/20 text-gray-400',
  };

  const severityColors = {
    critical: 'bg-red-900/20 text-red-400',
    high: 'bg-red-900/20 text-red-400',
    medium: 'bg-orange-900/20 text-orange-300',
    low: 'bg-green-900/20 text-green-400',
    trivial: 'bg-gray-900/20 text-gray-400',
  };

  const priorityColors = {
    p0: 'bg-red-900/20 text-red-400',
    p1: 'bg-red-900/20 text-red-400',
    p2: 'bg-orange-900/20 text-orange-300',
    p3: 'bg-green-900/20 text-green-400',
  };

  // Handler functions
  const handleViewDefect = (defect) => {
    setSelectedDefect(defect);
    setShowViewDefectModal(true);
  };

  const handleEditDefect = (defect) => {
    setSelectedDefect(defect);
    setEditDefectForm({
      title: defect.title,
      description: defect.description,
      status: defect.status,
      severity: defect.severity,
      priority: defect.priority,
      project: defect.projectId || defect.project,
      module: defect.folderId || defect.module,
      assignedTo: defect.assignedTo,
      raisedBy: defect.raisedBy || defect.reporterId || defect.reporter || '',
      stepsToReproduce: defect.stepsToReproduce || '',
      expectedBehavior: defect.expectedBehavior || '',
      actualBehavior: defect.actualBehavior || '',
      environment: defect.environment || '',
      browser: defect.browser || '',
      operatingSystem: defect.operatingSystem || defect.os || ''
    });
    setShowEditDefectModal(true);
  };

  const handleDeleteDefect = async (defect) => {
    if (window.confirm(`Are you sure you want to delete defect "${defect.title}"?`)) {
      try {
        await defectService.deleteDefect(
          currentOrganization.id,
          defect.projectId,
          defect.id
        );
        
        // Show success toast
        push({
          variant: 'success',
          message: `Defect deleted successfully!`,
          duration: 5000
        });
        
        // Remove from local state
        setDefects(prev => prev.filter(d => d.id !== defect.id));
      } catch (error) {
        console.error('Error deleting defect:', error);
        push({
          variant: 'error',
          message: `Failed to delete defect: ${error.message}`,
          duration: 5000
        });
      }
    }
  };

  const handleNewDefectSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentOrganization?.id || !newDefectForm.project) {
      alert('Please select a project');
      return;
    }

    try {
      const payload = {
        title: newDefectForm.title,
        description: newDefectForm.description,
        severity: newDefectForm.severity,
        priority: newDefectForm.priority,
        projectId: newDefectForm.project,
        folderId: newDefectForm.module || null,
        assignedTo: newDefectForm.assignedTo || null,
        raisedBy: newDefectForm.raisedBy || user?.displayName || user?.email || '',
        environment: newDefectForm.environment || null,
        browser: newDefectForm.browser || null,
        operatingSystem: newDefectForm.operatingSystem || null,
        stepsToReproduce: newDefectForm.stepsToReproduce || null,
        expectedBehavior: newDefectForm.expectedBehavior || null,
        actualBehavior: newDefectForm.actualBehavior || null
      };

      const newDefect = await defectService.createDefect(currentOrganization.id, newDefectForm.project, payload);
      
      // Show success toast
      push({
        variant: 'success',
        message: `Defect ${newDefect.key} created successfully!`,
        duration: 5000
      });
      
      // Add the new defect to the list
      setDefects(prev => [newDefect, ...prev]);
      
      // Reset form
      setNewDefectForm({
        title: '',
        description: '',
        severity: '',
        priority: '',
        project: '',
        module: '',
        assignedTo: '',
        raisedBy: user?.displayName || user?.email || user?.name || '',
        stepsToReproduce: '',
        expectedBehavior: '',
        actualBehavior: '',
        environment: '',
        browser: '',
        operatingSystem: ''
      });
      setShowNewDefectModal(false);
    } catch (error) {
      console.error('Error creating defect:', error);
      push({
        variant: 'error',
        message: `Failed to create defect: ${error.message}`,
        duration: 5000
      });
    }
  };

  const handleEditDefectSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentOrganization?.id || !editDefectForm.project) {
      alert('Please select a project');
      return;
    }

    try {
      const updates = {
        title: editDefectForm.title,
        description: editDefectForm.description,
        status: editDefectForm.status,
        severity: editDefectForm.severity,
        priority: editDefectForm.priority,
        assignedTo: editDefectForm.assignedTo || null,
        raisedBy: editDefectForm.raisedBy || null,
        folderId: editDefectForm.module || null,
        environment: editDefectForm.environment || null,
        browser: editDefectForm.browser || null,
        operatingSystem: editDefectForm.operatingSystem || null,
        stepsToReproduce: editDefectForm.stepsToReproduce || null,
        expectedBehavior: editDefectForm.expectedBehavior || null,
        actualBehavior: editDefectForm.actualBehavior || null,
        updatedBy: user?.uid || null
      };

      await defectService.updateDefect(
        currentOrganization.id, 
        editDefectForm.project, 
        selectedDefect.id, 
        updates
      );
      
      // Show success toast
      push({
        variant: 'success',
        message: `Defect updated successfully!`,
        duration: 5000
      });
      
      // Update the defect in the local state
      setDefects(prev => prev.map(d => d.id === selectedDefect.id ? {
        ...d,
        ...updates,
        projectId: editDefectForm.project,
        folderId: editDefectForm.module
      } : d));
      
      setShowEditDefectModal(false);
    } catch (error) {
      console.error('Error updating defect:', error);
      push({
        variant: 'error',
        message: `Failed to update defect: ${error.message}`,
        duration: 5000
      });
    }
  };

  // Filter defects by project
  const getFilteredDefects = () => {
    let rows = defects;
    
    // Filter by project
    if (selectedProjectId !== 'all') {
      rows = rows.filter(d => d.projectId === selectedProjectId);
    }
    
    return rows;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Defects</h1>
          <p className="text-menu mt-1">Track and manage issues and defects across your projects.</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Projects selector (white on black) */}
          <select
            aria-label="Filter by Project"
            className="input-field text-sm h-10 !py-2 pr-8 w-80 lg:w-[28rem]"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            title="Filter by Project"
          >
            <option value="all">All Projects</option>
            {projectsList.map((p) => (
              <option key={p.id} value={p.id} title={p.name || p.projectName || p.id}>
                {p.name || p.projectName || p.id}
              </option>
            ))}
          </select>
          <ExportMenu
            label="Export"
            getRows={() => getFilteredDefects().map(d => ({ 
              ...d, 
              Key: d.key || d.id,
              Project: d.projectName || d.projectId || d.project,
              Module: d.folderId || d.module,
              RaisedBy: d.raisedBy || d.reporterId || d.reporter || 'Unknown',
              AssignedTo: d.assignedTo || 'Unassigned',
              Created: d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate().toISOString() : new Date(d.createdAt).toISOString()) : d.createdDate,
              Updated: d.updatedAt ? (d.updatedAt.toDate ? d.updatedAt.toDate().toISOString() : new Date(d.updatedAt).toISOString()) : d.updatedDate,

            }))}
            filenamePrefix="defects"
          />
          {referenceValues.status.length === 0 && (
            <button 
              className="flex items-center space-x-2 px-3 py-2 btn-secondary whitespace-nowrap mr-2"
              onClick={initializeReferenceValues}
              title="Initialize default reference values"
            >
              <span>Initialize Values</span>
            </button>
          )}
          <button 
            className="flex items-center space-x-2 px-4 py-2 btn-primary whitespace-nowrap"
            onClick={() => setShowNewDefectModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>New Defect</span>
          </button>
        </div>
      </div>



      {/* Defects Grid */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-foreground mb-2">Loading defects...</h3>
        </div>
      ) : getFilteredDefects().length > 0 ? (
        <DefectsGrid 
          defects={getFilteredDefects()}
          onViewDefect={handleViewDefect}
          onEditDefect={handleEditDefect}
          onDeleteDefect={handleDeleteDefect}
        />
      ) : (
        <div className="card text-center py-12">
          <AlertTriangle className="w-12 h-12 text-menu mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No defects found</h3>
          <p className="text-menu">Try adjusting your filters or create your first defect.</p>
        </div>
      )}

      {/* New Defect Modal */}
      {showNewDefectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-subtle rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-foreground">Create New Defect</h3>
              <button
                onClick={() => setShowNewDefectModal(false)}
                className="p-2 text-menu hover:text-foreground hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleNewDefectSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Defect Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter defect title"
                    className="input-field"
                    value={newDefectForm.title}
                    onChange={(e) => setNewDefectForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Raised By
                  </label>
                  <input
                    type="text"
                    placeholder="Enter reporter name"
                    className="input-field"
                    value={newDefectForm.raisedBy}
                    onChange={(e) => setNewDefectForm(prev => ({ ...prev, raisedBy: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Assigned To
                  </label>
                  <select
                    className="input-field"
                    value={newDefectForm.assignedTo}
                    onChange={(e) => setNewDefectForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                  >
                    <option value="">Select Assignee</option>
                    {organizationUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.displayName || user.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <RichTextEditor
                  value={newDefectForm.description}
                  onChange={(html) => setNewDefectForm(prev => ({ ...prev, description: html }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Severity <span className="text-red-500">*</span>
                  </label>
                  <select 
                    className="input-field"
                    value={newDefectForm.severity}
                    onChange={(e) => setNewDefectForm(prev => ({ ...prev, severity: e.target.value }))}
                    required
                  >
                    <option value="">Select Severity</option>
                    {referenceValues.severity.map((sev) => (
                      <option key={sev.id} value={sev.id}>
                        {sev.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select 
                    className="input-field"
                    value={newDefectForm.priority}
                    onChange={(e) => setNewDefectForm(prev => ({ ...prev, priority: e.target.value }))}
                    required
                  >
                    <option value="">Select Priority</option>
                    {referenceValues.priority.map((pri) => (
                      <option key={pri.id} value={pri.id}>
                        {pri.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input-field"
                    value={newDefectForm.project}
                    onChange={(e) => setNewDefectForm(prev => ({ ...prev, project: e.target.value }))}
                    required
                  >
                    <option value="">Select Project</option>
                    {projectsList.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name || project.projectName || project.id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Module/Folder
                  </label>
                  <input
                    type="text"
                    placeholder="Enter module or folder name"
                    className="input-field"
                    value={newDefectForm.module}
                    onChange={(e) => setNewDefectForm(prev => ({ ...prev, module: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Environment
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Production, Staging, Development"
                    className="input-field"
                    value={newDefectForm.environment}
                    onChange={(e) => setNewDefectForm(prev => ({ ...prev, environment: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Browser
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Chrome, Firefox, Safari"
                    className="input-field"
                    value={newDefectForm.browser}
                    onChange={(e) => setNewDefectForm(prev => ({ ...prev, browser: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Operating System
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Windows 11, macOS, iOS"
                    className="input-field"
                    value={newDefectForm.operatingSystem}
                    onChange={(e) => setNewDefectForm(prev => ({ ...prev, operatingSystem: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Steps to Reproduce
                </label>
                <textarea
                  placeholder="1. First step\n2. Second step\n3. Third step..."
                  rows="4"
                  className="input-field"
                  value={newDefectForm.stepsToReproduce}
                  onChange={(e) => setNewDefectForm(prev => ({ ...prev, stepsToReproduce: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                    Expected Behavior
                  </label>
                  <textarea
                    placeholder="What should happen..."
                    rows="3"
                    className="input-field"
                    value={newDefectForm.expectedBehavior}
                    onChange={(e) => setNewDefectForm(prev => ({ ...prev, expectedBehavior: e.target.value }))}
                  />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                    Actual Behavior
                  </label>
                  <textarea
                    placeholder="What actually happens..."
                    rows="3"
                    className="input-field"
                    value={newDefectForm.actualBehavior}
                    onChange={(e) => setNewDefectForm(prev => ({ ...prev, actualBehavior: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4 border-t border-grey-light">
                <button
                  type="button"
                  onClick={() => setShowNewDefectModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Create Defect
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* View Defect Modal */}
      {showViewDefectModal && selectedDefect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-subtle rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-foreground">Defect Details</h3>
              <button
                onClick={() => setShowViewDefectModal(false)}
                className="p-2 text-menu hover:text-foreground hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-900/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-foreground">{selectedDefect.key || selectedDefect.id}: {selectedDefect.title}</h4>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[selectedDefect.status]}`}>
                      {selectedDefect.status}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${severityColors[selectedDefect.severity]}`}>
                      {selectedDefect.severity}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[selectedDefect.priority]}`}>
                      {selectedDefect.priority} Priority
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h5 className="font-semibold text-foreground mb-2">Description</h5>
                <RichTextViewer html={selectedDefect.description || ''} />
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold text-foreground mb-3">Basic Information</h5>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-menu">Project:</span>
                      <p className="text-foreground">{selectedDefect.projectName || selectedDefect.projectId || selectedDefect.project}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-menu">Module:</span>
                      <p className="text-foreground">{selectedDefect.folderId || selectedDefect.module || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-menu">Raised By:</span>
                      <p className="text-foreground">{selectedDefect.raisedBy || selectedDefect.reporterId || selectedDefect.reporter || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-menu">Assigned To:</span>
                      <p className="text-foreground">{selectedDefect.assignedTo || 'Unassigned'}</p>
                    </div>

                  </div>
                </div>
                
                <div>
                  <h5 className="font-semibold text-foreground mb-3">Technical Details</h5>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-menu">Environment:</span>
                      <p className="text-foreground">{selectedDefect.environment || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-menu">Browser:</span>
                      <p className="text-foreground">{selectedDefect.browser || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-menu">OS:</span>
                      <p className="text-foreground">{selectedDefect.operatingSystem || selectedDefect.os || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-menu">Created:</span>
                      <p className="text-foreground">{selectedDefect.createdAt ? (selectedDefect.createdAt.toDate ? selectedDefect.createdAt.toDate().toLocaleDateString() : new Date(selectedDefect.createdAt).toLocaleDateString()) : selectedDefect.createdDate || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Steps and Behavior */}
              {selectedDefect.stepsToReproduce && (
                <div>
                  <h5 className="font-semibold text-foreground mb-2">Steps to Reproduce</h5>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <pre className="text-sm text-foreground whitespace-pre-wrap">{selectedDefect.stepsToReproduce}</pre>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedDefect.expectedBehavior && (
                  <div>
                    <h5 className="font-semibold text-foreground mb-2">Expected Behavior</h5>
                    <p className="text-menu bg-white/5 p-3 rounded-lg">{selectedDefect.expectedBehavior}</p>
                  </div>
                )}
                
                {selectedDefect.actualBehavior && (
                  <div>
                    <h5 className="font-semibold text-foreground mb-2">Actual Behavior</h5>
                    <p className="text-menu bg-white/5 p-3 rounded-lg">{selectedDefect.actualBehavior}</p>
                  </div>
                )}
              </div>

              {/* Activity */}
              <div className="flex items-center space-x-6 text-sm text-menu border-t border-subtle pt-4">
                <div className="flex items-center space-x-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{selectedDefect.comments} comments</span>
                </div>
                {selectedDefect.attachments > 0 && (
                  <div className="flex items-center space-x-1">
                    <Paperclip className="w-4 h-4" />
                    <span>{selectedDefect.attachments} attachments</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>Updated: {selectedDefect.updatedAt ? (selectedDefect.updatedAt.toDate ? selectedDefect.updatedAt.toDate().toLocaleDateString() : new Date(selectedDefect.updatedAt).toLocaleDateString()) : selectedDefect.updatedDate || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Defect Modal */}
      {showEditDefectModal && selectedDefect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-subtle rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-foreground">Edit Defect</h3>
              <button
                onClick={() => setShowEditDefectModal(false)}
                className="p-2 text-menu hover:text-foreground hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditDefectSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Defect Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter defect title"
                    className="input-field"
                    value={editDefectForm.title}
                    onChange={(e) => setEditDefectForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Status
                  </label>
                  <select 
                    className="input-field"
                    value={editDefectForm.status}
                    onChange={(e) => setEditDefectForm(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">Select Status</option>
                    {referenceValues.status.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <RichTextEditor
                  value={editDefectForm.description}
                  onChange={(html) => setEditDefectForm(prev => ({ ...prev, description: html }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Severity
                  </label>
                  <select 
                    className="input-field"
                    value={editDefectForm.severity}
                    onChange={(e) => setEditDefectForm(prev => ({ ...prev, severity: e.target.value }))}
                  >
                    <option value="">Select Severity</option>
                    {referenceValues.severity.map((sev) => (
                      <option key={sev.id} value={sev.id}>
                        {sev.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Priority
                  </label>
                  <select 
                    className="input-field"
                    value={editDefectForm.priority}
                    onChange={(e) => setEditDefectForm(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="">Select Priority</option>
                    {referenceValues.priority.map((pri) => (
                      <option key={pri.id} value={pri.id}>
                        {pri.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Assigned To
                  </label>
                  <select
                    className="input-field"
                    value={editDefectForm.assignedTo}
                    onChange={(e) => setEditDefectForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                  >
                    <option value="">Select Assignee</option>
                    {organizationUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.displayName || user.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Project
                  </label>
                  <select
                    className="input-field"
                    value={editDefectForm.project}
                    onChange={(e) => setEditDefectForm(prev => ({ ...prev, project: e.target.value }))}
                  >
                    <option value="">Select Project</option>
                    {projectsList.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name || project.projectName || project.id}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Raised By
                  </label>
                  <input
                    type="text"
                    placeholder="Enter reporter name"
                    className="input-field"
                    value={editDefectForm.raisedBy}
                    onChange={(e) => setEditDefectForm(prev => ({ ...prev, raisedBy: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Module/Folder
                  </label>
                  <input
                    type="text"
                    placeholder="Enter module or folder name"
                    className="input-field"
                    value={editDefectForm.module}
                    onChange={(e) => setEditDefectForm(prev => ({ ...prev, module: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Environment
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Production, Staging"
                    className="input-field"
                    value={editDefectForm.environment}
                    onChange={(e) => setEditDefectForm(prev => ({ ...prev, environment: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Browser
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Chrome, Firefox"
                    className="input-field"
                    value={editDefectForm.browser}
                    onChange={(e) => setEditDefectForm(prev => ({ ...prev, browser: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Operating System
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Windows 11, macOS"
                    className="input-field"
                    value={editDefectForm.operatingSystem}
                    onChange={(e) => setEditDefectForm(prev => ({ ...prev, operatingSystem: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Steps to Reproduce
                </label>
                <textarea
                  placeholder="1. First step\n2. Second step\n3. Third step..."
                  rows="4"
                  className="input-field"
                  value={editDefectForm.stepsToReproduce}
                  onChange={(e) => setEditDefectForm(prev => ({ ...prev, stepsToReproduce: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                    Expected Behavior
                  </label>
                  <textarea
                    placeholder="What should happen..."
                    rows="3"
                    className="input-field"
                    value={editDefectForm.expectedBehavior}
                    onChange={(e) => setEditDefectForm(prev => ({ ...prev, expectedBehavior: e.target.value }))}
                  />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                    Actual Behavior
                  </label>
                  <textarea
                    placeholder="What actually happens..."
                    rows="3"
                    className="input-field"
                    value={editDefectForm.actualBehavior}
                    onChange={(e) => setEditDefectForm(prev => ({ ...prev, actualBehavior: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4 border-t border-grey-light">
                <button
                  type="button"
                  onClick={() => setShowEditDefectModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Update Defect
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Defects; 