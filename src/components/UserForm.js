import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  XCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Building,
  Shield,
  User,
  Mail,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createUser, getAvailableRoles, validateUserCreationPermissions } from '../services/userService';
import { USER_ROLES } from '../services/authService';

const UserForm = ({ isOpen, onClose, onSuccess }) => {
  const { currentUserData, getOrganizations } = useAuth();
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roles: [],
    organisationId: '',
    profile: {
      department: '',
      position: '',
      phone: '',
    },
  });

  // Load organizations and available roles on component mount
  useEffect(() => {
    if (isOpen && currentUserData) {
      loadFormData();
    }
  }, [isOpen, currentUserData]);

  const loadFormData = async () => {
    try {
      // Load organizations
      const orgs = await getOrganizations();
      setOrganizations(orgs);

      // Set available roles based on current user permissions
      const roles = getAvailableRoles(currentUserData.roles);
      setAvailableRoles(roles);

      // Set default organization for Org Admins
      if (currentUserData.roles.includes(USER_ROLES.ORG_ADMIN) && currentUserData.organisationId) {
        setFormData(prev => ({
          ...prev,
          organisationId: currentUserData.organisationId,
        }));
      }
    } catch (error) {
      console.error('Error loading form data:', error);
      setMessage({ type: 'error', text: 'Error loading form data' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.roles.length === 0) {
      newErrors.roles = 'At least one role must be selected';
    }

    if (!formData.organisationId) {
      newErrors.organisationId = 'Organization is required';
    }

    // Validate permissions
    if (currentUserData && formData.organisationId) {
      const hasPermission = validateUserCreationPermissions(
        currentUserData.roles,
        formData.roles,
        currentUserData.organisationId,
        formData.organisationId
      );

      if (!hasPermission) {
        newErrors.roles = 'You do not have permission to create users with these roles in this organization';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        roles: formData.roles,
        organisationId: formData.organisationId,
        profile: formData.profile,
        isActive: true,
      };

      console.log('Creating user with data:', userData);
      const result = await createUser(userData, currentUserData.userId);
      console.log('User creation result:', result);

      if (result && result.success) {
        setMessage({ 
          type: 'success', 
          text: result.message || 'User created successfully!'
        });
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          roles: [],
          organisationId: currentUserData.roles.includes(USER_ROLES.ORG_ADMIN) ? currentUserData.organisationId : '',
          profile: {
            department: '',
            position: '',
            phone: '',
          },
        });

        // Call success callback
        if (onSuccess) {
          onSuccess(result.user);
        }

        // Don't auto-close - let admin see the reset link and copy it
        // setTimeout(() => {
        //   onClose();
        // }, 2000);
      } else {
        throw new Error('User creation failed - no success response');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to create user' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleProfileChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value,
      },
    }));
  };

  const handleRoleChange = (role, checked) => {
    setFormData(prev => ({
      ...prev,
      roles: checked
        ? [...prev.roles, role]
        : prev.roles.filter(r => r !== role),
    }));

    // Clear role error when user makes changes
    if (errors.roles) {
      setErrors(prev => ({
        ...prev,
        roles: '',
      }));
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setFormData(prev => ({
      ...prev,
      password,
      confirmPassword: password,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-subtle rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-subtle">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <UserPlus className="h-6 w-6 text-[rgb(var(--tc-icon))]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Add New User
              </h2>
              <p className="text-sm text-muted">
                Create a new user account with appropriate roles and permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XCircle className="h-6 w-6 text-menu" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Message Display */}
          {message.text && (
            <div className={`p-4 rounded-lg flex items-center space-x-2 ${
              message.type === 'success' 
                ? 'bg-green-900/20 text-green-300 border border-green-700' 
                : 'bg-red-900/20 text-red-300 border border-red-700'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
                          <span>{message.text}</span>
          </div>
        )}

        

        {/* Basic Information Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
              <h3 className="text-lg font-medium text-foreground">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`input-field ${errors.name ? 'border-red-400' : ''}`}
                  placeholder="Enter full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[rgb(var(--tc-icon))]" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`input-field pl-10 pr-4 ${errors.email ? 'border-red-400' : ''}`}
                    placeholder="user@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Authentication Notice */}
          <div className="bg-surface-muted border border-subtle rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
              <h3 className="text-sm font-medium text-foreground">Password Setup</h3>
            </div>
            <p className="text-sm text-menu mt-1">
              A password reset email will be sent automatically to the user when you create their account.
            </p>
          </div>

          {/* Organization & Roles Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
              <h3 className="text-lg font-medium text-foreground">Organization & Roles</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Organization *
                </label>
                <select
                  value={formData.organisationId}
                  onChange={(e) => handleInputChange('organisationId', e.target.value)}
                  className={`input-field ${errors.organisationId ? 'border-red-400' : ''}`}
                  disabled={currentUserData?.roles.includes(USER_ROLES.ORG_ADMIN)}
                >
                  <option value="">Select Organization</option>
                  {organizations.map(org => (
                    <option key={org.organisationId} value={org.organisationId}>
                      {org.name}
                    </option>
                  ))}
                </select>
                {errors.organisationId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {errors.organisationId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Roles *
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-subtle rounded-lg p-3 bg-card">
                  {availableRoles.map(role => (
                    <label key={role.value} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        value={role.value}
                        checked={formData.roles.includes(role.value)}
                        onChange={(e) => handleRoleChange(role.value, e.target.checked)}
                        className="rounded border-subtle text-[rgb(var(--tc-icon))] focus:ring-[rgb(var(--tc-icon))]"
                      />
                      <div>
                        <div className="font-medium text-foreground">{role.label}</div>
                        <div className="text-sm text-menu">{role.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.roles && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {errors.roles}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Profile Information Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
              <h3 className="text-lg font-medium text-foreground">Profile Information</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.profile.department}
                  onChange={(e) => handleProfileChange('department', e.target.value)}
                  className="input-field"
                  placeholder="e.g., IT, QA, Development"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Position
                </label>
                <input
                  type="text"
                  value={formData.profile.position}
                  onChange={(e) => handleProfileChange('position', e.target.value)}
                  className="input-field"
                  placeholder="e.g., Senior Tester, QA Lead"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.profile.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                  className="input-field"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-white bg-card border border-subtle rounded-lg hover:bg-surface-muted focus:ring-2 focus:ring-[rgb(var(--tc-contrast))] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating User...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create User</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
