import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserForm from '../components/UserForm';
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
  const { currentUserData, getUsers, getOrganizations, createUser, updateUser, deleteUserById } = useAuth();
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





  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Show loading state while checking authentication
  if (!currentUserData) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

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
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentUserData?.roles?.includes('APP_ADMIN') ? 'Global User Management' : 'User Management'}
          </h1>
          <p className="text-gray-600">
            {currentUserData?.roles?.includes('APP_ADMIN') 
              ? 'Manage all users across all organizations' 
              : 'Manage users within your organization'
            }
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Add User
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(users || []).map((user) => {
          const userOrg = organizations.find(org => org.organisationId === user.organisationId);
          return (
            <div key={user.userId} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {user.userId !== currentUserData?.userId && (
                    <button
                      onClick={() => handleDeleteUser(user.userId)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield size={16} />
                  <span className="capitalize">{user.roles.map(role => role.replace('_', ' ').toLowerCase()).join(', ')}</span>
                </div>
                
                {user.organisationId && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building size={16} />
                    <span>{userOrg?.name || 'Unknown Organization'}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={16} />
                  <span>Created: {formatDate(user.createdAt)}</span>
                </div>

                {user.profile.department && (
                  <div className="text-sm text-gray-600">
                    <p><strong>Department:</strong> {user.profile.department}</p>
                    <p><strong>Position:</strong> {user.profile.position}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {user.userId === currentUserData?.userId && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      Current User
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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