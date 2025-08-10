import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  FileText, 
  AlertTriangle, 
  Calendar, 
  BarChart3, 
  Menu, 
  X,
  User,
  LogOut,
  Settings,
  Users,
  Shield,
  Database,
  Activity,
  Bell,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Building,
  UserPlus,
  Clipboard,
  Play,
  CheckCircle,
  Filter,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState(['main']);
  const location = useLocation();
  const { currentUser, currentUserData, currentOrganization, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Role-based menu configuration
  const getMenuItems = (role) => {
    const baseItems = [
      { path: '/', label: 'Dashboard', icon: Home, section: 'main' },
      { path: '/projects', label: 'Projects', icon: FileText, section: 'main' },
      { path: '/test-cases', label: 'Testing', icon: FileText, section: 'main' },
      { path: '/defects', label: 'Defects', icon: AlertTriangle, section: 'main' },
      { path: '/schedules', label: 'Schedules', icon: Calendar, section: 'main' },
      { path: '/reports', label: 'Reports', icon: BarChart3, section: 'main' },
    ];

    // App Admin (Super User) items
    const appAdminItems = [
      { path: '/super-admin', label: 'Super Admin Dashboard', icon: Shield, section: 'admin' },
      { path: '/organizations', label: 'Organizations', icon: Building, section: 'admin' },
      { path: '/projects', label: 'All Projects', icon: FileText, section: 'admin' },
      { path: '/user-management', label: 'Global User Management', icon: Users, section: 'admin' },
      { path: '/system-config', label: 'System Configuration', icon: Settings, section: 'admin' },
      { path: '/security', label: 'Security Settings', icon: Shield, section: 'admin' },
      { path: '/database', label: 'Database Management', icon: Database, section: 'admin' },
      { path: '/audit-logs', label: 'Audit Logs', icon: Activity, section: 'admin' },
    ];

    // Org Admin items
    const orgAdminItems = [
      { path: '/organization-settings', label: 'Organization Settings', icon: Settings, section: 'admin' },
      { path: '/user-management', label: 'User Management', icon: Users, section: 'admin' },
      { path: '/projects', label: 'Projects', icon: FileText, section: 'admin' },
      { path: '/organization-reports', label: 'Organization Reports', icon: BarChart3, section: 'admin' },
    ];

    // Project Manager items (avoid duplicating base main items)
    const projectManagerItems = [
      { path: '/projects', label: 'Projects', icon: FileText, section: 'admin' },
    ];

    // Analyst items
    const analystItems = [
      { path: '/test-analysis', label: 'Test Analysis', icon: BarChart3, section: 'analyst' },
      { path: '/test-design', label: 'Test Design', icon: FileText, section: 'analyst' },
      { path: '/requirements', label: 'Requirements', icon: Clipboard, section: 'analyst' },
    ];

    // Test Engineer items
    const testEngineerItems = [
      { path: '/test-execution', label: 'Test Execution', icon: Play, section: 'tester' },
      { path: '/test-results', label: 'Test Results', icon: CheckCircle, section: 'tester' },
      { path: '/automation', label: 'Automation', icon: Zap, section: 'tester' },
    ];

    // Defect Coordinator items
    const defectCoordinatorItems = [
      { path: '/defect-management', label: 'Defect Management', icon: AlertTriangle, section: 'coordinator' },
      { path: '/defect-triage', label: 'Defect Triage', icon: Filter, section: 'coordinator' },
      { path: '/defect-reports', label: 'Defect Reports', icon: BarChart3, section: 'coordinator' },
    ];

    let allItems = [...baseItems];

    // Add role-specific items based on user's roles
    if (role.includes('APP_ADMIN')) {
      allItems = [...allItems, ...appAdminItems];
    }
    if (role.includes('ORG_ADMIN')) {
      allItems = [...allItems, ...orgAdminItems];
    }
    if (role.includes('PROJECT_MANAGER')) {
      allItems = [...allItems, ...projectManagerItems];
    }
    if (role.includes('ANALYST')) {
      allItems = [...allItems, ...analystItems];
    }
    if (role.includes('TEST_ENGINEER')) {
      allItems = [...allItems, ...testEngineerItems];
    }
    if (role.includes('DEFECT_COORDINATOR')) {
      allItems = [...allItems, ...defectCoordinatorItems];
    }

    return allItems;
  };

  const menuItems = getMenuItems(currentUserData?.roles || []);

  // Group items by section
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {});

  const sectionLabels = {
    main: 'Main Navigation',
    admin: 'Administration',
    analyst: 'Analysis',
    tester: 'Testing Tools',
    coordinator: 'Defect Coordination',
    support: 'Support'
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isActive = (path) => location.pathname === path;

  // De-duplicate main nav items by path
  const navItems = Array.from(
    new Map(
      menuItems
        .filter(item => item.section === 'main')
        .map(item => [item.path, item])
    ).values()
  );

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="bg-card shadow-card">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Sidebar Toggle */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-slate hover:text-charcoal transition-colors"
                title="Toggle Sidebar"
              >
                 <Menu className="w-5 h-5 text-[rgb(var(--tc-icon))]" />
              </button>
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 flex items-center justify-center">
                  <img 
                    src="/tc-logo-transparent.png" 
                    alt="Test Commander Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xl font-semibold text-foreground">Test Commander</span>
              </Link>
            </div>

            {/* Organization Context (for non-super users) */}
            {currentOrganization && (
              <div className="hidden md:flex items-center space-x-2 bg-surface-muted px-3 py-1 rounded-lg">
                <Building className="w-4 h-4 text-[rgb(var(--tc-icon))]" />
                <span className="text-sm font-medium text-foreground">{currentOrganization.name}</span>
              </div>
            )}

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link ${isActive(item.path) ? 'nav-link-active' : ''}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-3">
              {currentUser && (
                <div className="flex items-center space-x-3">
                  {/* Theme toggle */}
                  <button
                    onClick={toggleTheme}
                    className="p-2 text-menu hover:text-[rgb(var(--tc-icon))] transition-colors"
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  >
                    {theme === 'dark' ? (
                      <span aria-hidden>🌙</span>
                    ) : (
                      <span aria-hidden>☀️</span>
                    )}
                  </button>
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {currentUserData?.name ? 
                      currentUserData.name.split(' ').map(n => n[0]).join('').toUpperCase() :
                      currentUser.displayName ? 
                        currentUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase() :
                        currentUser.email ? currentUser.email[0].toUpperCase() : 'U'
                    }
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {currentUserData?.name || currentUser.displayName || currentUser.email || 'User'}
                    </span>
                    <span className="text-xs text-muted">
                      {currentUserData?.roles?.join(', ') || 'No role assigned'}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="px-4 py-2 rounded-lg bg-surface-muted text-white border border-subtle hover:bg-white/10 hover:border-white/20 transition-colors flex items-center space-x-2"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4 text-white" />
                    <span>Logout</span>
                  </button>
                  {/* Right Sidebar Toggle (blue hamburger) */}
                  <button
                    onClick={() => setIsRightSidebarOpen(true)}
                    className="p-2 text-[rgb(var(--tc-icon))] hover:brightness-110 transition-colors"
                    title="Open Menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-slate" />
              ) : (
                <Menu className="w-6 h-6 text-slate" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-grey-light"
            >
              <div className="py-4 space-y-2">
                {/* Organization Context for Mobile */}
                {currentOrganization && (
                  <div className="px-4 py-2 bg-blue-50 rounded-lg mx-4 mb-2">
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">{currentOrganization.name}</span>
                    </div>
                  </div>
                )}

                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center px-4 py-2 text-sm ${
                        isActive(item.path) ? 'text-primary bg-primary-light' : 'text-slate hover:text-primary'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {item.label}
                    </Link>
                  );
                })}
                {currentUser && (
                  <div className="border-t border-grey-light pt-4 mt-4">
                    <div className="flex items-center px-4 py-2">
                                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                      {currentUserData?.name ? 
                        currentUserData.name.split(' ').map(n => n[0]).join('').toUpperCase() :
                        currentUser.displayName ? 
                          currentUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase() :
                          currentUser.email ? currentUser.email[0].toUpperCase() : 'U'
                      }
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-charcoal">
                        {currentUserData?.name || currentUser.displayName || currentUser.email || 'User'}
                      </span>
                      <span className="text-xs text-slate">
                        {currentUserData?.roles?.join(', ') || 'No role assigned'}
                      </span>
                    </div>
                    </div>
                    <button 
                      onClick={logout} 
                      className="w-full text-left px-4 py-2 text-sm rounded-lg bg-surface-muted text-white border border-subtle hover:bg-white/10 hover:border-white/20 transition-colors flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4 text-white" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Sidebar */}
      {isSidebarOpen && (
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-lg`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-subtle">
            <h2 className="text-lg font-semibold text-foreground">Menu</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 text-muted hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Organization Context in Sidebar */}
          {currentOrganization && (
            <div className="px-4 py-3 bg-surface-muted border-b border-subtle">
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-foreground">{currentOrganization.name}</p>
                  <p className="text-xs text-muted">Current Organization</p>
                </div>
              </div>
            </div>
          )}

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto py-4">
            {Object.entries(groupedItems).map(([section, items]) => (
              <div key={section} className="mb-6">
                <button
                  onClick={() => toggleSection(section)}
                  className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted transition-colors"
                >
                  <span>{sectionLabels[section]}</span>
                  {expandedSections.includes(section) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                
                {expandedSections.includes(section) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1"
                  >
                    {items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center px-4 py-2 text-sm rounded-md transition-colors ${
                            isActive(item.path) 
                              ? 'text-white bg-white/10' 
                              : 'text-menu hover:text-white hover:bg-white/10'
                          }`}
                          onClick={() => setIsSidebarOpen(false)}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-subtle p-4">
            {currentUser && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {currentUserData?.name ? 
                    currentUserData.name.split(' ').map(n => n[0]).join('').toUpperCase() :
                    currentUser.displayName ? 
                      currentUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase() :
                      currentUser.email ? currentUser.email[0].toUpperCase() : 'U'
                  }
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {currentUserData?.name || currentUser.displayName || currentUser.email || 'User'}
                  </p>
                  <p className="text-xs text-muted">
                    {currentUserData?.roles?.join(', ') || 'No role assigned'}
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="p-2 text-muted hover:text-primary transition-colors"
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? <span aria-hidden>🌙</span> : <span aria-hidden>☀️</span>}
                </button>
                <button
                  onClick={logout}
                  className="px-2 py-1 rounded-md bg-surface-muted text-white border border-subtle hover:bg-white/10 hover:border-white/20 transition-colors flex items-center space-x-2"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-white" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Right Sidebar */}
      {isRightSidebarOpen && (
      <div className={`fixed inset-y-0 right-0 z-50 w-64 bg-card shadow-lg`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-subtle">
            <h2 className="text-lg font-semibold text-foreground">Menu</h2>
            <button
              onClick={() => setIsRightSidebarOpen(false)}
              className="p-1 text-muted hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto py-4">
            {Object.entries(groupedItems).map(([section, items]) => (
              <div key={section} className="mb-6">
                <button
                  onClick={() => toggleSection(section)}
                  className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted transition-colors"
                >
                  <span>{sectionLabels[section]}</span>
                  {expandedSections.includes(section) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {expandedSections.includes(section) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1"
                  >
                    {items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center px-4 py-2 text-sm rounded-md transition-colors ${
                          isActive(item.path)
                            ? 'text-white bg-white/10'
                            : 'text-menu hover:text-white hover:bg-white/10'
                        }`}
                        onClick={() => setIsRightSidebarOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      {isRightSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsRightSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Navigation; 