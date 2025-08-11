import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../services/authService';
import { organizationService } from '../services/organizationService';
import OrganizationPanel from './OrganizationPanel';
import UserForm from './UserForm';
import OrganizationForm from './organizations/OrganizationForm';
import {
  Plus,
  Building,
  CheckCircle,
  AlertCircle,
  XCircle,
  Users,
  FileText,
  BarChart3,
  Clipboard
} from 'lucide-react';

const SuperUserDashboard = () => {
  const { currentUserData, getOrganizations } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [openOrgDialog, setOpenOrgDialog] = useState(false);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openOrgViewDialog, setOpenOrgViewDialog] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });
  const [organizationStats, setOrganizationStats] = useState({});

  useEffect(() => {
    // Load organizations from Firestore
    loadData();
  }, []);

  const loadData = async () => {
    let loadedOrgs = [];
    try {
      // Load organizations from Firestore
      loadedOrgs = await getOrganizations();
      setOrganizations(loadedOrgs);
      setAlert({ show: false, message: '', severity: 'success' });
    } catch (error) {
      console.error('Error loading data:', error);
      setAlert({
        show: true,
        message: 'Error loading organizations',
        severity: 'error',
      });
      return; // Do not attempt stats if orgs failed to load
    }

    // Fetch stats for each organization (users/projects) but never block UI
    try {
      // Use the freshly loaded organizations we just fetched above
      const orgsForStats = Array.isArray(loadedOrgs) ? loadedOrgs : [];
      if (orgsForStats.length > 0) {
        const statsPromises = orgsForStats.map((org) => {
          const orgKey = org.organisationId || org.id;
          return organizationService.getOrganizationStats(orgKey);
        });
        const results = await Promise.allSettled(statsPromises);
        const statsMap = {};
        orgsForStats.forEach((org, index) => {
          const res = results[index];
          const value = res.status === 'fulfilled' ? res.value : { totalUsers: 0, totalProjects: 0 };
          const keyByOrganisationId = org.organisationId;
          const keyById = org.id;
          if (keyByOrganisationId) {
            statsMap[keyByOrganisationId] = value;
          }
          if (keyById) {
            statsMap[keyById] = value;
          }
        });
        setOrganizationStats(statsMap);
      } else {
        setOrganizationStats({});
      }
    } catch (statsError) {
      console.warn('Organization stats unavailable:', statsError);
    }
  };

  // Derived totals for placeholder panels
  const totalOrganizations = Array.isArray(organizations) ? organizations.length : 0;
  const totalsFromStats = Object.values(organizationStats || {}).reduce(
    (acc, s) => {
      return {
        users: acc.users + (s?.totalUsers || 0),
        projects: acc.projects + (s?.totalProjects || 0),
      };
    },
    { users: 0, projects: 0 }
  );

  const handleOrganizationClick = (organization) => {
    // Open organization in view mode - same as View Details button
    setSelectedOrg(organization);
    setOpenOrgViewDialog(true);
  };

  const handleUserCreated = (newUser) => {
    // No alert needed on dashboard, as the UserForm now displays the success message and stays open.
    // Reload data to show the new user
    loadData();
  };

  const handleOrganizationCreated = (newOrg) => {
    setAlert({
      show: true,
      message: 'Organization created successfully!',
      severity: 'success',
    });
    
    // Reload data to show the new organization
    loadData();
  };

  const handleViewClose = () => {
    setOpenOrgViewDialog(false);
    setSelectedOrg(null);
  };

  if (!currentUserData || !currentUserData.roles?.includes(USER_ROLES.APP_ADMIN)) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Access Denied</h2>
          <p className="text-red-600">You need to be an App Admin to access this dashboard.</p>
          <p className="text-red-600 mt-2">Current user roles: {currentUserData?.roles?.join(', ') || 'None'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Super User Dashboard</h1>
        <p className="text-muted mt-2">Welcome, {currentUserData.name}</p>
      </div>
      
      {/* Removed System Config: Test Types panel per requirement */}
      {/* Alert Messages */}
      {alert.show && (
        <div className={`p-4 rounded-lg mb-6 flex items-center space-x-2 ${
          alert.severity === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {alert.severity === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{alert.message}</span>
          <button
            onClick={() => setAlert({ ...alert, show: false })}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setOpenOrgDialog(true)}
          className="px-4 py-2 bg-[rgb(var(--tc-icon))] text-white rounded-lg hover:brightness-110 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Organization</span>
        </button>
        <button
          onClick={() => navigate('/projects')}
          className="px-4 py-2 bg-[rgb(var(--tc-icon))] text-white rounded-lg hover:brightness-110 transition-colors flex items-center space-x-2"
          title="Create Project"
        >
          <FileText className="h-4 w-4" />
          <span>Create Project</span>
        </button>
        <button
          onClick={() => setOpenUserDialog(true)}
          className="px-4 py-2 bg-surface-muted text-white border border-subtle rounded-lg hover:bg-white/10 hover:border-white/20 transition-colors flex items-center space-x-2"
        >
          <Users className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Overview Panels (placeholders) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {/* Organizations */}
        <div className="card transform transition-transform duration-200 hover:-translate-y-1 hover:bg-white/5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2"><Building className="w-5 h-5 text-[rgb(var(--tc-icon))]" /> Organizations</h3>
              <p className="text-menu text-sm">Manage tenants, branding and limits</p>
            </div>
            <button className="btn-primary-xs" onClick={() => navigate('/organizations')}>Open</button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-menu">Total</div>
              <div className="text-foreground font-medium">{totalOrganizations}</div>
            </div>
            <div>
              <div className="text-menu">With activity</div>
              <div className="text-foreground font-medium">{totalOrganizations}</div>
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className="card transform transition-transform duration-200 hover:-translate-y-1 hover:bg-white/5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2"><FileText className="w-5 h-5 text-[rgb(var(--tc-icon))]" /> Projects</h3>
              <p className="text-menu text-sm">Portfolio overview across orgs</p>
            </div>
            <button className="btn-primary-xs" onClick={() => navigate('/projects')}>Open</button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-menu">Total</div>
              <div className="text-foreground font-medium">{totalsFromStats.projects}</div>
            </div>
            <div>
              <div className="text-menu">Active</div>
              <div className="text-foreground font-medium">—</div>
            </div>
          </div>
        </div>

        {/* Users */}
        <div className="card transform transition-transform duration-200 hover:-translate-y-1 hover:bg-white/5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2"><Users className="w-5 h-5 text-[rgb(var(--tc-icon))]" /> Users</h3>
              <p className="text-menu text-sm">Administer users and roles</p>
            </div>
            <button className="btn-primary-xs" onClick={() => navigate('/user-management')}>Open</button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-menu">Total</div>
              <div className="text-foreground font-medium">{totalsFromStats.users}</div>
            </div>
            <div>
              <div className="text-menu">Active</div>
              <div className="text-foreground font-medium">—</div>
            </div>
          </div>
        </div>

        {/* Tests */}
        <div className="card transform transition-transform duration-200 hover:-translate-y-1 hover:bg-white/5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2"><Clipboard className="w-5 h-5 text-[rgb(var(--tc-icon))]" /> Tests</h3>
              <p className="text-menu text-sm">Design, execution and coverage</p>
            </div>
            <button className="btn-primary-xs" onClick={() => navigate('/test-cases')}>Open</button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-menu">Total Cases</div>
              <div className="text-foreground font-medium">—</div>
            </div>
            <div>
              <div className="text-menu">Executed</div>
              <div className="text-foreground font-medium">—</div>
            </div>
          </div>
        </div>

        {/* Defects */}
        <div className="card transform transition-transform duration-200 hover:-translate-y-1 hover:bg-white/5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2"><AlertCircle className="w-5 h-5 text-[rgb(var(--tc-icon))]" /> Defects</h3>
              <p className="text-menu text-sm">Tracking and triage</p>
            </div>
            <button className="btn-primary-xs" onClick={() => navigate('/defects')}>Open</button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-menu">Open</div>
              <div className="text-foreground font-medium">—</div>
            </div>
            <div>
              <div className="text-menu">Closed</div>
              <div className="text-foreground font-medium">—</div>
            </div>
          </div>
        </div>

        {/* Reports */}
        <div className="card transform transition-transform duration-200 hover:-translate-y-1 hover:bg-white/5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[rgb(var(--tc-icon))]" /> Reports</h3>
              <p className="text-menu text-sm">Analytics and insights</p>
            </div>
            <button className="btn-primary-xs" onClick={() => navigate('/reports')}>Open</button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-menu">Dashboards</div>
              <div className="text-foreground font-medium">—</div>
            </div>
            <div>
              <div className="text-menu">Exports</div>
              <div className="text-foreground font-medium">—</div>
            </div>
          </div>
        </div>
      </div>


      {/* Organizations panel grid moved to Organizations page */}

      {/* Organization View Modal */}
      <OrganizationForm
        open={openOrgViewDialog}
        onClose={handleViewClose}
        organization={selectedOrg}
        onSuccess={handleOrganizationCreated}
        isViewMode={true}
      />

      {/* Organization Create Modal */}
      <OrganizationForm
        open={openOrgDialog}
        onClose={() => setOpenOrgDialog(false)}
        onSuccess={handleOrganizationCreated}
      />

      {/* User Form Modal */}
      <UserForm
        isOpen={openUserDialog}
        onClose={() => setOpenUserDialog(false)}
        onSuccess={handleUserCreated}
      />
    </div>
  );
};

export default SuperUserDashboard;
