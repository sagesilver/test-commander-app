import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthTest = () => {
  const { currentUser, currentUserData, currentOrganization } = useAuth();

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold text-charcoal mb-4">Authentication Test</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-slate mb-2">Firebase User (currentUser)</h3>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <pre>{JSON.stringify(currentUser, null, 2)}</pre>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-slate mb-2">User Data (currentUserData)</h3>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <pre>{JSON.stringify(currentUserData, null, 2)}</pre>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-slate mb-2">Organization (currentOrganization)</h3>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <pre>{JSON.stringify(currentOrganization, null, 2)}</pre>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="font-medium text-slate mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => window.setupTestCommanderAppAdmin()}
              className="btn-primary text-sm"
            >
              Setup App Admin Record
            </button>
            <button
              onClick={() => window.verifyTestCommanderDeployment()}
              className="btn-secondary text-sm ml-2"
            >
              Verify Deployment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTest;

