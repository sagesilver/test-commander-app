import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../services/authService';
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
} from 'lucide-react';

const SuperUserDashboard = () => {
  const { currentUserData, getOrganizations } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [openOrgDialog, setOpenOrgDialog] = useState(false);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openOrgViewDialog, setOpenOrgViewDialog] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

  useEffect(() => {
    // Load organizations from Firestore
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load organizations from Firestore
      const orgs = await getOrganizations();
      setOrganizations(orgs);
    } catch (error) {
      console.error('Error loading data:', error);
      setAlert({
        show: true,
        message: 'Error loading organizations',
        severity: 'error',
      });
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Super User Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome, {currentUserData.name}</p>
      </div>

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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Organization</span>
        </button>
        <button
          onClick={() => setOpenUserDialog(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Users className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Organizations Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Building className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Organizations</h2>
            <span className="text-sm text-gray-500">({organizations.length} total)</span>
          </div>
        </div>

        {/* Organization Panels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {organizations.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No organizations found</p>
              <p className="text-sm">Create your first organization to get started</p>
            </div>
          ) : (
            organizations.map((org) => (
              <OrganizationPanel
                key={org.organisationId}
                organization={org}
                stats={{
                  totalUsers: 0, // This will be calculated when we have user data
                  totalProjects: 0 // This will be calculated when we have project data
                }}
                onClick={handleOrganizationClick}
              />
            ))
          )}
        </div>
      </div>

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
