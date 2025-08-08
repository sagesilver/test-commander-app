import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DefectsGrid from '../components/DefectsGrid';
import { 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle,
  Clock,
  User,
  Tag,
  MessageSquare,
  Paperclip,
  Eye,
  Edit,
  Trash2,
  X,
  ChevronDown,
  Download
} from 'lucide-react';

const Defects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showNewDefectModal, setShowNewDefectModal] = useState(false);
  const [showViewDefectModal, setShowViewDefectModal] = useState(false);
  const [showEditDefectModal, setShowEditDefectModal] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [defects, setDefects] = useState([
    {
      id: 'DEF-001',
      title: 'Payment Gateway Timeout Error',
      description: 'Users experiencing timeout errors when processing payments through the gateway. The issue occurs specifically when users attempt to complete transactions with certain payment methods. This is causing a significant impact on our conversion rates.',
      status: 'Open',
      severity: 'High',
      priority: 'Critical',
      reporter: 'John Doe',
      assignedTo: 'Jane Smith',
      project: 'E-Commerce Platform',
      module: 'Payment System',
      createdDate: '2024-01-15',
      updatedDate: '2024-01-16',
      attachments: 2,
      comments: 5,
      stepsToReproduce: '1. Navigate to checkout page\n2. Select credit card payment\n3. Enter valid card details\n4. Click "Complete Purchase"\n5. Wait for timeout error',
      expectedBehavior: 'Payment should process successfully and redirect to confirmation page',
      actualBehavior: 'Payment times out after 30 seconds with error message',
      environment: 'Production - Chrome 120.0.6099.109',
      browser: 'Chrome',
      os: 'Windows 11'
    },
    {
      id: 'DEF-002',
      title: 'User Profile Image Not Loading',
      description: 'Profile images are not displaying correctly in the user dashboard. Users are seeing broken image icons instead of their uploaded profile pictures.',
      status: 'In Progress',
      severity: 'Medium',
      priority: 'Medium',
      reporter: 'Sarah Wilson',
      assignedTo: 'Mike Johnson',
      project: 'E-Commerce Platform',
      module: 'User Management',
      createdDate: '2024-01-14',
      updatedDate: '2024-01-15',
      attachments: 1,
      comments: 3,
      stepsToReproduce: '1. Login to user account\n2. Navigate to profile settings\n3. Upload profile image\n4. Save changes\n5. View profile in dashboard',
      expectedBehavior: 'Profile image should display correctly in dashboard',
      actualBehavior: 'Broken image icon appears instead of profile picture',
      environment: 'Staging - Firefox 121.0',
      browser: 'Firefox',
      os: 'macOS 14.1'
    },
    {
      id: 'DEF-003',
      title: 'Search Results Pagination Issue',
      description: 'Pagination controls not working correctly in product search results. Users cannot navigate to subsequent pages of search results.',
      status: 'Resolved',
      severity: 'Low',
      priority: 'Low',
      reporter: 'Alex Brown',
      assignedTo: 'David Lee',
      project: 'E-Commerce Platform',
      module: 'Product Catalog',
      createdDate: '2024-01-13',
      updatedDate: '2024-01-14',
      attachments: 0,
      comments: 2,
      stepsToReproduce: '1. Search for products\n2. View search results\n3. Click on page 2 or next button',
      expectedBehavior: 'Should navigate to next page of results',
      actualBehavior: 'Page remains on first page of results',
      environment: 'Production - Safari 17.1',
      browser: 'Safari',
      os: 'iOS 17.1'
    },
    {
      id: 'DEF-004',
      title: 'Mobile Responsive Layout Broken',
      description: 'Layout issues on mobile devices, particularly on product detail pages. Content is overlapping and buttons are not properly aligned.',
      status: 'Open',
      severity: 'High',
      priority: 'High',
      reporter: 'Emily Davis',
      assignedTo: 'Unassigned',
      project: 'E-Commerce Platform',
      module: 'Frontend',
      createdDate: '2024-01-12',
      updatedDate: '2024-01-12',
      attachments: 3,
      comments: 1,
      stepsToReproduce: '1. Open website on mobile device\n2. Navigate to any product detail page\n3. Scroll through the page',
      expectedBehavior: 'Layout should be properly responsive and aligned',
      actualBehavior: 'Content overlaps and buttons are misaligned',
      environment: 'Production - Mobile Safari',
      browser: 'Safari Mobile',
      os: 'iOS 17.1'
    }
  ]);

  const [newDefectForm, setNewDefectForm] = useState({
    title: '',
    description: '',
    severity: '',
    priority: '',
    project: '',
    module: '',
    assignedTo: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    environment: '',
    browser: '',
    os: ''
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
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    environment: '',
    browser: '',
    os: ''
  });

  const statusColors = {
    'Open': 'text-red-500 bg-red-50',
    'In Progress': 'text-amber-500 bg-amber-50',
    'Resolved': 'text-green-500 bg-green-50',
    'Closed': 'text-slate bg-slate-light',
    'On Hold': 'text-purple-500 bg-purple-50'
  };

  const severityColors = {
    'Critical': 'text-red-600 bg-red-100',
    'High': 'text-red-500 bg-red-50',
    'Medium': 'text-amber-500 bg-amber-50',
    'Low': 'text-green-500 bg-green-50'
  };

  const priorityColors = {
    'Critical': 'text-red-600',
    'High': 'text-red-500',
    'Medium': 'text-amber-500',
    'Low': 'text-green-500'
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
      project: defect.project,
      module: defect.module,
      assignedTo: defect.assignedTo,
      stepsToReproduce: defect.stepsToReproduce || '',
      expectedBehavior: defect.expectedBehavior || '',
      actualBehavior: defect.actualBehavior || '',
      environment: defect.environment || '',
      browser: defect.browser || '',
      os: defect.os || ''
    });
    setShowEditDefectModal(true);
  };

  const handleDeleteDefect = (defect) => {
    if (window.confirm(`Are you sure you want to delete defect "${defect.title}"?`)) {
      setDefects(prev => prev.filter(d => d.id !== defect.id));
    }
  };

  const handleNewDefectSubmit = (e) => {
    e.preventDefault();
    const newDefect = {
      id: `DEF-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      ...newDefectForm,
      status: 'Open',
      reporter: 'Current User',
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
      attachments: 0,
      comments: 0
    };
    
    setDefects(prev => [newDefect, ...prev]);
    setNewDefectForm({
      title: '',
      description: '',
      severity: '',
      priority: '',
      project: '',
      module: '',
      assignedTo: '',
      stepsToReproduce: '',
      expectedBehavior: '',
      actualBehavior: '',
      environment: '',
      browser: '',
      os: ''
    });
    setShowNewDefectModal(false);
  };

  const handleEditDefectSubmit = (e) => {
    e.preventDefault();
    const updatedDefect = {
      ...selectedDefect,
      ...editDefectForm,
      updatedDate: new Date().toISOString().split('T')[0]
    };
    
    setDefects(prev => prev.map(d => d.id === selectedDefect.id ? updatedDefect : d));
    setShowEditDefectModal(false);
  };

  const filteredDefects = defects.filter(defect => {
    const matchesSearch = defect.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         defect.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         defect.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || defect.status === selectedStatus;
    const matchesSeverity = selectedSeverity === 'all' || defect.severity === selectedSeverity;
    const matchesPriority = selectedPriority === 'all' || defect.priority === selectedPriority;
    
    return matchesSearch && matchesStatus && matchesSeverity && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal">Defects</h1>
          <p className="text-slate mt-1">Track and manage issues and defects across your projects.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap"
            onClick={() => console.log('Export defects')}
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button 
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
            onClick={() => setShowNewDefectModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>New Defect</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate" />
            <input
              type="text"
              placeholder="Search defects by title or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex space-x-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="On Hold">On Hold</option>
            </select>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="input-field"
            >
              <option value="all">All Severity</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="input-field"
            >
              <option value="all">All Priority</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Defects Grid */}
      {filteredDefects.length > 0 ? (
        <DefectsGrid 
          defects={filteredDefects}
          onViewDefect={handleViewDefect}
          onEditDefect={handleEditDefect}
          onDeleteDefect={handleDeleteDefect}
        />
      ) : (
        <div className="card text-center py-12">
          <AlertTriangle className="w-12 h-12 text-slate mx-auto mb-4" />
          <h3 className="text-lg font-medium text-charcoal mb-2">No defects found</h3>
          <p className="text-slate">Try adjusting your search criteria or filters.</p>
        </div>
      )}

      {/* New Defect Modal */}
      {showNewDefectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-charcoal">Create New Defect</h3>
              <button
                onClick={() => setShowNewDefectModal(false)}
                className="p-2 text-slate hover:text-charcoal transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleNewDefectSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
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
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    placeholder="Enter assignee name"
                    className="input-field"
                    value={newDefectForm.assignedTo}
                    onChange={(e) => setNewDefectForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Describe the defect in detail..."
                  rows="4"
                  className="input-field"
                  value={newDefectForm.description}
                  onChange={(e) => setNewDefectForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Severity <span className="text-red-500">*</span>
                  </label>
                  <select 
                    className="input-field"
                    value={newDefectForm.severity}
                    onChange={(e) => setNewDefectForm(prev => ({ ...prev, severity: e.target.value }))}
                    required
                  >
                    <option value="">Select Severity</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select 
                    className="input-field"
                    value={newDefectForm.priority}
                    onChange={(e) => setNewDefectForm(prev => ({ ...prev, priority: e.target.value }))}
                    required
                  >
                    <option value="">Select Priority</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter project name"
                    className="input-field"
                    value={newDefectForm.project}
                    onChange={(e) => setNewDefectForm(prev => ({ ...prev, project: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Module
                  </label>
                  <input
                    type="text"
                    placeholder="Enter module name"
                    className="input-field"
                    value={newDefectForm.module}
                    onChange={(e) => setNewDefectForm(prev => ({ ...prev, module: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
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
                  <label className="block text-sm font-medium text-charcoal mb-2">
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
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Operating System
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Windows 11, macOS, iOS"
                    className="input-field"
                    value={newDefectForm.os}
                    onChange={(e) => setNewDefectForm(prev => ({ ...prev, os: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
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
                  <label className="block text-sm font-medium text-charcoal mb-2">
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
                  <label className="block text-sm font-medium text-charcoal mb-2">
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
            className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-charcoal">Defect Details</h3>
              <button
                onClick={() => setShowViewDefectModal(false)}
                className="p-2 text-slate hover:text-charcoal transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-charcoal">{selectedDefect.id}: {selectedDefect.title}</h4>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[selectedDefect.status]}`}>
                      {selectedDefect.status}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${severityColors[selectedDefect.severity]}`}>
                      {selectedDefect.severity}
                    </span>
                    <span className={`text-xs font-medium ${priorityColors[selectedDefect.priority]}`}>
                      {selectedDefect.priority} Priority
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h5 className="font-semibold text-charcoal mb-2">Description</h5>
                <p className="text-slate bg-slate-light p-3 rounded-lg">{selectedDefect.description}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold text-charcoal mb-3">Basic Information</h5>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-slate">Project:</span>
                      <p className="text-charcoal">{selectedDefect.project}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate">Module:</span>
                      <p className="text-charcoal">{selectedDefect.module}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate">Reporter:</span>
                      <p className="text-charcoal">{selectedDefect.reporter}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate">Assigned To:</span>
                      <p className="text-charcoal">{selectedDefect.assignedTo}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-semibold text-charcoal mb-3">Technical Details</h5>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-slate">Environment:</span>
                      <p className="text-charcoal">{selectedDefect.environment || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate">Browser:</span>
                      <p className="text-charcoal">{selectedDefect.browser || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate">OS:</span>
                      <p className="text-charcoal">{selectedDefect.os || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate">Created:</span>
                      <p className="text-charcoal">{selectedDefect.createdDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Steps and Behavior */}
              {selectedDefect.stepsToReproduce && (
                <div>
                  <h5 className="font-semibold text-charcoal mb-2">Steps to Reproduce</h5>
                  <div className="bg-slate-light p-3 rounded-lg">
                    <pre className="text-sm text-charcoal whitespace-pre-wrap">{selectedDefect.stepsToReproduce}</pre>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedDefect.expectedBehavior && (
                  <div>
                    <h5 className="font-semibold text-charcoal mb-2">Expected Behavior</h5>
                    <p className="text-slate bg-slate-light p-3 rounded-lg">{selectedDefect.expectedBehavior}</p>
                  </div>
                )}
                
                {selectedDefect.actualBehavior && (
                  <div>
                    <h5 className="font-semibold text-charcoal mb-2">Actual Behavior</h5>
                    <p className="text-slate bg-slate-light p-3 rounded-lg">{selectedDefect.actualBehavior}</p>
                  </div>
                )}
              </div>

              {/* Activity */}
              <div className="flex items-center space-x-6 text-sm text-slate border-t border-grey-light pt-4">
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
                  <span>Updated: {selectedDefect.updatedDate}</span>
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
            className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-charcoal">Edit Defect</h3>
              <button
                onClick={() => setShowEditDefectModal(false)}
                className="p-2 text-slate hover:text-charcoal transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditDefectSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
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
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Status
                  </label>
                  <select 
                    className="input-field"
                    value={editDefectForm.status}
                    onChange={(e) => setEditDefectForm(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Describe the defect in detail..."
                  rows="4"
                  className="input-field"
                  value={editDefectForm.description}
                  onChange={(e) => setEditDefectForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Severity
                  </label>
                  <select 
                    className="input-field"
                    value={editDefectForm.severity}
                    onChange={(e) => setEditDefectForm(prev => ({ ...prev, severity: e.target.value }))}
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Priority
                  </label>
                  <select 
                    className="input-field"
                    value={editDefectForm.priority}
                    onChange={(e) => setEditDefectForm(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    placeholder="Enter assignee name"
                    className="input-field"
                    value={editDefectForm.assignedTo}
                    onChange={(e) => setEditDefectForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Project
                  </label>
                  <input
                    type="text"
                    placeholder="Enter project name"
                    className="input-field"
                    value={editDefectForm.project}
                    onChange={(e) => setEditDefectForm(prev => ({ ...prev, project: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Module
                  </label>
                  <input
                    type="text"
                    placeholder="Enter module name"
                    className="input-field"
                    value={editDefectForm.module}
                    onChange={(e) => setEditDefectForm(prev => ({ ...prev, module: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
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
                  <label className="block text-sm font-medium text-charcoal mb-2">
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
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Operating System
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Windows 11, macOS"
                    className="input-field"
                    value={editDefectForm.os}
                    onChange={(e) => setEditDefectForm(prev => ({ ...prev, os: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
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
                  <label className="block text-sm font-medium text-charcoal mb-2">
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
                  <label className="block text-sm font-medium text-charcoal mb-2">
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