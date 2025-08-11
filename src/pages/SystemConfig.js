import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Settings, ListChecks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SystemConfig() {
  const { currentUserData } = useAuth();
  const navigate = useNavigate();
  const isAppAdmin = Array.isArray(currentUserData?.roles) && currentUserData.roles.includes('APP_ADMIN');

  if (!isAppAdmin) {
    return (
      <div className="p-6">
        <div className="bg-card border border-subtle rounded-lg p-4">
          <h2 className="text-foreground font-semibold">Access Denied</h2>
          <p className="text-menu">You need to be an App Admin to access System Configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-[rgb(var(--tc-icon))]" />
        <h1 className="text-3xl font-semibold text-foreground">System Configuration</h1>
      </div>
      <p className="text-menu">Manage global reference data and platform features.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg border border-subtle p-6">
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="w-5 h-5 text-[rgb(var(--tc-icon))]" />
            <h3 className="text-lg font-semibold text-foreground">Test Types (Global)</h3>
          </div>
          <p className="text-menu mb-4">Maintain the global Test Types catalogue and associated icons.</p>
          <button className="btn-primary text-sm" onClick={() => navigate('/admin/global/test-types')}>Open</button>
        </div>
      </div>
    </div>
  );
}


