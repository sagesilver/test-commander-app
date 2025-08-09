import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  FolderOpen, 
  Settings,
  Eye,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Calendar,
  Code
} from 'lucide-react';

const Projects = () => {
  const { currentUser, getProjects, getUsers, createProject, updateProject, deleteProject } = useAuth();
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
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
    if (currentUser) {
      setProjects(getProjects());
    }
  }, [currentUser, getProjects]);

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

  const handleCreateProject = () => {
    try {
      const newProject = createProject(formData);
      console.log('Project created:', newProject);
      
      setShowCreateModal(false);
      setFormData({
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
      setProjects(getProjects());
      
      showMessage('success', `Project "${newProject.name}" created successfully!`);
    } catch (error) {
      console.error('Error creating project:', error);
      showMessage('error', 'Failed to create project. Please try again.');
    }
  };

  const handleEditProject = () => {
    try {
      updateProject(selectedProject.projectId, formData);
      console.log('Project updated:', selectedProject.projectId);
      
      setShowEditModal(false);
      setSelectedProject(null);
      
      // Refresh the projects list
      setProjects(getProjects());
      
      showMessage('success', `Project "${formData.name}" updated successfully!`);
    } catch (error) {
      console.error('Error updating project:', error);
      showMessage('error', 'Failed to update project. Please try again.');
    }
  };

  const handleDeleteProject = (projectId) => {
    const projectToDelete = projects.find(project => project.projectId === projectId);
    if (window.confirm(`Are you sure you want to delete "${projectToDelete?.name}"? This will also delete all associated test cases and data.`)) {
      try {
        deleteProject(projectId);
        console.log('Project deleted:', projectId);
        
        // Refresh the projects list
        setProjects(getProjects());
        
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
  const allowedRoles = ['APP_ADMIN', 'ORG_ADMIN', 'ANALYST'];
  if (!currentUser?.roles.some(role => allowedRoles.includes(role))) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Access Denied</h2>
          <p className="text-red-600">You don't have permission to access project management.</p>
          <p className="text-red-600 mt-2">Current user roles: {currentUser?.roles.join(', ')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
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

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage projects and their configurations</p>
        </div>
        {(currentUser?.roles.includes('APP_ADMIN') || currentUser?.roles.includes('ORG_ADMIN')) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Create Project</span>
          </button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const stats = getProjectStats(project);
          const projectManager = getUsers().find(u => u.userId === project.projectManagerId);
          return (
            <div key={project.projectId} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500">{project.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(project)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit size={16} />
                  </button>
                  {(currentUser?.role === 'SUPER_USER' || currentUser?.role === 'ORGANISATION_ADMIN') && (
                    <button
                      onClick={() => handleDeleteProject(project.projectId)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={16} />
                  <span>{stats.totalMembers} member{stats.totalMembers !== 1 ? 's' : ''}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Settings size={16} />
                  <span>Manager: {projectManager?.name || 'Unassigned'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={16} />
                  <span>Created: {formatDate(project.createdAt)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Code size={16} />
                  <span>{project.metadata.technology || 'No technology specified'}</span>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {project.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-gray-500">
                    v{project.metadata.version}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create Project</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateProject(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Manager</label>
                  <select
                    value={formData.projectManagerId}
                    onChange={(e) => setFormData({...formData, projectManagerId: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select Project Manager</option>
                    {getAvailableProjectManagers().map(user => (
                      <option key={user.userId} value={user.userId}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Technology</label>
                  <input
                    type="text"
                    value={formData.metadata.technology}
                    onChange={(e) => setFormData({
                      ...formData, 
                      metadata: {...formData.metadata, technology: e.target.value}
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., React/Node.js, Python/Django"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                  <input
                    type="text"
                    value={formData.metadata.platform}
                    onChange={(e) => setFormData({
                      ...formData, 
                      metadata: {...formData.metadata, platform: e.target.value}
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., Web, Mobile, Cloud"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Project</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleEditProject(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Manager</label>
                  <select
                    value={formData.projectManagerId}
                    onChange={(e) => setFormData({...formData, projectManagerId: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select Project Manager</option>
                    {getAvailableProjectManagers().map(user => (
                      <option key={user.userId} value={user.userId}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Technology</label>
                  <input
                    type="text"
                    value={formData.metadata.technology}
                    onChange={(e) => setFormData({
                      ...formData, 
                      metadata: {...formData.metadata, technology: e.target.value}
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., React/Node.js, Python/Django"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                  <input
                    type="text"
                    value={formData.metadata.platform}
                    onChange={(e) => setFormData({
                      ...formData, 
                      metadata: {...formData.metadata, platform: e.target.value}
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., Web, Mobile, Cloud"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects; 