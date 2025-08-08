import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { organizationService } from '../../services/organizationService';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Chip, IconButton, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, Grid, Divider } from '@mui/material';
import { Edit, Delete, Visibility, Add, Business, Email, Phone, Language, LocationOn, Person, Settings, CreditCard, Image, Palette, Code, Group, Folder } from '@mui/icons-material';
import { Building, XCircle, CheckCircle } from 'lucide-react';
import OrganizationForm from './OrganizationForm';

const OrganizationList = () => {
  const { currentUserData, createOrganization, updateOrganization, deleteOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [stats, setStats] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      // Load organizations directly from Firestore database
      const orgs = await organizationService.getAllOrganizations();
      setOrganizations(orgs);
      
      if (orgs.length === 0) {
        setStats({});
        setLoading(false);
        return;
      }
      
      const statsPromises = orgs.map(org => 
        organizationService.getOrganizationStats(org.organisationId)
      );
      const orgStats = await Promise.all(statsPromises);
      
      const statsMap = {};
      orgs.forEach((org, index) => {
        statsMap[org.organisationId] = orgStats[index];
      });
      
      setStats(statsMap);
    } catch (error) {
      console.error('Error loading organizations:', error);
      setSnackbar({
        open: true,
        message: 'Error loading organizations',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (organization) => {
    setSelectedOrganization(organization);
    setViewOpen(true);
  };

  const handleEdit = (organization) => {
    setSelectedOrganization(organization);
    setFormOpen(true);
  };

  const handleDelete = async (organization) => {
    if (window.confirm(`Are you sure you want to deactivate "${organization.name}"? This will make the organization inactive but preserve all data.`)) {
      try {
        // Call the delete function from AuthContext which handles both Firestore and local state
        await deleteOrganization(organization.organisationId);
        setSnackbar({
          open: true,
          message: 'Organization deactivated successfully',
          severity: 'success'
        });
        // Reload data from database
        await loadOrganizations();
      } catch (error) {
        console.error('Error deactivating organization:', error);
        setSnackbar({
          open: true,
          message: 'Error deactivating organization: ' + error.message,
          severity: 'error'
        });
      }
    }
  };

  const handleRestore = async (organization) => {
    if (window.confirm(`Are you sure you want to reactivate "${organization.name}"?`)) {
      try {
        // Call the update function to set isActive back to true
        await updateOrganization(organization.organisationId, { isActive: true });
        setSnackbar({
          open: true,
          message: 'Organization reactivated successfully',
          severity: 'success'
        });
        // Reload data from database
        await loadOrganizations();
      } catch (error) {
        console.error('Error reactivating organization:', error);
        setSnackbar({
          open: true,
          message: 'Error reactivating organization: ' + error.message,
          severity: 'error'
        });
      }
    }
  };

  const handleCreate = () => {
    setSelectedOrganization(null);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedOrganization(null);
  };

  const handleViewClose = () => {
    setViewOpen(false);
    setSelectedOrganization(null);
  };

  const handleFormSuccess = async () => {
    setSnackbar({
      open: true,
      message: selectedOrganization ? 'Organization updated successfully' : 'Organization created successfully',
      severity: 'success'
    });
    await loadOrganizations();
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    
    // Handle Firestore Timestamp objects
    if (date && typeof date === 'object' && date.toDate) {
      return date.toDate().toLocaleDateString();
    }
    
    // Handle regular Date objects or date strings
    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getSubscriptionPlanLabel = (plan) => {
    const plans = {
      'free': 'Free',
      'pro': 'Pro',
      'enterprise': 'Enterprise',
      'trial': 'Trial'
    };
    return plans[plan] || plan || 'Free';
  };

  const getOrganizationSizeLabel = (size) => {
    const sizes = {
      'small': 'Small (1-50 employees)',
      'medium': 'Medium (51-200 employees)',
      'large': 'Large (201-1000 employees)',
      'enterprise': 'Enterprise (1000+ employees)'
    };
    return sizes[size] || size;
  };

  const columns = [
    { field: 'name', headerName: 'Organization', width: 200 },
    { field: 'description', headerName: 'Description', width: 300 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.row.isActive ? 'Active' : 'Inactive'}
          color={params.row.isActive ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'users',
      headerName: 'Users',
      width: 100,
      renderCell: (params) => {
        const orgStats = stats[params.row.organisationId];
        return orgStats ? `${orgStats.activeUsers}/${orgStats.totalUsers}` : '0/0';
      }
    },
    {
      field: 'projects',
      headerName: 'Projects',
      width: 100,
      renderCell: (params) => {
        const orgStats = stats[params.row.organisationId];
        return orgStats ? `${orgStats.activeProjects}/${orgStats.totalProjects}` : '0/0';
      }
    },
    {
      field: 'subscription',
      headerName: 'Plan',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={getSubscriptionPlanLabel(params.row.subscription?.plan)}
          variant="outlined"
          size="small"
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <div>
          <IconButton 
            size="small" 
            onClick={() => handleView(params.row)}
            title="View Details"
          >
            <Visibility />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleEdit(params.row)}
            title="Edit Organization"
          >
            <Edit />
          </IconButton>
          {params.row.isActive ? (
            <IconButton 
              size="small" 
              onClick={() => handleDelete(params.row)}
              title="Deactivate Organization"
              color="warning"
            >
              <Delete />
            </IconButton>
          ) : (
            <IconButton 
              size="small" 
              onClick={() => handleRestore(params.row)}
              title="Reactivate Organization"
              color="success"
            >
              <Add />
            </IconButton>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Organizations</h1>
        {currentUserData?.roles.includes('APP_ADMIN') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
          >
            Create Organization
          </Button>
        )}
      </div>
      
      <DataGrid
        rows={organizations}
        columns={columns}
        loading={loading}
        pageSize={10}
        rowsPerPageOptions={[10, 25, 50]}
        disableSelectionOnClick
        getRowId={(row) => row.organisationId}
        autoHeight
        sx={{
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #e0e0e0',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f5f5f5',
            borderBottom: '2px solid #e0e0e0',
          },
        }}
      />

      {/* View Organization Modal */}
      {viewOpen && selectedOrganization && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedOrganization.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Organization details and settings
                  </p>
                </div>
              </div>
              <button
                onClick={handleViewClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {selectedOrganization.description || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {selectedOrganization.metadata?.industry || 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Email className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {selectedOrganization.contactInfo?.email || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {selectedOrganization.contactInfo?.phone || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {selectedOrganization.contactInfo?.website ? (
                        <a 
                          href={selectedOrganization.contactInfo.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {selectedOrganization.contactInfo.website}
                        </a>
                      ) : 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {selectedOrganization.contactInfo?.address || 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Organization Settings */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">Organization Settings</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default User Role
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {selectedOrganization.settings?.defaultUserRole || 'Not set'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Users
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {selectedOrganization.settings?.maxUsers || 'Not set'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Projects
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {selectedOrganization.settings?.maxProjects || 'Not set'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Branding & Customization */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Palette className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">Branding & Customization</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo URL
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {selectedOrganization.settings?.branding?.logo ? (
                        <a 
                          href={selectedOrganization.settings.branding.logo} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {selectedOrganization.settings.branding.logo}
                        </a>
                      ) : 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div 
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: selectedOrganization.settings?.branding?.primaryColor || '#3762c4' }}
                      />
                      <span className="text-gray-900 font-mono text-sm">
                        {selectedOrganization.settings?.branding?.primaryColor || '#3762c4'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Organization Details */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">Organization Details</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {getOrganizationSizeLabel(selectedOrganization.metadata?.size)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Region
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {selectedOrganization.metadata?.region || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {selectedOrganization.metadata?.timezone || 'UTC'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">Subscription</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plan
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getSubscriptionPlanLabel(selectedOrganization.subscription?.plan)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User Limit
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {selectedOrganization.subscription?.limits?.users || 'Not set'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Limit
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {selectedOrganization.subscription?.limits?.projects || 'Not set'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Storage Limit
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {selectedOrganization.subscription?.limits?.storage || 'Not set'} GB
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {formatDate(selectedOrganization.subscription?.startDate)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {formatDate(selectedOrganization.subscription?.endDate)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">Status</h3>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Status
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedOrganization.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedOrganization.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleViewClose}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleViewClose();
                  handleEdit(selectedOrganization);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                Edit Organization
              </button>
            </div>
          </div>
        </div>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <OrganizationForm
        open={formOpen}
        onClose={handleFormClose}
        organization={selectedOrganization}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default OrganizationList;
