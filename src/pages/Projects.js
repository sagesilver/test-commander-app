import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  FolderOpen, 
  Settings,
  Eye,
  CheckCircle,
  AlertCircle,
  Calendar,
  Code,
  Info,
  Grid,
  List
} from 'lucide-react';
import DataTable from '../components/table/DataTable';

const Projects = () => {
  const { currentUser, currentUserData, currentOrganization, getProjects, getAllProjects, getUsers, getOrganizations, createProject, updateProject, deleteProject } = useAuth();
  const [useGrid, setUseGrid] = useState(false);
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [availableOrgs, setAvailableOrgs] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [formData, setFormData] = useState({
    organizationId: '',
    name: '',
    description: '',
    projectManagerId: '',
    metadata: {
      version: '1.0.0',
      technology: '',
      platform: ''
    }
  });

  // Initialize projects on component mount
  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      // Load orgs selector for App Admins
      if (currentUserData?.roles?.includes('APP_ADMIN')) {
        const orgs = await getOrganizations();
        setAvailableOrgs(orgs);
      }

      const isAdmin = currentUserData?.roles?.includes('APP_ADMIN');
      let list = [];
      if (isAdmin && (!formData.organizationId && !currentOrganization?.organisationId)) {
        list = await getAllProjects({ includeInactive: !showOnlyActive });
      } else {
        const orgId = isAdmin ? (formData.organizationId || currentOrganization?.organisationId || null)
                              : (currentOrganization?.organisationId || currentUserData?.organisationId || null);
        list = await getProjects(orgId, { includeInactive: !showOnlyActive });
      }
      setProjects(list);
    };
    load();
  }, [currentUser, currentUserData, currentOrganization, formData.organizationId, getProjects, getOrganizations, getAllProjects, showOnlyActive]);

  // Auto-hide success messages after 3 seconds
  useEffect(() => {
    if (message.type === 'success') {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const handleCreateProject = async () => {
    try {
      const orgId = currentUserData?.roles?.includes('APP_ADMIN')
        ? formData.organizationId
        : (currentOrganization?.organisationId || currentUserData?.organisationId);
      if (!orgId) throw new Error('Select an organization');
      const newProject = await createProject(orgId, formData);
      console.log('Project created:', newProject);
      
      setShowCreateModal(false);
      setFormData({
        organizationId: currentUserData?.roles?.includes('APP_ADMIN') ? '' : (currentOrganization?.organisationId || currentUserData?.organisationId || ''),
        name: '',
        description: '',
        projectManagerId: '',
        metadata: {
          version: '1.0.0',
          technology: '',
          platform: ''
        }
      });
      
      // Refresh the projects list
      const refreshed = await getProjects(orgId, { includeInactive: !showOnlyActive });
      setProjects(refreshed);
      
      showMessage('success', `Project "${newProject.name}" created successfully!`);
    } catch (error) {
      console.error('Error creating project:', error);
      showMessage('error', 'Failed to create project. Please try again.');
    }
  };

  const handleEditProject = async () => {
    try {
      const orgId = currentOrganization?.organisationId || currentUserData?.organisationId || selectedProject.organizationId;
      await updateProject(orgId, selectedProject.id || selectedProject.projectId, formData);
      console.log('Project updated:', selectedProject.projectId);
      
      setShowEditModal(false);
      setSelectedProject(null);
      
      // Refresh the projects list
      const refreshed = await getProjects(orgId, { includeInactive: !showOnlyActive });
      setProjects(refreshed);
      
      showMessage('success', `Project "${formData.name}" updated successfully!`);
    } catch (error) {
      console.error('Error updating project:', error);
      showMessage('error', 'Failed to update project. Please try again.');
    }
  };

  const handleDeleteProject = async (projectId) => {
    const projectToDelete = projects.find(project => project.projectId === projectId);
    if (window.confirm(`Are you sure you want to delete "${projectToDelete?.name}"? This will also delete all associated test cases and data.`)) {
      try {
        const orgId = currentOrganization?.organisationId || currentUserData?.organisationId;
        await deleteProject(orgId, projectId);
        console.log('Project deleted:', projectId);
        
        // Refresh the projects list
      const refreshed = await getProjects(orgId, { includeInactive: !showOnlyActive });
        setProjects(refreshed);
        
        showMessage('success', `Project "${projectToDelete?.name}" deleted successfully!`);
      } catch (error) {
        console.error('Error deleting project:', error);
        showMessage('error', 'Failed to delete project. Please try again.');
      }
    }
  };

  const openEditModal = (project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      projectManagerId: project.projectManagerId,
      metadata: project.metadata
    });
    setShowEditModal(true);
  };

  const getProjectStats = (project) => {
    return {
      totalMembers: project.members.length,
      activeMembers: project.members.filter(m => m.isActive !== false).length
    };
  };

  const getProjectMembers = (project) => {
    return project.members.map(member => {
      const user = getUsers().find(u => u.userId === member.userId);
      return {
        ...member,
        user: user,
        canManage: user?.roles.includes('ORG_ADMIN') || user?.roles.includes('ANALYST')
      };
    });
  };

  const getAvailableProjectManagers = () => {
    return getUsers().filter(user => 
      user.roles.includes('ORG_ADMIN') || user.roles.includes('ANALYST')
    );
  };

  const formatDate = (value) => {
    if (!value) return '—';
    if (typeof value.toDate === 'function') {
      try {
        const d = value.toDate();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      } catch (_) {}
    }
    if (typeof value === 'object' && typeof value.seconds === 'number') {
      const d = new Date(value.seconds * 1000);
      if (isNaN(d.getTime())) return '—';
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Show loading state while checking authentication
  if (!currentUser) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  // Check if user has permission to access project management
  const allowedRoles = ['APP_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER', 'ANALYST'];
  if (!currentUserData?.roles?.some(role => allowedRoles.includes(role))) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Access Denied</h2>
          <p className="text-red-600">You don't have permission to access project management.</p>
          <p className="text-red-600 mt-2">Current user roles: {Array.isArray(currentUserData?.roles) ? currentUserData.roles.join(', ') : '—'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            {currentUserData?.roles?.includes('APP_ADMIN') ? 'All Projects' : 'Projects'}
          </h1>
          <p className="text-menu">
            {currentUserData?.roles?.includes('APP_ADMIN')
              ? 'Manage all projects across organizations'
              : 'Manage projects within your organization'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex rounded-lg border border-subtle overflow-hidden" role="tablist" aria-label="View mode">
            <button
              onClick={() => setUseGrid(false)}
              title="Table View"
              className={`p-2 text-sm ${!useGrid ? 'bg-white/10 text-white' : 'text-menu hover:text-white hover:bg-white/10'}`}
              aria-pressed={!useGrid}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setUseGrid(true)}
              title="Grid View"
              className={`p-2 text-sm border-l border-subtle ${useGrid ? 'bg-white/10 text-white' : 'text-menu hover:text-white hover:bg-white/10'}`}
              aria-pressed={useGrid}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
          <label className="flex items-center ml-3 select-none" title="Show only Active projects">
            <input
              type="checkbox"
              className="sr-only"
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
            />
            <span className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${showOnlyActive ? 'bg-green-600' : 'bg-white/10 border border-subtle'}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${showOnlyActive ? 'translate-x-6' : 'translate-x-1'}`}></span>
            </span>
            <span className="ml-2 text-sm text-menu">Active only</span>
          </label>
          {(currentUserData?.roles?.includes('APP_ADMIN') || currentUserData?.roles?.includes('ORG_ADMIN') || currentUserData?.roles?.includes('PROJECT_MANAGER')) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {message.type && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="bg-card rounded-lg shadow-lg border border-subtle">
        <div className="flex items-center justify-between p-4 bg-surface-muted border-b border-subtle">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-foreground">Projects</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[rgb(var(--tc-icon))]/20 text-[rgb(var(--tc-contrast))]">
              {projects.length} total
            </span>
          </div>
        </div>
        {!useGrid ? (
          <div className="w-full">
            <DataTable
              data={projects}
              defaultPageSize={10}
              pageSizeOptions={[10, 25, 50]}
              emptyMessage={'No projects'}
              columns={[
              { id: 'name', header: 'Project', accessorKey: 'name', size: 220, filterType: 'text', cell: ({ getValue }) => (
                <span className="text-foreground font-medium truncate" title={getValue()}>{getValue()}</span>
              )},
              { id: 'description', header: 'Description', accessorKey: 'description', size: 320, filterType: 'text', cell: ({ getValue }) => (
                <span className="text-menu truncate" title={getValue()}>{getValue()}</span>
              )},
              { id: 'status', header: 'Status', accessorKey: 'isActive', size: 120, filterType: 'select', cell: ({ getValue }) => (
                <span className={`inline-flex items-center h-7 px-2 rounded-full text-sm font-medium ${getValue() !== false ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                  {getValue() !== false ? 'Active' : 'Inactive'}
                </span>
              )},
              { id: 'technology', header: 'Technology', accessorKey: 'metadata.technology', size: 180, filterType: 'text', cell: ({ getValue }) => (
                <span className="text-menu truncate" title={getValue()}>{getValue() || '—'}</span>
              )},
              { id: 'createdBy', header: 'Created By', accessorKey: 'createdByName', size: 200, filterType: 'text', cell: ({ getValue }) => (
                <span className="text-menu truncate" title={getValue()}>{getValue() || '—'}</span>
              )},
              { id: 'createdAt', header: 'Created', accessorKey: 'createdAt', size: 160, filterType: 'text', cell: ({ getValue }) => (
                <span className="text-menu">{formatDate(getValue())}</span>
              )},
              { id: 'actions', header: 'Actions', size: 200, enableSorting: false, enableColumnFilter: false, cell: ({ row }) => (
                <div className="h-full flex items-center space-x-1">
                  <button
                    className="p-1.5 text-menu hover:text-white hover:bg-white/10 rounded transition-all duration-200"
                    title="View Project"
                    onClick={() => alert('Project view not yet implemented')}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 text-menu hover:text-white hover:bg-white/10 rounded transition-all duration-200"
                    title="Edit Project"
                    onClick={() => openEditModal(row.original)}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {(currentUserData?.roles?.includes('APP_ADMIN') || currentUserData?.roles?.includes('ORG_ADMIN')) && (
                    <button
                      className="p-1.5 text-menu hover:text-red-300 hover:bg-red-900/20 rounded transition-all duration-200"
                      title="Deactivate Project"
                      onClick={() => handleDeleteProject(row.original.id || row.original.projectId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )},
            ]}
            className="text-foreground"
          />
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <div key={p.id || p.projectId} className="bg-card border border-subtle rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-foreground font-semibold">{p.name}</h4>
                      <p className="text-sm text-menu line-clamp-2">{p.description || '—'}</p>
                    </div>
                    <span className={`h-7 px-2 rounded-full text-xs font-medium ${p.isActive !== false ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>{p.isActive !== false ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-menu">Technology</div>
                      <div className="text-foreground font-medium">{p.metadata?.technology || '—'}</div>
                    </div>
                    <div>
                      <div className="text-menu">Created By</div>
                      <div className="text-foreground font-medium">{p.createdByName || '—'}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center space-x-2">
                    <button className="p-1.5 text-menu hover:text-white hover:bg-white/10 rounded" title="View Project" onClick={() => alert('Project view not yet implemented')}>
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-menu hover:text-white hover:bg-white/10 rounded" title="Edit Project" onClick={() => openEditModal(p)}>
                      <Edit className="w-4 h-4" />
                    </button>
                    {(currentUserData?.roles?.includes('APP_ADMIN') || currentUserData?.roles?.includes('ORG_ADMIN')) && (
                      <button className="p-1.5 text-menu hover:text-red-300 hover:bg-red-900/20 rounded" title="Deactivate Project" onClick={() => handleDeleteProject(p.id || p.projectId)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-card rounded-lg p-6 w-full max-w-md relative z-[1001] pointer-events-auto text-foreground">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-[rgb(var(--tc-icon))]" />
              <h2 className="text-xl font-semibold">Create Project</h2>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateProject(); }} className="tc-org-new">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="Short description"
                  />
                </div>
                {currentUserData?.roles?.includes('APP_ADMIN') && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Organization</label>
                    <select
                      value={formData.organizationId}
                      onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Select Organization</option>
                      {availableOrgs.map((org) => (
                        <option key={org.organisationId} value={org.organisationId}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Technology</label>
                  <input
                    type="text"
                    value={formData.metadata.technology}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, technology: e.target.value },
                      })
                    }
                    className="input-field"
                    placeholder="e.g., React/Node.js, Python/Django"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Platform</label>
                  <input
                    type="text"
                    value={formData.metadata.platform}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, platform: e.target.value },
                      })
                    }
                    className="input-field"
                    placeholder="e.g., Web, Mobile, Cloud"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 btn-primary">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Project Modal */}
      {showEditModal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-card rounded-lg p-6 w-full max-w-md relative z-[1001] pointer-events-auto text-foreground">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-[rgb(var(--tc-icon))]" />
              <h2 className="text-xl font-semibold">Edit Project</h2>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleEditProject(); }} className="tc-org-edit">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows={3}
                  />
                </div>
                {currentUserData?.roles?.includes('APP_ADMIN') && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Organization</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedProject?.organizationId || '—'}
                      className="input-field"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Technology</label>
                  <input
                    type="text"
                    value={formData.metadata.technology}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, technology: e.target.value },
                      })
                    }
                    className="input-field"
                    placeholder="e.g., React/Node.js, Python/Django"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Platform</label>
                  <input
                    type="text"
                    value={formData.metadata.platform}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, platform: e.target.value },
                      })
                    }
                    className="input-field"
                    placeholder="e.g., Web, Mobile, Cloud"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 btn-primary">
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Projects; 