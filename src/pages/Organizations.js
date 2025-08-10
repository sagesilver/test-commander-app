import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import OrganizationList from '../components/organizations/OrganizationList';

const Organizations = () => {
  const { currentUser, currentUserData, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading || !currentUser) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(var(--tc-icon))]"></div>
        </div>
      </div>
    );
  }

  // Check if user has permission to access organizations
  if (!currentUserData?.roles?.includes('APP_ADMIN')) {
    return (
      <div className="p-6">
        <div className="bg-card border border-subtle rounded-lg p-4">
          <h2 className="text-foreground font-semibold">Access Denied</h2>
          <p className="text-menu">You don't have permission to access organization management.</p>
          <p className="text-red-400 mt-2">Current user roles: {currentUserData?.roles?.join(', ') || 'None'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-foreground">Organizations</h1>
        <p className="text-menu">Manage organizations across the system</p>
      </div>
      <OrganizationList />
    </div>
  );
};

export default Organizations; 