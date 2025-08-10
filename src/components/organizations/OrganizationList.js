import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { organizationService } from '../../services/organizationService';
import DataTable from '../table/DataTable';
// Replaced MUI Snackbar/Alert and Icons with simple equivalents
import { Edit, Trash2, Eye, Plus, Building, Mail as Email, XCircle, CheckCircle, Settings, CreditCard, Palette, Grid, List } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  useEffect(() => {
    loadOrganizations();
  }, [showOnlyActive]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      // Load organizations directly from Firestore database
      let orgs = await organizationService.getAllOrganizations();
      if (showOnlyActive) {
        orgs = orgs.filter((o) => o.isActive !== false);
      }
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
    {
      id: 'name',
      header: 'Organization',
      accessorKey: 'name',
      size: 220,
      filterType: 'text',
      cell: ({ getValue }) => (
        <span className="text-foreground font-medium truncate" title={getValue()}>{getValue()}</span>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      size: 320,
      filterType: 'text',
      cell: ({ getValue }) => (
        <span className="text-menu truncate" title={getValue()}>{getValue()}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'isActive',
      size: 120,
      filterType: 'select',
      cell: ({ getValue }) => (
        <span
          className={`inline-flex items-center h-7 px-2 rounded-full text-sm font-medium ${
            getValue()
              ? 'bg-green-900/20 text-green-400'
              : 'bg-red-900/20 text-red-400'
          }`}
        >
          {getValue() ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      id: 'users',
      header: 'Users',
      accessorKey: 'organisationId',
      size: 110,
      cell: ({ getValue }) => {
        const s = stats[getValue()];
        return <span className="text-menu">{s ? `${s.activeUsers}/${s.totalUsers}` : '0/0'}</span>;
      },
    },
    {
      id: 'projects',
      header: 'Projects',
      accessorKey: 'organisationId',
      size: 110,
      cell: ({ getValue }) => {
        const s = stats[getValue()];
        return <span className="text-menu">{s ? `${s.activeProjects}/${s.totalProjects}` : '0/0'}</span>;
      },
    },
    {
      id: 'subscription',
      header: 'Plan',
      accessorKey: 'subscription.plan',
      size: 140,
      filterType: 'select',
      cell: ({ getValue }) => {
        const value = (getValue() || 'free').toLowerCase();
        const classes =
          value === 'enterprise'
            ? 'bg-[rgb(var(--tc-icon))]/20 text-[rgb(var(--tc-contrast))]'
            : value === 'premium'
            ? 'bg-purple-900/20 text-purple-300'
            : value === 'basic' || value === 'free'
            ? 'bg-white/5 text-menu'
            : 'bg-white/5 text-menu';
        return (
          <span className={`inline-flex items-center h-7 px-2 rounded-full text-sm font-medium ${classes}`}>
            {getSubscriptionPlanLabel(value)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 200,
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div className="h-full flex items-center space-x-1">
          <button
            className="p-1.5 text-menu hover:text-white hover:bg-white/10 rounded transition-all duration-200"
            title="View Details"
            onClick={() => handleView(row.original)}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 text-menu hover:text-white hover:bg-white/10 rounded transition-all duration-200"
            title="Edit Organization"
            onClick={() => handleEdit(row.original)}
          >
            <Edit className="w-4 h-4" />
          </button>
          {row.original.isActive ? (
            <button
              className="p-1.5 text-menu hover:text-red-300 hover:bg-red-900/20 rounded transition-all duration-200"
              title="Deactivate Organization"
              onClick={() => handleDelete(row.original)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              className="p-1.5 text-menu hover:text-white hover:bg-white/10 rounded transition-all duration-200"
              title="Reactivate Organization"
              onClick={() => handleRestore(row.original)}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg shadow-lg border border-subtle">
        <div className="flex items-center justify-between p-4 bg-surface-muted border-b border-subtle">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-foreground">Organizations</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[rgb(var(--tc-icon))]/20 text-[rgb(var(--tc-contrast))]">
              {organizations.length} total
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex rounded-lg border border-subtle overflow-hidden" role="tablist" aria-label="View mode">
              <button
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-2 text-sm ${viewMode === 'table' ? 'bg-white/10 text-white' : 'text-menu hover:text-white hover:bg-white/10'}`}
                aria-pressed={viewMode === 'table'}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Grid View"
                className={`p-2 text-sm border-l border-subtle ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-menu hover:text-white hover:bg-white/10'}`}
                aria-pressed={viewMode === 'grid'}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
            <label className="flex items-center ml-3 select-none" title="Show only Active organizations">
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
            {currentUserData?.roles.includes('APP_ADMIN') && (
              <button
                onClick={handleCreate}
                className="btn-primary flex items-center space-x-2"
                title="Create Organization"
              >
                <Plus className="w-4 h-4" />
                <span>Create Organization</span>
              </button>
            )}
          </div>
        </div>
        {viewMode === 'table' ? (
          <div className="w-full">
            <DataTable
              data={organizations}
              columns={columns}
              defaultPageSize={10}
              pageSizeOptions={[10, 25, 50]}
              emptyMessage={loading ? 'Loading…' : 'No organizations'}
              className="text-foreground"
            />
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organizations.map((org) => {
                const s = stats[org.organisationId] || {};
                return (
                  <div key={org.organisationId} className="bg-card border border-subtle rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-foreground font-semibold">{org.name}</h4>
                        <p className="text-sm text-menu line-clamp-2">{org.description || '—'}</p>
                      </div>
                      <span className={`h-7 px-2 rounded-full text-xs font-medium ${org.isActive !== false ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>{org.isActive !== false ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-menu">Users</div>
                        <div className="text-foreground font-medium">{s.activeUsers || 0}/{s.totalUsers || 0}</div>
                      </div>
                      <div>
                        <div className="text-menu">Projects</div>
                        <div className="text-foreground font-medium">{s.activeProjects || 0}/{s.totalProjects || 0}</div>
                      </div>
                      <div>
                        <div className="text-menu">Plan</div>
                        <div className="text-foreground font-medium capitalize">{(org.subscription?.plan || 'free')}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-2">
                      <button
                        className="p-1.5 text-menu hover:text-white hover:bg-white/10 rounded"
                        title="View Details"
                        onClick={() => handleView(org)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-menu hover:text-white hover:bg-white/10 rounded"
                        title="Edit Organization"
                        onClick={() => handleEdit(org)}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {org.isActive !== false ? (
                        <button
                          className="p-1.5 text-menu hover:text-red-300 hover:bg-red-900/20 rounded"
                          title="Deactivate Organization"
                          onClick={() => handleDelete(org)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          className="p-1.5 text-menu hover:text-white hover:bg-white/10 rounded"
                          title="Reactivate Organization"
                          onClick={() => handleRestore(org)}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* View Organization Modal */}
      {viewOpen && selectedOrganization && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-subtle rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-surface-muted border-b border-subtle">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Building className="h-6 w-6 text-[rgb(var(--tc-icon))]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {selectedOrganization.name}
                  </h2>
                  <p className="text-sm text-menu">
                    Organization details and settings
                  </p>
                </div>
              </div>
              <button
                onClick={handleViewClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="h-6 w-6 text-menu" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                  <h3 className="text-lg font-medium text-foreground">Basic Information</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Description
                    </label>
                      <div className="px-4 py-3 bg-surface-muted border border-subtle rounded-lg text-foreground view-field">
                      {selectedOrganization.description || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Industry
                    </label>
                      <div className="px-4 py-3 bg-surface-muted border border-subtle rounded-lg text-foreground view-field">
                      {selectedOrganization.metadata?.industry || 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Email className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                  <h3 className="text-lg font-medium text-foreground">Contact Information</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <div className="px-4 py-3 bg-surface-muted border border-subtle rounded-lg text-foreground view-field">
                      {selectedOrganization.contactInfo?.email || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone
                    </label>
                    <div className="px-4 py-3 bg-surface-muted border border-subtle rounded-lg text-foreground view-field">
                      {selectedOrganization.contactInfo?.phone || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Website
                    </label>
                    <div className="px-4 py-3 bg-surface-muted border border-subtle rounded-lg text-foreground view-field">
                      {selectedOrganization.contactInfo?.website ? (
                        <a 
                          href={selectedOrganization.contactInfo.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                           className="text-[rgb(var(--tc-contrast))] hover:brightness-110 underline"
                        >
                          {selectedOrganization.contactInfo.website}
                        </a>
                      ) : 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Address
                    </label>
                    <div className="px-4 py-3 bg-surface-muted border border-subtle rounded-lg text-foreground view-field">
                      {selectedOrganization.contactInfo?.address || 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Organization Settings */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                  <h3 className="text-lg font-medium text-foreground">Organization Settings</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Default User Role
                    </label>
                    <div className="px-4 py-3 bg-surface-muted border border-subtle rounded-lg text-foreground view-field">
                      {selectedOrganization.settings?.defaultUserRole || 'Not set'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Max Users
                    </label>
                    <div className="px-4 py-3 bg-surface-muted border border-subtle rounded-lg text-foreground view-field">
                      {selectedOrganization.settings?.maxUsers || 'Not set'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Max Projects
                    </label>
                    <div className="px-4 py-3 bg-surface-muted border border-subtle rounded-lg text-foreground view-field">
                      {selectedOrganization.settings?.maxProjects || 'Not set'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Branding & Customization */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Palette className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                  <h3 className="text-lg font-medium text-foreground">Branding & Customization</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Logo URL
                    </label>
                    <div className="px-4 py-3 bg-surface-muted border border-subtle rounded-lg text-foreground view-field">
                      {selectedOrganization.settings?.branding?.logo ? (
                        <a 
                          href={selectedOrganization.settings.branding.logo} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[rgb(var(--tc-contrast))] hover:brightness-110 underline"
                        >
                          {selectedOrganization.settings.branding.logo}
                        </a>
                      ) : 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center space-x-3 px-4 py-3 bg-surface-muted border border-subtle rounded-lg view-field">
                      <div 
                        className="w-6 h-6 rounded border border-subtle"
                        style={{ backgroundColor: selectedOrganization.settings?.branding?.primaryColor || '#3762c4' }}
                      />
                      <span className="text-foreground font-mono text-sm">
                        {selectedOrganization.settings?.branding?.primaryColor || '#3762c4'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Organization Details */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                  <h3 className="text-lg font-medium text-foreground">Organization Details</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Size
                    </label>
                    <div className="px-4 py-3 bg-surface-muted border border-subtle rounded-lg text-foreground view-field">
                      {getOrganizationSizeLabel(selectedOrganization.metadata?.size)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Region
                    </label>
                    <div className="px-4 py-3 bg-surface-muted border border-subtle rounded-lg text-foreground view-field">
                      {selectedOrganization.metadata?.region || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Timezone
                    </label>
                    <div className="px-4 py-3 bg-surface-muted border border-subtle rounded-lg text-foreground view-field">
                      {selectedOrganization.metadata?.timezone || 'UTC'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                  <h3 className="text-lg font-medium text-foreground">Subscription</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Plan
                    </label>
                    <div className="px-4 py-3 bg-surface-muted border border-subtle rounded-lg view-field">
                      <span className="inline-flex items-center h-7 px-2 rounded-full text-sm font-medium bg-white/5 text-menu">
                        {getSubscriptionPlanLabel(selectedOrganization.subscription?.plan)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      User Limit
                    </label>
                    <div className="px-4 py-3 bg-surface-muted border border-subtle rounded-lg text-foreground view-field">
                      {selectedOrganization.subscription?.limits?.users || 'Not set'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Project Limit
                    </label>
                    <div className="px-4 py-3 bg-surface-muted border border-subtle rounded-lg text-foreground view-field">
                      {selectedOrganization.subscription?.limits?.projects || 'Not set'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Storage Limit
                    </label>
                    <div className="px-4 py-3 bg-surface-muted border border-subtle rounded-lg text-foreground view-field">
                      {selectedOrganization.subscription?.limits?.storage || 'Not set'} GB
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Start Date
                    </label>
                    <div className="px-4 py-3 bg-surface-muted border border-subtle rounded-lg text-foreground view-field">
                      {formatDate(selectedOrganization.subscription?.startDate)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      End Date
                    </label>
                    <div className="px-4 py-3 bg-surface-muted border border-subtle rounded-lg text-foreground view-field">
                      {formatDate(selectedOrganization.subscription?.endDate)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                  <h3 className="text-lg font-medium text-foreground">Status</h3>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Organization Status
                  </label>
                  <div className="px-4 py-3 bg-surface-muted border border-subtle rounded-lg">
                    <span className={`inline-flex items-center h-7 px-2 rounded-full text-sm font-medium ${
                      selectedOrganization.isActive 
                        ? 'bg-green-900/20 text-green-400' 
                        : 'bg-red-900/20 text-red-400'
                    }`}>
                      {selectedOrganization.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-subtle">
              <button
                type="button"
                onClick={handleViewClose}
                className="px-6 py-3 bg-card text-white border border-subtle rounded-lg hover:bg-surface-muted focus:ring-2 focus:ring-[rgb(var(--tc-contrast))] transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleViewClose();
                  handleEdit(selectedOrganization);
                }}
                className="btn-primary"
              >
                Edit Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {snackbar.open && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-white ${snackbar.severity === 'error' ? 'bg-red-600' : snackbar.severity === 'success' ? 'bg-green-600' : 'bg-slate-700'}`} role="status">
          <div className="flex items-center gap-3">
            <span className="text-sm">{snackbar.message}</span>
            <button className="ml-2 text-white/90 hover:text-white" onClick={() => setSnackbar({ ...snackbar, open: false })} aria-label="Close notification">✕</button>
          </div>
        </div>
      )}

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
