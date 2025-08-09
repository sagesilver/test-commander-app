import React, { lazy, Suspense, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Users,
  Calendar,
  Building,
  Globe,
  UserPlus,
  Settings,
  BarChart3,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { organizationService } from '../services/organizationService';
import OrganizationPanel from '../components/OrganizationPanel';

// Lazy load heavy chart components
const DashboardCharts = lazy(() => import('../components/DashboardCharts'));

const Dashboard = () => {
  const { currentUser, currentUserData, currentOrganization, getUsers } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [organizationStats, setOrganizationStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [orgUsersCount, setOrgUsersCount] = useState(0);
  const navigate = useNavigate();

  // Load organizations from database for App Admin
  useEffect(() => {
    const loadOrganizations = async () => {
      if (currentUserData?.roles?.includes('APP_ADMIN')) {
        try {
          setLoading(true);
          // Load organizations directly from database
          const orgs = await organizationService.getAllOrganizations();
          setOrganizations(orgs);
          
          // Load stats for each organization
          if (orgs.length > 0) {
            const statsPromises = orgs.map(org => 
              organizationService.getOrganizationStats(org.organisationId)
            );
            const orgStats = await Promise.all(statsPromises);
            
            const statsMap = {};
            orgs.forEach((org, index) => {
              statsMap[org.organisationId] = orgStats[index];
            });
            
            setOrganizationStats(statsMap);
          }
        } catch (error) {
          console.error('Error loading organizations:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadOrganizations();
  }, [currentUserData]);

  // Load users count for Org Admins
  useEffect(() => {
    const fetchOrgUsers = async () => {
      try {
        if (currentUserData?.roles?.includes('ORG_ADMIN') && currentOrganization?.organisationId) {
          const users = await getUsers(currentOrganization.organisationId);
          setOrgUsersCount(Array.isArray(users) ? users.length : 0);
        } else {
          setOrgUsersCount(0);
        }
      } catch (e) {
        console.error('Error loading organization users:', e);
        setOrgUsersCount(0);
      }
    };
    fetchOrgUsers();
  }, [currentUserData, currentOrganization, getUsers]);

  // Mock data for charts
  const testProgressData = [
    { name: 'System', completed: 85, total: 100 },
    { name: 'Integration', completed: 60, total: 80 },
    { name: 'UAT', completed: 30, total: 50 },
    { name: 'Regression', completed: 45, total: 70 },
  ];

  const defectStatusData = [
    { name: 'Open', value: 12, color: '#ef4444' },
    { name: 'In Progress', value: 8, color: '#f59e0b' },
    { name: 'Resolved', value: 25, color: '#10b981' },
    { name: 'Closed', value: 15, color: '#6b7280' },
  ];

  const recentActivity = [
    { id: 1, type: 'test_case', title: 'TC-001: User Login Flow', user: 'John Doe', time: '2 hours ago' },
    { id: 2, type: 'defect', title: 'DEF-045: Payment Gateway Error', user: 'Jane Smith', time: '4 hours ago' },
    { id: 3, type: 'schedule', title: 'Sprint 3 Test Schedule Created', user: 'Mike Johnson', time: '1 day ago' },
    { id: 4, type: 'test_case', title: 'TC-023: API Response Validation', user: 'Sarah Wilson', time: '1 day ago' },
  ];

  // Role-based stats
  const getStats = () => {
    if (currentUserData?.roles?.includes('APP_ADMIN')) {
      const totalUsers = Object.values(organizationStats || {}).reduce((sum, stats) => sum + (stats?.totalUsers || 0), 0);
      const totalProjects = Object.values(organizationStats || {}).reduce((sum, stats) => sum + (stats?.totalProjects || 0), 0);
      const activeOrgs = (organizations || []).filter(org => org?.isActive).length;
      return [
        { title: 'Total Organizations', value: String((organizations || []).length), icon: Building, color: 'text-blue-600' },
        { title: 'Total Users', value: String(totalUsers || 0), icon: Users, color: 'text-green-600' },
        { title: 'Active Organizations', value: String(activeOrgs || 0), icon: CheckCircle, color: 'text-green-500' },
        { title: 'Total Projects', value: String(totalProjects || 0), icon: FileText, color: 'text-blue-500' },
      ];
    } else if (currentUserData?.roles?.includes('ORG_ADMIN')) {
      return [
        { title: 'Total Users', value: String(orgUsersCount || 0), icon: Users, color: 'text-blue-600' },
        { title: 'Active Projects', value: '5', icon: FileText, color: 'text-green-600' },
        { title: 'Active Defects', value: '23', icon: AlertTriangle, color: 'text-red-500' },
        { title: 'Test Coverage', value: '87%', icon: CheckCircle, color: 'text-green-500' },
      ];
    } else {
      return [
        { title: 'Total Test Cases', value: '1,247', icon: FileText, color: 'text-primary' },
        { title: 'Active Defects', value: '23', icon: AlertTriangle, color: 'text-red-500' },
        { title: 'Completed Tests', value: '892', icon: CheckCircle, color: 'text-green-500' },
        { title: 'Pending Tests', value: '355', icon: Clock, color: 'text-amber-500' },
      ];
    }
  };

  const stats = getStats();

  const getDashboardTitle = () => {
    if (currentUserData?.roles?.includes('APP_ADMIN')) {
      return 'System Dashboard';
    } else if (currentOrganization?.name) {
      return `${currentOrganization.name} Dashboard`;
    }
    return 'Dashboard';
  };

  const getDashboardSubtitle = () => {
    if (currentUserData?.roles?.includes('APP_ADMIN')) {
      return 'System-wide overview and organization management';
    } else if (currentOrganization?.name) {
      return `Welcome to ${currentOrganization.name}! Here's what's happening with your projects.`;
    }
    return 'Welcome back! Here\'s what\'s happening with your test projects.';
  };

  // Get quick actions based on user role
  const getQuickActions = () => {
    if (currentUserData?.roles?.includes('APP_ADMIN')) {
      return [
        { label: 'Create Organization', icon: Building, action: () => navigate('/organizations') },
        { label: 'Add User', icon: UserPlus, action: () => navigate('/user-management') },
        { label: 'System Settings', icon: Settings, action: () => navigate('/system-config') },
        { label: 'View Reports', icon: BarChart3, action: () => navigate('/reports') }
      ];
    } else if (currentUserData?.roles?.includes('ORG_ADMIN')) {
      return [
        { label: 'Create Project', icon: FileText, action: () => navigate('/projects') },
        { label: 'Add User', icon: UserPlus, action: () => navigate('/user-management') },
        { label: 'Organization Settings', icon: Settings, action: () => navigate('/organization-settings') },
        { label: 'View Reports', icon: BarChart3, action: () => navigate('/reports') }
      ];
    } else {
      return [
        { label: 'Create Test Case', icon: FileText, action: () => navigate('/test-cases') },
        { label: 'Log Defect', icon: AlertTriangle, action: () => navigate('/defects') },
        { label: 'View Reports', icon: BarChart3, action: () => navigate('/reports') }
      ];
    }
  };

  const quickActions = getQuickActions();

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal">{getDashboardTitle()}</h1>
          <p className="text-slate mt-1">{getDashboardSubtitle()}</p>
          {currentUserData?.roles.includes('APP_ADMIN') && (
            <div className="flex items-center mt-2 text-sm text-blue-600">
              <Globe className="w-4 h-4 mr-1" />
              <span>System Administrator View</span>
            </div>
          )}
        </div>
        <div className="flex space-x-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button 
                key={action.label}
                onClick={action.action}
                className="btn-secondary"
              >
                <Icon className="w-4 h-4 mr-2" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate text-sm">{stat.title}</p>
                  <p className="text-2xl font-semibold text-charcoal mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-primary-light ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Organization Overview for App Admin */}
      {currentUserData?.roles.includes('APP_ADMIN') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-charcoal mb-4">Organizations Overview</h3>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-8">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No organizations found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organizations.map((org) => (
                <OrganizationPanel
                  key={org.organisationId}
                  organization={org}
                  stats={organizationStats[org.organisationId]}
                  onClick={(organization) => navigate('/organizations')}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Charts Section - Only show for non-super users */}
      {!currentUserData?.roles.includes('APP_ADMIN') && (
        <Suspense fallback={
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="card">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        }>
          <DashboardCharts 
            testProgressData={testProgressData}
            defectStatusData={defectStatusData}
          />
        </Suspense>
      )}

      {/* Recent Activity - Only show for non-super users */}
      {!currentUserData?.roles.includes('APP_ADMIN') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-charcoal mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 hover:bg-slate-light rounded-xl transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
                  {activity.type === 'test_case' && <FileText className="w-4 h-4 text-primary" />}
                  {activity.type === 'defect' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  {activity.type === 'schedule' && <Calendar className="w-4 h-4 text-accent" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-charcoal">{activity.title}</p>
                  <p className="text-xs text-slate">by {activity.user} • {activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard; 
