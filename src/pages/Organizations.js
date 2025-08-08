import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import OrganizationList from '../components/organizations/OrganizationList';

const Organizations = () => {
  const { currentUser, currentUserData, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading || !currentUser) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  // Check if user has permission to access organizations
  if (!currentUserData?.roles?.includes('APP_ADMIN')) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Access Denied</h2>
          <p className="text-red-600">You don't have permission to access organization management.</p>
          <p className="text-red-600 mt-2">Current user roles: {currentUserData?.roles?.join(', ') || 'None'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <OrganizationList />
    </div>
  );
};

export default Organizations; 