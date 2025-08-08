import React from 'react';
import { motion } from 'framer-motion';
import { 
  Building, 
  Users, 
  Folder, 
  ChevronRight, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const OrganizationPanel = ({ organization, stats, onClick }) => {
  // Get status badge styling
  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Inactive
        </span>
      );
    }
  };

  // Get plan badge styling
  const getPlanBadge = (plan) => {
    const planLabels = {
      'free': 'Free',
      'basic': 'Basic',
      'pro': 'Pro',
      'premium': 'Premium',
      'enterprise': 'Enterprise',
      'trial': 'Trial'
    };
    
    const planColors = {
      'free': 'bg-gray-100 text-gray-800',
      'basic': 'bg-green-100 text-green-800',
      'pro': 'bg-blue-100 text-blue-800',
      'premium': 'bg-purple-100 text-purple-800',
      'enterprise': 'bg-indigo-100 text-indigo-800',
      'trial': 'bg-yellow-100 text-yellow-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${planColors[plan] || planColors.free}`}>
        {planLabels[plan] || 'Free'}
      </span>
    );
  };

  // Check if subscription is expiring soon (within 30 days)
  const getAlertBadge = () => {
    if (!organization.subscription?.endDate) return null;
    
    const endDate = new Date(organization.subscription.endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Expires in {daysUntilExpiry} days
        </span>
      );
    } else if (daysUntilExpiry <= 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Expired
        </span>
      );
    }
    
    return null;
  };

  // Generate initials for logo fallback
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const alertBadge = getAlertBadge();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100"
      onClick={() => onClick(organization)}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Logo/Avatar */}
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          {organization.settings?.branding?.logo ? (
            <img 
              src={organization.settings.branding.logo} 
              alt={`${organization.name} logo`}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <Building className="w-5 h-5 text-blue-600" />
          )}
        </div>

        {/* Organization Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 truncate">
              {organization.name}
            </h4>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(organization.isActive)}
            {getPlanBadge(organization.subscription?.plan)}
            {alertBadge}
          </div>
        </div>
      </div>

      {/* Metrics and Actions */}
      <div className="flex items-center gap-4">
        {/* User Count */}
        <div className="flex items-center text-sm text-gray-600">
          <Users className="w-4 h-4 mr-1" />
          <span>{stats?.totalUsers || 0}</span>
        </div>

        {/* Project Count */}
        <div className="flex items-center text-sm text-gray-600">
          <Folder className="w-4 h-4 mr-1" />
          <span>{stats?.totalProjects || 0}</span>
        </div>

        {/* Chevron */}
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </motion.div>
  );
};

export default OrganizationPanel;
