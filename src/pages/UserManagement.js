import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserForm from '../components/UserForm';
import DataTable from '../components/table/DataTable';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  User, 
  Settings,
  Eye,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Calendar,
  Shield,
  Building
} from 'lucide-react';

const UserManagement = () => {
  const { currentUserData, getUsers, getOrganizations, createUser, updateUserById, deleteUserById } = useAuth();
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load data function
  const loadData = async () => {
    if (currentUserData) {
      try {
        const userList = await getUsers();
        const orgList = await getOrganizations();
        setUsers(userList || []);
        setOrganizations(orgList || []);
      } catch (error) {
        console.error('Error loading data:', error);
        setUsers([]);
        setOrganizations([]);
      }
    }
  };

  // Initialize users and organizations on component mount
  useEffect(() => {
    loadData();
  }, [currentUserData, getUsers, getOrganizations]);

  // Auto-hide success messages after 3 seconds
  useEffect(() => {
    if (message.type === 'success') {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  // Build lookups for table cells (declare before any early returns)
  const orgIdToName = useMemo(() => {
    const map = new Map();
    for (const org of organizations) {
      const key = org.organisationId || org.id;
      if (key) map.set(key, org.name || key);
    }
    return map;
  }, [organizations]);

  const tableData = useMemo(() => {
    return (users || []).map((u) => ({
      ...u,
      roleLabels: Array.isArray(u.roles) ? u.roles.join(', ') : '',
      organizationName: orgIdToName.get(u.organisationId) || '—',
    }));
  }, [users, orgIdToName]);

  const handleDeleteUser = async (userId) => {
    const userToDelete = users.find(user => user.userId === userId);
    if (window.confirm(`Are you sure you want to delete "${userToDelete?.name}"? This action cannot be undone.`)) {
      try {
        await deleteUserById(userId);
        console.log('User deleted:', userId);
        
        // Refresh the users list
        const userList = await getUsers();
        setUsers(userList || []);
        
        showMessage('success', `User "${userToDelete?.name}" deleted successfully!`);
      } catch (error) {
        console.error('Error deleting user:', error);
        showMessage('error', 'Failed to delete user. Please try again.');
      }
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    // Firestore Timestamp (client SDK)
    if (typeof value.toDate === 'function') {
      try {
        const d = value.toDate();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      } catch (_) {}
    }
    // Plain object with seconds/nanoseconds (e.g., serialized Timestamp)
    if (typeof value === 'object' && typeof value.seconds === 'number') {
      const d = new Date(value.seconds * 1000);
      if (isNaN(d.getTime())) return '—';
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    // ISO string or epoch
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Show loading state while checking authentication
  if (!currentUserData) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  // (memos declared above)

  // Check if user has permission to access user management
  const allowedRoles = ['APP_ADMIN', 'ORG_ADMIN'];
  if (!currentUserData?.roles?.some(role => allowedRoles.includes(role))) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Access Denied</h2>
          <p className="text-red-600">You don't have permission to access user management.</p>
          <p className="text-red-600 mt-2">Current user roles: {currentUserData?.roles?.join(', ') || 'None'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Success/Error Messages */}
      {message.type && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-900/20 border border-green-800 text-green-300' 
            : 'bg-red-900/20 border border-red-800 text-red-300'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            {currentUserData?.roles?.includes('APP_ADMIN') ? 'Global User Management' : 'User Management'}
          </h1>
          <p className="text-menu">
            {currentUserData?.roles?.includes('APP_ADMIN') 
              ? 'Manage all users across all organizations' 
              : 'Manage users within your organization'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-card rounded-lg shadow-lg border border-subtle">
        <div className="flex items-center justify-between p-4 bg-surface-muted border-b border-subtle">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-foreground">Users</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[rgb(var(--tc-icon))]/20 text-[rgb(var(--tc-contrast))]">
              {users.length} total
            </span>
          </div>
        </div>
        <div className="w-full">
          <DataTable
            data={tableData}
            defaultPageSize={10}
            pageSizeOptions={[10, 25, 50]}
            emptyMessage={users.length ? 'No users' : 'No users'}
            columns={[
              { id: 'name', header: 'Name', accessorKey: 'name', size: 220, filterType: 'text', cell: ({ getValue }) => (
                <span className="text-foreground font-medium truncate" title={getValue()}>{getValue()}</span>
              )},
              { id: 'email', header: 'Email', accessorKey: 'email', size: 260, filterType: 'text', cell: ({ getValue }) => (
                <span className="text-menu truncate" title={getValue()}>{getValue()}</span>
              )},
              { id: 'roles', header: 'Roles', accessorKey: 'roleLabels', size: 220, filterType: 'text', cell: ({ getValue }) => (
                <span className="text-menu truncate" title={getValue()}>{getValue()}</span>
              )},
              { id: 'organization', header: 'Organization', accessorKey: 'organizationName', size: 220, filterType: 'text', cell: ({ getValue }) => (
                <span className="text-menu truncate" title={getValue()}>{getValue()}</span>
              )},
              { id: 'status', header: 'Status', accessorKey: 'isActive', size: 120, filterType: 'select', cell: ({ getValue }) => (
                <span className={`inline-flex items-center h-7 px-2 rounded-full text-sm font-medium ${getValue() !== false ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                  {getValue() !== false ? 'Active' : 'Inactive'}
                </span>
              )},
              { id: 'createdAt', header: 'Created', accessorKey: 'createdAt', size: 160, filterType: 'text', cell: ({ getValue }) => (
                <span className="text-menu">{formatDate(getValue())}</span>
              )},
              { id: 'actions', header: 'Actions', size: 140, enableSorting: false, enableColumnFilter: false, cell: ({ row }) => (
                <div className="h-full flex items-center space-x-1">
                  {row.original.userId !== currentUserData?.userId && (
                    <button
                      className="p-1.5 text-menu hover:text-red-300 hover:bg-red-900/20 rounded transition-all duration-200"
                      title="Delete User"
                      onClick={() => handleDeleteUser(row.original.userId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )},
            ]}
            className="text-foreground"
          />
        </div>
      </div>

      {/* User Form Modal */}
      <UserForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(newUser) => {
          showMessage('success', `User "${newUser.name}" created successfully!`);
          // Refresh the users list
          loadData();
        }}
      />

    </div>
  );
};

export default UserManagement; 