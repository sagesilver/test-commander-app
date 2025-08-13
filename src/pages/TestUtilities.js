import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../services/authService';
import {
  Upload,
  Download,
  Database,
  BarChart3,
  Wrench,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

const TestUtilities = () => {
  const { currentUserData } = useAuth();
  const navigate = useNavigate();
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

  if (!currentUserData || !currentUserData.roles?.includes(USER_ROLES.APP_ADMIN)) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Access Denied</h2>
          <p className="text-red-600">You need to be an App Admin to access Test Utilities.</p>
          <p className="text-red-600 mt-2">Current user roles: {currentUserData?.roles?.join(', ') || 'None'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Test Utilities</h1>
        <p className="text-muted mt-2">Administrative tools for managing test data and system operations</p>
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

      {/* Utility Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {/* Test Import */}
        <div className="card transform transition-transform duration-200 hover:-translate-y-1 hover:bg-white/5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Upload className="w-5 h-5 text-[rgb(var(--tc-icon))]" /> Test Import
              </h3>
              <p className="text-menu text-sm">Generate test data files for import testing</p>
            </div>
            <button className="btn-primary-xs" onClick={() => navigate('/test-import')}>
              Open
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-menu">Last Generated</div>
              <div className="text-foreground font-medium">—</div>
            </div>
            <div>
              <div className="text-menu">Formats</div>
              <div className="text-foreground font-medium">CSV, XLSX, JSON</div>
            </div>
          </div>
        </div>

        {/* Test Export */}
        <div className="card transform transition-transform duration-200 hover:-translate-y-1 hover:bg-white/5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Download className="w-5 h-5 text-[rgb(var(--tc-icon))]" /> Test Export
              </h3>
              <p className="text-menu text-sm">Export test cases to various formats</p>
            </div>
            <button className="btn-primary-xs" onClick={() => navigate('/test-export')}>
              Open
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-menu">Last Export</div>
              <div className="text-foreground font-medium">—</div>
            </div>
            <div>
              <div className="text-menu">Formats</div>
              <div className="text-foreground font-medium">CSV, Excel</div>
            </div>
          </div>
        </div>

        {/* Data Migration */}
        <div className="card transform transition-transform duration-200 hover:-translate-y-1 hover:bg-white/5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Database className="w-5 h-5 text-[rgb(var(--tc-icon))]" /> Data Migration
              </h3>
              <p className="text-menu text-sm">Migrate data between environments</p>
            </div>
            <button className="btn-primary-xs" onClick={() => navigate('/data-migration')}>
              Open
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-menu">Last Migration</div>
              <div className="text-foreground font-medium">—</div>
            </div>
            <div>
              <div className="text-menu">Status</div>
              <div className="text-foreground font-medium">Ready</div>
            </div>
          </div>
        </div>

        {/* System Maintenance */}
        <div className="card transform transition-transform duration-200 hover:-translate-y-1 hover:bg-white/5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[rgb(var(--tc-icon))]" /> System Maintenance
              </h3>
              <p className="text-menu text-sm">Database cleanup and optimization</p>
            </div>
            <button className="btn-primary-xs" onClick={() => navigate('/system-maintenance')}>
              Open
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-menu">Last Cleanup</div>
              <div className="text-foreground font-medium">—</div>
            </div>
            <div>
              <div className="text-menu">Health</div>
              <div className="text-foreground font-medium">Good</div>
            </div>
          </div>
        </div>

        {/* Backup & Restore */}
        <div className="card transform transition-transform duration-200 hover:-translate-y-1 hover:bg-white/5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-[rgb(var(--tc-icon))]" /> Backup & Restore
              </h3>
              <p className="text-menu text-sm">System backup and recovery tools</p>
            </div>
            <button className="btn-primary-xs" onClick={() => navigate('/backup-restore')}>
              Open
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-menu">Last Backup</div>
              <div className="text-foreground font-medium">—</div>
            </div>
            <div>
              <div className="text-menu">Size</div>
              <div className="text-foreground font-medium">—</div>
            </div>
          </div>
        </div>

        {/* Performance Monitor */}
        <div className="card transform transition-transform duration-200 hover:-translate-y-1 hover:bg-white/5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[rgb(var(--tc-icon))]" /> Performance Monitor
              </h3>
              <p className="text-menu text-sm">System performance and metrics</p>
            </div>
            <button className="btn-primary-xs" onClick={() => navigate('/performance-monitor')}>
              Open
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-menu">Response Time</div>
              <div className="text-foreground font-medium">—</div>
            </div>
            <div>
              <div className="text-menu">Uptime</div>
              <div className="text-foreground font-medium">—</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestUtilities;
