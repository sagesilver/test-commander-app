import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { organizationService } from '../../services/organizationService';
import { 
  BuildingOffice2Icon, 
  EnvelopeIcon, 
  PhoneIcon, 
  GlobeAltIcon, 
  MapPinIcon,
  UserIcon,
  CogIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhotoIcon,
  SwatchIcon,
  CodeBracketIcon,
  UsersIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

const OrganizationForm = ({ open, onClose, organization = null, onSuccess, isViewMode = false }) => {
  const { currentUserData, createOrganization, updateOrganization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactInfo: {
      email: '',
      phone: '',
      website: '',
      address: ''
    },
    settings: {
      defaultUserRole: 'TEST_ENGINEER',
      maxUsers: 100,
      maxProjects: 50,
      customFields: [],
      workflows: [],
      branding: {
        logo: '',
        primaryColor: '#3762c4',
        customCss: ''
      }
    },
    subscription: {
      plan: 'free',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      features: ['basic_testing', 'defect_management'],
      limits: {
        users: 10,
        projects: 5,
        storage: 1
      }
    },
    metadata: {
      industry: '',
      size: 'medium',
      region: '',
      timezone: 'UTC'
    },
    isActive: true
  });

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        description: organization.description || '',
        contactInfo: {
          email: organization.contactInfo?.email || '',
          phone: organization.contactInfo?.phone || '',
          website: organization.contactInfo?.website || '',
          address: organization.contactInfo?.address || ''
        },
        settings: {
          defaultUserRole: organization.settings?.defaultUserRole || 'TEST_ENGINEER',
          maxUsers: organization.settings?.maxUsers || 100,
          maxProjects: organization.settings?.maxProjects || 50,
          customFields: organization.settings?.customFields || [],
          workflows: organization.settings?.workflows || [],
          branding: {
            logo: organization.settings?.branding?.logo || '',
            primaryColor: organization.settings?.branding?.primaryColor || '#3762c4',
            customCss: organization.settings?.branding?.customCss || ''
          }
        },
        subscription: {
          plan: organization.subscription?.plan || 'free',
          startDate: organization.subscription?.startDate || new Date(),
          endDate: organization.subscription?.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          features: organization.subscription?.features || ['basic_testing', 'defect_management'],
          limits: {
            users: organization.subscription?.limits?.users || 10,
            projects: organization.subscription?.limits?.projects || 5,
            storage: organization.subscription?.limits?.storage || 1
          }
        },
        metadata: {
          industry: organization.metadata?.industry || '',
          size: organization.metadata?.size || 'medium',
          region: organization.metadata?.region || '',
          timezone: organization.metadata?.timezone || 'UTC'
        },
        isActive: organization.isActive !== false
      });
    } else {
      setFormData({
        name: '',
        description: '',
        contactInfo: {
          email: '',
          phone: '',
          website: '',
          address: ''
        },
        settings: {
          defaultUserRole: 'TEST_ENGINEER',
          maxUsers: 100,
          maxProjects: 50,
          customFields: [],
          workflows: [],
          branding: {
            logo: '',
            primaryColor: '#3762c4',
            customCss: ''
          }
        },
        subscription: {
          plan: 'free',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          features: ['basic_testing', 'defect_management'],
          limits: {
            users: 10,
            projects: 5,
            storage: 1
          }
        },
        metadata: {
          industry: '',
          size: 'medium',
          region: '',
          timezone: 'UTC'
        },
        isActive: true
      });
    }
    setErrors({});
  }, [organization, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.contactInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.contactInfo.website && !/^https?:\/\/.+/.test(formData.contactInfo.website)) {
      newErrors.website = 'Please enter a valid URL (include http:// or https://)';
    }

    if (formData.settings.maxUsers < 1) {
      newErrors.maxUsers = 'Maximum users must be at least 1';
    }

    if (formData.settings.maxProjects < 1) {
      newErrors.maxProjects = 'Maximum projects must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      if (organization) {
        await updateOrganization(organization.organisationId, formData);
      } else {
        await createOrganization(formData, currentUserData.userId);
      }
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving organization:', error);
      setErrors({ submit: 'Failed to save organization. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (field.includes('settings.branding.')) {
      const brandingField = field.split('.').pop();
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          branding: {
            ...prev.settings.branding,
            [brandingField]: value
          }
        }
      }));
    } else if (field.includes('subscription.limits.')) {
      const limitField = field.split('.').pop();
      setFormData(prev => ({
        ...prev,
        subscription: {
          ...prev.subscription,
          limits: {
            ...prev.subscription.limits,
            [limitField]: parseInt(value) || 0
          }
        }
      }));
    } else if (field.includes('settings.')) {
      const settingField = field.split('.').pop();
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingField]: settingField === 'maxUsers' || settingField === 'maxProjects' ? parseInt(value) || 0 : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const subscriptionPlans = [
    { value: 'free', label: 'Free', features: ['Basic testing', 'Defect management', 'Up to 10 users'] },
    { value: 'basic', label: 'Basic', features: ['All Free features', 'Up to 25 users', 'Advanced reporting'] },
    { value: 'premium', label: 'Premium', features: ['All Basic features', 'Up to 100 users', 'Custom workflows'] },
    { value: 'enterprise', label: 'Enterprise', features: ['Unlimited users', 'Custom integrations', 'Priority support'] }
  ];

  const organizationSizes = [
    { value: 'small', label: 'Small (1-50 employees)' },
    { value: 'medium', label: 'Medium (51-200 employees)' },
    { value: 'large', label: 'Large (201-1000 employees)' },
    { value: 'enterprise', label: 'Enterprise (1000+ employees)' }
  ];

  const userRoles = [
    { value: 'TEST_ENGINEER', label: 'Test Engineer' },
    { value: 'ANALYST', label: 'Analyst' },
    { value: 'ORG_ADMIN', label: 'Organization Admin' },
    { value: 'DEFECT_COORDINATOR', label: 'Defect Coordinator' }
  ];

  const timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
    'Australia/Sydney', 'Australia/Melbourne'
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-subtle rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-subtle">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <BuildingOffice2Icon className="h-6 w-6 text-[rgb(var(--tc-icon))]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {organization ? 'Edit Organization' : 'Create New Organization'}
              </h2>
              <p className="text-sm text-muted">
                {organization ? 'Update organization details and settings' : 'Set up a new organization with all necessary information'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XCircleIcon className="h-6 w-6 text-menu" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <BuildingOffice2Icon className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
              <h3 className="text-lg font-medium text-foreground">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`input-field ${errors.name ? 'border-red-400' : ''}`}
                  placeholder="Enter organization name"
                  disabled={isViewMode}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <XCircleIcon className="h-4 w-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.metadata.industry}
                  onChange={(e) => handleInputChange('metadata.industry', e.target.value)}
                  className="input-field"
                  placeholder="e.g., Technology, Healthcare, Finance"
                  disabled={isViewMode}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`input-field ${errors.description ? 'border-red-400' : ''}`}
                placeholder="Describe your organization and its testing needs"
                disabled={isViewMode}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  {errors.description}
                </p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <EnvelopeIcon className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
              <h3 className="text-lg font-medium text-foreground">Contact Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Contact Email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[rgb(var(--tc-icon))]" />
                  <input
                    type="email"
                    value={formData.contactInfo.email}
                    onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
                    className={`input-field pl-10 pr-4 ${errors.email ? 'border-red-400' : ''}`}
                    placeholder="contact@organization.com"
                    disabled={isViewMode}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <XCircleIcon className="h-4 w-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[rgb(var(--tc-icon))]" />
                  <input
                    type="tel"
                    value={formData.contactInfo.phone}
                    onChange={(e) => handleInputChange('contactInfo.phone', e.target.value)}
                    className="input-field pl-10 pr-4"
                    placeholder="+1 (555) 123-4567"
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Website
                </label>
                <div className="relative">
                  <GlobeAltIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[rgb(var(--tc-icon))]" />
                  <input
                    type="url"
                    value={formData.contactInfo.website}
                    onChange={(e) => handleInputChange('contactInfo.website', e.target.value)}
                    className={`input-field pl-10 pr-4 ${errors.website ? 'border-red-400' : ''}`}
                    placeholder="https://www.organization.com"
                    disabled={isViewMode}
                  />
                </div>
                {errors.website && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <XCircleIcon className="h-4 w-4 mr-1" />
                    {errors.website}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Address
                </label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[rgb(var(--tc-icon))]" />
                  <input
                    type="text"
                    value={formData.contactInfo.address}
                    onChange={(e) => handleInputChange('contactInfo.address', e.target.value)}
                    className="input-field pl-10 pr-4"
                    placeholder="123 Business St, City, State"
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Organization Settings */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <CogIcon className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
              <h3 className="text-lg font-medium text-foreground">Organization Settings</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Default User Role
                </label>
                <select
                  value={formData.settings.defaultUserRole}
                  onChange={(e) => handleInputChange('settings.defaultUserRole', e.target.value)}
                  className="input-field"
                  disabled={isViewMode}
                >
                  {userRoles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Max Users
                </label>
                <input
                  type="number"
                  value={formData.settings.maxUsers}
                  onChange={(e) => handleInputChange('settings.maxUsers', e.target.value)}
                  className={`input-field ${errors.maxUsers ? 'border-red-400' : ''}`}
                  min="1"
                  max="10000"
                  disabled={isViewMode}
                />
                {errors.maxUsers && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircleIcon className="h-4 w-4 mr-1" />
                    {errors.maxUsers}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Max Projects
                </label>
                <input
                  type="number"
                  value={formData.settings.maxProjects}
                  onChange={(e) => handleInputChange('settings.maxProjects', e.target.value)}
                  className={`input-field ${errors.maxProjects ? 'border-red-400' : ''}`}
                  min="1"
                  max="1000"
                  disabled={isViewMode}
                />
                {errors.maxProjects && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircleIcon className="h-4 w-4 mr-1" />
                    {errors.maxProjects}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Branding Settings */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <PhotoIcon className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
              <h3 className="text-lg font-medium text-foreground">Branding & Customization</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Logo URL
                </label>
                <div className="relative">
                  <PhotoIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[rgb(var(--tc-icon))]" />
                  <input
                    type="url"
                    value={formData.settings.branding.logo}
                    onChange={(e) => handleInputChange('settings.branding.logo', e.target.value)}
                    className="input-field pl-10 pr-4"
                    placeholder="https://example.com/logo.png"
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Primary Color
                </label>
                <div className="relative">
                  <SwatchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[rgb(var(--tc-icon))]" />
                  <input
                    type="color"
                    value={formData.settings.branding.primaryColor}
                    onChange={(e) => handleInputChange('settings.branding.primaryColor', e.target.value)}
                    className="input-field pl-10 pr-4"
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Custom CSS
                </label>
                <div className="relative">
                  <CodeBracketIcon className="absolute left-3 top-3 h-5 w-5 text-[rgb(var(--tc-icon))]" />
                  <textarea
                    value={formData.settings.branding.customCss}
                    onChange={(e) => handleInputChange('settings.branding.customCss', e.target.value)}
                    rows={4}
                    className="input-field pl-10 pr-4"
                    placeholder="/* Custom CSS styles for your organization */"
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Organization Details */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
              <h3 className="text-lg font-medium text-foreground">Organization Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Organization Size
                </label>
                <select
                  value={formData.metadata.size}
                  onChange={(e) => handleInputChange('metadata.size', e.target.value)}
                  className="input-field"
                  disabled={isViewMode}
                >
                  {organizationSizes.map(size => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Region
                </label>
                <input
                  type="text"
                  value={formData.metadata.region}
                  onChange={(e) => handleInputChange('metadata.region', e.target.value)}
                  className="input-field"
                  placeholder="e.g., North America, Europe, Asia-Pacific"
                  disabled={isViewMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Timezone
                </label>
                <select
                  value={formData.metadata.timezone}
                  onChange={(e) => handleInputChange('metadata.timezone', e.target.value)}
                  className="input-field"
                  disabled={isViewMode}
                >
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Subscription Plan */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <CreditCardIcon className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
              <h3 className="text-lg font-medium text-foreground">Subscription Plan</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {subscriptionPlans.map(plan => (
                <div
                  key={plan.value}
                  className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                    formData.subscription.plan === plan.value
                      ? 'border-[rgb(var(--tc-icon))] bg-white/5'
                      : 'border-subtle hover:bg-white/5'
                  }`}
                  onClick={() => handleInputChange('subscription.plan', plan.value)}
                  disabled={isViewMode}
                >
                  {formData.subscription.plan === plan.value && (
                    <CheckCircleIcon className="absolute top-2 right-2 h-5 w-5 text-[rgb(var(--tc-icon))]" />
                  )}
                  <div className="text-center">
                    <h4 className="font-semibold text-foreground">{plan.label}</h4>
                    <ul className="mt-2 text-xs text-menu space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center justify-center">
                          <CheckCircleIcon className="h-3 w-3 text-green-400 mr-1" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Subscription Limits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  User Limit
                </label>
                <div className="relative">
                  <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[rgb(var(--tc-icon))]" />
                  <input
                    type="number"
                    value={formData.subscription.limits.users}
                    onChange={(e) => handleInputChange('subscription.limits.users', e.target.value)}
                    className="input-field pl-10 pr-4"
                    min="1"
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Project Limit
                </label>
                <div className="relative">
                  <FolderIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[rgb(var(--tc-icon))]" />
                  <input
                    type="number"
                    value={formData.subscription.limits.projects}
                    onChange={(e) => handleInputChange('subscription.limits.projects', e.target.value)}
                    className="input-field pl-10 pr-4"
                    min="1"
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Storage Limit (GB)
                </label>
                <input
                  type="number"
                  value={formData.subscription.limits.storage}
                  onChange={(e) => handleInputChange('subscription.limits.storage', e.target.value)}
                  className="input-field"
                  min="1"
                  disabled={isViewMode}
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-surface-muted rounded-lg border border-subtle">
            <div className="flex items-center space-x-3">
              <CogIcon className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
              <div>
                <h4 className="font-medium text-foreground">Organization Status</h4>
                <p className="text-sm text-menu">
                  {formData.isActive ? 'Active - Organization can be used' : 'Inactive - Organization is disabled'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="sr-only peer"
                disabled={isViewMode}
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[rgb(var(--tc-contrast))] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--tc-icon))]"></div>
            </label>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-sm text-red-300 flex items-center">
                <XCircleIcon className="h-4 w-4 mr-2" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-white bg-card border border-subtle rounded-lg hover:bg-surface-muted focus:ring-2 focus:ring-[rgb(var(--tc-contrast))] transition-colors"
            >
              {isViewMode ? 'Close' : 'Cancel'}
            </button>
            {!isViewMode && (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{organization ? 'Update Organization' : 'Create Organization'}</span>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizationForm;
