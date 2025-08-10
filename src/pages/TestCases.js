import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight,
  FileText,
  Edit,
  Trash2,
  Copy,
  Eye,
  X,
  Minus,
  Grid,
  List,
  ArrowUp,
  ArrowDown,
  Circle,
  Download,
  BarChart3,
  ClipboardList,
  ListChecks,
  ListOrdered,
  Info
 } from 'lucide-react';
import TestCasesGrid from '../components/TestCasesGrid';
import { useAuth } from '../contexts/AuthContext';

const TestCases = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedNodes, setExpandedNodes] = useState(['project-1', 'function-1', 'function-2', 'subsystem-1', 'subsystem-2', 'subsystem-3']);
  const [showNewTestCaseModal, setShowNewTestCaseModal] = useState(false);
  const [showViewTestCaseModal, setShowViewTestCaseModal] = useState(false);
  const [showEditTestCaseModal, setShowEditTestCaseModal] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'grid'
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterTestType, setFilterTestType] = useState('all');
  const [newTestCaseForm, setNewTestCaseForm] = useState({
    tcid: '',
    name: '',
    description: '',
    author: '',
    testType: '',
    priority: 'Medium',
    overallResult: '',
    prerequisites: '',
    testSteps: []
  });
  const [editTestCaseForm, setEditTestCaseForm] = useState({
    tcid: '',
    name: '',
    description: '',
    author: '',
    testType: '',
    priority: 'Medium',
    overallResult: '',
    prerequisites: '',
    testSteps: []
  });
  const [testHierarchy, setTestHierarchy] = useState([
    {
      id: 'project-1',
      name: 'E-Commerce Platform',
      type: 'project',
      children: [
        {
          id: 'function-1',
          name: 'User Management',
          type: 'function',
          children: [
            {
              id: 'subsystem-1',
              name: 'Authentication',
              type: 'subsystem',
              testCases: [
                {
                  tcid: 'TC-001',
                  name: 'User Login Flow',
                  description: 'Verify that users can successfully log into the system using valid credentials',
                  author: 'John Smith',
                  testType: 'Functional',
                  prerequisites: 'Valid user account must exist in the system',
                  overallResult: 'Passed',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Navigate to login page',
                      testData: 'URL: https://app.example.com/login',
                      expectedResult: 'Login page loads with username and password fields visible',
                      actualResult: 'Login page loaded successfully',
                      stepStatus: 'Passed',
                      notes: 'Page loaded in 2.3 seconds'
                    },
                    {
                      stepNumber: 2,
                      description: 'Enter valid username',
                      testData: 'Username: testuser@example.com',
                      expectedResult: 'Username field accepts input without errors',
                      actualResult: 'Username entered successfully',
                      stepStatus: 'Passed',
                      notes: ''
                    },
                    {
                      stepNumber: 3,
                      description: 'Enter valid password',
                      testData: 'Password: TestPass123!',
                      expectedResult: 'Password field accepts input and masks characters',
                      actualResult: 'Password entered and masked correctly',
                      stepStatus: 'Passed',
                      notes: ''
                    },
                    {
                      stepNumber: 4,
                      description: 'Click Login button',
                      testData: 'Click event on Login button',
                      expectedResult: 'User is redirected to dashboard page',
                      actualResult: 'Successfully redirected to dashboard',
                      stepStatus: 'Passed',
                      notes: 'Redirect took 1.8 seconds'
                    }
                  ]
                },
                {
                  tcid: 'TC-002',
                  name: 'Password Reset Functionality',
                  description: 'Verify that users can reset their password using the forgot password feature',
                  author: 'Sarah Johnson',
                  testType: 'Functional',
                  prerequisites: 'User account exists with valid email address',
                  overallResult: 'Failed',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Navigate to login page',
                      testData: 'URL: https://app.example.com/login',
                      expectedResult: 'Login page loads with "Forgot Password" link visible',
                      actualResult: 'Login page loaded, but forgot password link missing',
                      stepStatus: 'Failed',
                      notes: 'Defect logged: TC-002-001'
                    }
                  ]
                },
                {
                  tcid: 'TC-003',
                  name: 'Session Management',
                  description: 'Verify that user sessions are properly managed and timeout correctly',
                  author: 'Mike Chen',
                  testType: 'Security',
                  prerequisites: 'User must be logged into the system',
                  overallResult: 'Not Run',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Login to the system',
                      testData: 'Valid credentials',
                      expectedResult: 'User successfully logged in',
                      actualResult: '',
                      stepStatus: 'Not Run',
                      notes: 'Test scheduled for next sprint'
                    },
                    {
                      stepNumber: 2,
                      description: 'Leave session idle for 30 minutes',
                      testData: 'Wait 30 minutes without activity',
                      expectedResult: 'Session should timeout and redirect to login',
                      actualResult: '',
                      stepStatus: 'Not Run',
                      notes: ''
                    }
                  ]
                }
              ]
            },
            {
              id: 'subsystem-2',
              name: 'User Profile',
              type: 'subsystem',
              testCases: [
                {
                  tcid: 'TC-004',
                  name: 'Profile Information Update',
                  description: 'Verify that users can update their profile information successfully',
                  author: 'Lisa Wang',
                  testType: 'Functional',
                  prerequisites: 'User must be logged in and have edit permissions',
                  overallResult: 'Passed',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Navigate to profile settings',
                      testData: 'Click on Profile > Settings',
                      expectedResult: 'Profile settings page loads with current user data',
                      actualResult: 'Settings page loaded with user data displayed',
                      stepStatus: 'Passed',
                      notes: ''
                    },
                    {
                      stepNumber: 2,
                      description: 'Update first name field',
                      testData: 'New first name: "Michael"',
                      expectedResult: 'First name field accepts new value',
                      actualResult: 'First name updated successfully',
                      stepStatus: 'Passed',
                      notes: ''
                    },
                    {
                      stepNumber: 3,
                      description: 'Save profile changes',
                      testData: 'Click Save button',
                      expectedResult: 'Changes are saved and success message displayed',
                      actualResult: 'Profile saved successfully with confirmation',
                      stepStatus: 'Passed',
                      notes: ''
                    }
                  ]
                },
                {
                  tcid: 'TC-005',
                  name: 'Avatar Upload Feature',
                  description: 'Verify that users can upload and update their profile avatar',
                  author: 'David Brown',
                  testType: 'Functional',
                  prerequisites: 'User logged in, valid image file available',
                  overallResult: 'Not Run',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Access avatar upload section',
                      testData: 'Navigate to Profile > Avatar',
                      expectedResult: 'Avatar upload interface is displayed',
                      actualResult: '',
                      stepStatus: 'Not Run',
                      notes: 'Feature not yet implemented'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'function-2',
          name: 'Product Management',
          type: 'function',
          children: [
            {
              id: 'subsystem-3',
              name: 'Catalog',
              type: 'subsystem',
              testCases: [
                {
                  tcid: 'TC-006',
                  name: 'Product Search Functionality',
                  description: 'Verify that users can search for products using various search criteria',
                  author: 'Emma Davis',
                  testType: 'Functional',
                  prerequisites: 'Product catalog must be populated with test data',
                  overallResult: 'Passed',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Navigate to product catalog',
                      testData: 'URL: /products',
                      expectedResult: 'Product catalog page loads with search bar visible',
                      actualResult: 'Catalog page loaded with search functionality',
                      stepStatus: 'Passed',
                      notes: ''
                    },
                    {
                      stepNumber: 2,
                      description: 'Enter search term',
                      testData: 'Search term: "laptop"',
                      expectedResult: 'Search results display products matching the term',
                      actualResult: '5 laptop products found and displayed',
                      stepStatus: 'Passed',
                      notes: 'Search completed in 0.8 seconds'
                    }
                  ]
                },
                {
                  tcid: 'TC-007',
                  name: 'Category Filtering',
                  description: 'Verify that product filtering by category works correctly',
                  author: 'Alex Turner',
                  testType: 'Functional',
                  prerequisites: 'Multiple product categories must exist',
                  overallResult: 'In Progress',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Select Electronics category',
                      testData: 'Click on Electronics filter',
                      expectedResult: 'Only electronics products should be displayed',
                      actualResult: 'Electronics products filtered correctly',
                      stepStatus: 'Passed',
                      notes: ''
                    },
                    {
                      stepNumber: 2,
                      description: 'Apply price range filter',
                      testData: 'Price range: $100-$500',
                      expectedResult: 'Products within price range should be shown',
                      actualResult: 'Currently testing this step',
                      stepStatus: 'In Progress',
                      notes: 'Need to verify price calculation logic'
                    }
                  ]
                },
                {
                  tcid: 'TC-008',
                  name: 'Comprehensive Multi-Factor Authentication System Integration with Biometric Verification and Advanced Security Protocols',
                  description: 'Verify that the multi-factor authentication system properly integrates with biometric verification and advanced security protocols',
                  author: 'Jennifer Rodriguez',
                  testType: 'Security',
                  prerequisites: 'Biometric hardware must be connected and configured',
                  overallResult: 'Not Run',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Initialize biometric verification module',
                      testData: 'Connect fingerprint scanner and configure security settings',
                      expectedResult: 'Biometric module initializes without errors',
                      actualResult: '',
                      stepStatus: 'Not Run',
                      notes: 'Hardware not yet available for testing'
                    }
                  ]
                },
                {
                  tcid: 'TC-009',
                  name: 'End-to-End Payment Processing Workflow with Multiple Gateway Integration and Real-Time Transaction Monitoring',
                  description: 'Verify complete payment processing workflow across multiple payment gateways with real-time monitoring',
                  author: 'Michael Thompson',
                  testType: 'Integration',
                  prerequisites: 'All payment gateways must be configured and test accounts available',
                  overallResult: 'Failed',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Process credit card payment through primary gateway',
                      testData: 'Test credit card: 4111-1111-1111-1111',
                      expectedResult: 'Payment processed successfully through primary gateway',
                      actualResult: 'Payment failed due to gateway timeout',
                      stepStatus: 'Failed',
                      notes: 'Gateway response time exceeded 30 seconds'
                    }
                  ]
                },
                {
                  tcid: 'TC-010',
                  name: 'Advanced User Interface Responsiveness Testing Across Multiple Device Types and Screen Resolutions',
                  description: 'Verify that the user interface responds correctly across various device types and screen resolutions',
                  author: 'Amanda Foster',
                  testType: 'Usability',
                  prerequisites: 'Test devices must be available with different screen sizes',
                  overallResult: 'In Progress',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Test responsive design on mobile devices',
                      testData: 'iPhone 12, Samsung Galaxy S21, iPad Pro',
                      expectedResult: 'Interface adapts correctly to mobile screen sizes',
                      actualResult: 'Currently testing mobile responsiveness',
                      stepStatus: 'In Progress',
                      notes: 'iPad Pro layout needs adjustment'
                    }
                  ]
                },
                {
                  tcid: 'TC-011',
                  name: 'Comprehensive Database Performance Optimization and Query Execution Time Analysis with Load Balancing',
                  description: 'Verify database performance optimization and analyze query execution times under various load conditions',
                  author: 'Robert Kim',
                  testType: 'Performance',
                  prerequisites: 'Database must be populated with large dataset for testing',
                  overallResult: 'Passed',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Execute complex database queries under normal load',
                      testData: 'SELECT queries with JOIN operations on 1M+ records',
                      expectedResult: 'Queries execute within acceptable time limits',
                      actualResult: 'All queries completed within 2 seconds',
                      stepStatus: 'Passed',
                      notes: 'Performance meets SLA requirements'
                    }
                  ]
                },
                {
                  tcid: 'TC-012',
                  name: 'Advanced Data Analytics Dashboard with Real-Time Metrics and Predictive Insights Integration',
                  description: 'Verify comprehensive analytics dashboard functionality with real-time data visualization',
                  author: 'Sarah Johnson',
                  testType: 'Performance',
                  prerequisites: 'Analytics engine must be running',
                  overallResult: 'Not Run',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Load dashboard with 10,000 data points',
                      testData: 'Navigate to analytics dashboard',
                      expectedResult: 'Dashboard loads within 3 seconds',
                      actualResult: '',
                      stepStatus: 'Not Run',
                      notes: ''
                    }
                  ]
                },
                {
                  tcid: 'TC-013',
                  name: 'Multi-Tenant User Management System with Role-Based Access Control and Audit Trail',
                  description: 'Test comprehensive user management with tenant isolation and security',
                  author: 'Michael Chen',
                  testType: 'Security',
                  prerequisites: 'Multi-tenant database setup',
                  overallResult: 'In Progress',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Create new tenant with admin user',
                      testData: 'Tenant: TestCorp, Admin: admin@testcorp.com',
                      expectedResult: 'Tenant created successfully with proper isolation',
                      actualResult: 'Tenant created, testing isolation',
                      stepStatus: 'In Progress',
                      notes: ''
                    }
                  ]
                },
                {
                  tcid: 'TC-014',
                  name: 'Comprehensive API Gateway with Rate Limiting, Authentication, and Request Routing',
                  description: 'Verify API gateway handles all traffic patterns and security requirements',
                  author: 'Emily Rodriguez',
                  testType: 'Integration',
                  prerequisites: 'API gateway service running',
                  overallResult: 'Passed',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Test rate limiting for different user tiers',
                      testData: 'Premium user: 1000 req/min, Standard: 100 req/min',
                      expectedResult: 'Rate limits enforced correctly',
                      actualResult: 'Rate limiting working as expected',
                      stepStatus: 'Passed',
                      notes: ''
                    }
                  ]
                },
                {
                  tcid: 'TC-015',
                  name: 'Advanced Search Engine with Elasticsearch Integration and Faceted Filtering',
                  description: 'Test search functionality with complex queries and result ranking',
                  author: 'David Kim',
                  testType: 'Functional',
                  prerequisites: 'Elasticsearch cluster running',
                  overallResult: 'Failed',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Perform complex search with multiple filters',
                      testData: 'Search: "software testing" +category:automation +date:2024',
                      expectedResult: 'Relevant results returned in <2 seconds',
                      actualResult: 'Search timeout after 5 seconds',
                      stepStatus: 'Failed',
                      notes: ''
                    }
                  ]
                },
                {
                  tcid: 'TC-016',
                  name: 'Real-Time Collaboration System with WebSocket Integration and Conflict Resolution',
                  description: 'Verify real-time editing capabilities with multiple concurrent users',
                  author: 'Lisa Wang',
                  testType: 'Usability',
                  prerequisites: 'WebSocket server running',
                  overallResult: 'In Progress',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Simulate 5 users editing same document',
                      testData: 'Document: test-doc.md, Users: user1-5',
                      expectedResult: 'Changes synchronized in real-time',
                      actualResult: 'Testing synchronization',
                      stepStatus: 'In Progress',
                      notes: ''
                    }
                  ]
                },
                {
                  tcid: 'TC-017',
                  name: 'Comprehensive Mobile Application Testing with Cross-Platform Compatibility',
                  description: 'Test mobile app functionality across iOS and Android platforms',
                  author: 'James Wilson',
                  testType: 'Functional',
                  prerequisites: 'Mobile devices available',
                  overallResult: 'Not Run',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Test core functionality on iOS 17',
                      testData: 'iPhone 15 Pro, iOS 17.2',
                      expectedResult: 'All features work correctly',
                      actualResult: '',
                      stepStatus: 'Not Run',
                      notes: ''
                    }
                  ]
                },
                {
                  tcid: 'TC-018',
                  name: 'Advanced Machine Learning Pipeline with Model Training and Deployment Automation',
                  description: 'Verify ML pipeline handles model training, validation, and deployment',
                  author: 'Rachel Green',
                  testType: 'Performance',
                  prerequisites: 'ML infrastructure setup',
                  overallResult: 'Passed',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Train model with 1M training samples',
                      testData: 'Dataset: customer_behavior.csv',
                      expectedResult: 'Model training completes successfully',
                      actualResult: 'Training completed, accuracy: 94.2%',
                      stepStatus: 'Passed',
                      notes: ''
                    }
                  ]
                },
                {
                  tcid: 'TC-019',
                  name: 'Comprehensive Database Migration System with Zero-Downtime Deployment',
                  description: 'Test database migration with minimal service interruption',
                  author: 'Thomas Brown',
                  testType: 'Integration',
                  prerequisites: 'Database cluster setup',
                  overallResult: 'In Progress',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Execute migration from MySQL 5.7 to 8.0',
                      testData: 'Database: production_db, Size: 500GB',
                      expectedResult: 'Migration completes with <5min downtime',
                      actualResult: 'Migration in progress',
                      stepStatus: 'In Progress',
                      notes: ''
                    }
                  ]
                },
                {
                  tcid: 'TC-020',
                  name: 'Advanced Monitoring and Alerting System with Custom Dashboards and Escalation',
                  description: 'Test comprehensive monitoring with custom metrics and alerting rules',
                  author: 'Amanda Lee',
                  testType: 'Functional',
                  prerequisites: 'Monitoring infrastructure running',
                  overallResult: 'Not Run',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Create custom dashboard with 20 metrics',
                      testData: 'Dashboard: production_overview',
                      expectedResult: 'Dashboard loads and displays all metrics',
                      actualResult: '',
                      stepStatus: 'Not Run',
                      notes: ''
                    }
                  ]
                },
                {
                  tcid: 'TC-021',
                  name: 'Comprehensive E-commerce Platform with Payment Processing and Inventory Management',
                  description: 'Test complete e-commerce workflow from browsing to order fulfillment',
                  author: 'Kevin Martinez',
                  testType: 'Integration',
                  prerequisites: 'Payment gateway integration',
                  overallResult: 'Passed',
                  testSteps: [
                    {
                      stepNumber: 1,
                      description: 'Complete purchase flow with credit card',
                      testData: 'Product: Test Product, Payment: Visa ending 1234',
                      expectedResult: 'Order processed and confirmation sent',
                      actualResult: 'Order completed successfully',
                      stepStatus: 'Passed',
                      notes: ''
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]);

  // Projects selector (future filtering)
  const { getProjects } = useAuth();
  const [projectsList, setProjectsList] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        if (typeof getProjects === 'function') {
          const rows = await getProjects();
          if (isMounted) setProjectsList(Array.isArray(rows) ? rows : []);
        }
      } catch (_) {
        if (isMounted) setProjectsList([]);
      }
    })();
    return () => { isMounted = false; };
  }, [getProjects]);

  const statusColors = {
    Passed: 'text-green-400 bg-green-900/20',
    Failed: 'text-red-400 bg-red-900/20',
    'In Progress': 'text-amber-300 bg-amber-900/20',
    'Not Run': 'text-menu bg-white/5',
  };

  const testTypeColors = {
    Functional: 'text-[rgb(var(--tc-contrast))]',
    Security: 'text-red-400',
    Performance: 'text-purple-300',
    Usability: 'text-green-400',
    Integration: 'text-orange-300',
  };

  const priorityPill = (p) => {
    const map = {
      High: 'bg-red-900/20 text-red-400',
      Medium: 'bg-orange-900/20 text-orange-300',
      Low: 'bg-green-900/20 text-green-400',
    };
    return map[p] || map.Medium;
  };

  // Helper function to find and update test case in hierarchy
  const updateTestCaseInHierarchy = (tcid, updatedTestCase) => {
    setTestHierarchy(prevHierarchy => {
      const updateInNode = (node) => {
        if (node.testCases) {
          const updatedTestCases = node.testCases.map(tc => 
            tc.tcid === tcid ? updatedTestCase : tc
          );
          return { ...node, testCases: updatedTestCases };
        }
        if (node.children) {
          const updatedChildren = node.children.map(updateInNode);
          return { ...node, children: updatedChildren };
        }
        return node;
      };
      return prevHierarchy.map(updateInNode);
    });
  };

  // Helper function to delete test case from hierarchy
  const deleteTestCaseFromHierarchy = (tcid) => {
    setTestHierarchy(prevHierarchy => {
      const deleteFromNode = (node) => {
        if (node.testCases) {
          const filteredTestCases = node.testCases.filter(tc => tc.tcid !== tcid);
          return { ...node, testCases: filteredTestCases };
        }
        if (node.children) {
          const updatedChildren = node.children.map(deleteFromNode);
          return { ...node, children: updatedChildren };
        }
        return node;
      };
      return prevHierarchy.map(deleteFromNode);
    });
  };

  // Helper function to add test case to hierarchy
  const addTestCaseToHierarchy = (newTestCase, subsystemId) => {
    setTestHierarchy(prevHierarchy => {
      const addToNode = (node) => {
        if (node.id === subsystemId && node.testCases) {
          return { ...node, testCases: [...node.testCases, newTestCase] };
        }
        if (node.children) {
          const updatedChildren = node.children.map(addToNode);
          return { ...node, children: updatedChildren };
        }
        return node;
      };
      return prevHierarchy.map(addToNode);
    });
  };

  // Test case operations
  const handleViewTestCase = (testCase) => {
    setSelectedTestCase(testCase);
    setShowViewTestCaseModal(true);
  };

  const handleEditTestCase = (testCase) => {
    setSelectedTestCase(testCase);
    setEditTestCaseForm({
      tcid: testCase.tcid,
      name: testCase.name,
      description: testCase.description,
      author: testCase.author,
      testType: testCase.testType,
      overallResult: testCase.overallResult,
      prerequisites: testCase.prerequisites || '',
      testSteps: [...testCase.testSteps]
    });
    setShowEditTestCaseModal(true);
  };

  const handleDuplicateTestCase = (testCase) => {
    const newTestCase = {
      ...testCase,
      tcid: `TC-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      name: `${testCase.name} (Copy)`,
      overallResult: 'Not Run',
      testSteps: testCase.testSteps.map(step => ({
        ...step,
        actualResult: '',
        stepStatus: 'Not Run',
        notes: ''
      }))
    };
    
    // Add to the same subsystem as the original
    const subsystemId = findSubsystemId(testCase.tcid);
    if (subsystemId) {
      addTestCaseToHierarchy(newTestCase, subsystemId);
    }
  };

  const handleDeleteTestCase = (testCase) => {
    if (window.confirm(`Are you sure you want to delete test case "${testCase.name}"?`)) {
      deleteTestCaseFromHierarchy(testCase.tcid);
    }
  };

  // Bulk operations
  const handleBulkEdit = (selectedTestCases) => {
    // For demo purposes, just show an alert
    alert(`Bulk edit ${selectedTestCases.length} test cases. This would open a bulk edit modal in a real implementation.`);
  };

  const handleBulkDelete = (selectedTestCases) => {
    if (window.confirm(`Are you sure you want to delete ${selectedTestCases.length} test cases?`)) {
      selectedTestCases.forEach(testCase => {
        deleteTestCaseFromHierarchy(testCase.tcid);
      });
    }
  };

  // Test step management functions
  const addTestStep = (formType) => {
    const newStep = {
      stepNumber: 1,
      description: '',
      testData: '',
      expectedResult: '',
      actualResult: '',
      stepStatus: 'Not Run',
      notes: ''
    };

    if (formType === 'new') {
      const updatedSteps = [...newTestCaseForm.testSteps, newStep];
      setNewTestCaseForm(prev => ({
        ...prev,
        testSteps: updatedSteps.map((step, index) => ({
          ...step,
          stepNumber: index + 1
        }))
      }));
    } else {
      const updatedSteps = [...editTestCaseForm.testSteps, newStep];
      setEditTestCaseForm(prev => ({
        ...prev,
        testSteps: updatedSteps.map((step, index) => ({
          ...step,
          stepNumber: index + 1
        }))
      }));
    }
  };

  const removeTestStep = (index, formType) => {
    if (formType === 'new') {
      const updatedSteps = newTestCaseForm.testSteps.filter((_, i) => i !== index);
      setNewTestCaseForm(prev => ({
        ...prev,
        testSteps: updatedSteps.map((step, i) => ({
          ...step,
          stepNumber: i + 1
        }))
      }));
    } else {
      const updatedSteps = editTestCaseForm.testSteps.filter((_, i) => i !== index);
      setEditTestCaseForm(prev => ({
        ...prev,
        testSteps: updatedSteps.map((step, i) => ({
          ...step,
          stepNumber: i + 1
        }))
      }));
    }
  };

  const updateTestStep = (index, field, value, formType) => {
    if (formType === 'new') {
      const updatedSteps = [...newTestCaseForm.testSteps];
      updatedSteps[index] = { ...updatedSteps[index], [field]: value };
      setNewTestCaseForm(prev => ({ ...prev, testSteps: updatedSteps }));
    } else {
      const updatedSteps = [...editTestCaseForm.testSteps];
      updatedSteps[index] = { ...updatedSteps[index], [field]: value };
      setEditTestCaseForm(prev => ({ ...prev, testSteps: updatedSteps }));
    }
  };

  const handleNewTestCaseSubmit = (e) => {
    e.preventDefault();
    if (newTestCaseForm.testSteps.length === 0) {
      alert('Please add at least one test step.');
      return;
    }
    
    const newTestCase = {
      ...newTestCaseForm,
      testSteps: newTestCaseForm.testSteps.map((step, index) => ({
        ...step,
        stepNumber: index + 1
      }))
    };
    
    // Add to first available subsystem (for demo purposes)
    const subsystemId = 'subsystem-1';
    addTestCaseToHierarchy(newTestCase, subsystemId);
    
    // Reset form
    setNewTestCaseForm({
      tcid: '',
      name: '',
      description: '',
      author: '',
      testType: '',
      overallResult: '',
      prerequisites: '',
      testSteps: []
    });
    setShowNewTestCaseModal(false);
  };

  const handleEditTestCaseSubmit = (e) => {
    e.preventDefault();
    if (editTestCaseForm.testSteps.length === 0) {
      alert('Please add at least one test step.');
      return;
    }
    
    const updatedTestCase = {
      ...editTestCaseForm,
      testSteps: editTestCaseForm.testSteps.map((step, index) => ({
        ...step,
        stepNumber: index + 1
      }))
    };
    
    updateTestCaseInHierarchy(selectedTestCase.tcid, updatedTestCase);
    setShowEditTestCaseModal(false);
  };

  // Helper function to find subsystem ID for a test case
  const findSubsystemId = (tcid) => {
    for (const project of testHierarchy) {
      for (const function_ of project.children) {
        for (const subsystem of function_.children) {
          if (subsystem.testCases?.some(tc => tc.tcid === tcid)) {
            return subsystem.id;
          }
        }
      }
    }
    return null;
  };

  // Helper function to flatten all test cases from hierarchy
  const getAllTestCases = () => {
    const allTestCases = [];
    for (const project of testHierarchy) {
      for (const function_ of project.children) {
        for (const subsystem of function_.children) {
          if (subsystem.testCases) {
            allTestCases.push(...subsystem.testCases.map(tc => ({
              ...tc,
              project: project.name,
              function: function_.name,
              subsystem: subsystem.name
            })));
          }
        }
      }
    }
    return allTestCases;
  };

  // Filter test cases based on current filters
  const getFilteredTestCases = () => {
    let testCases = getAllTestCases();
    
    // Search filter
    if (searchTerm) {
      testCases = testCases.filter(tc => 
        tc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.tcid.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      testCases = testCases.filter(tc => tc.overallResult === filterStatus);
    }
    
    // Test type filter
    if (filterTestType !== 'all') {
      testCases = testCases.filter(tc => tc.testType === filterTestType);
    }
    
    // Priority filter (using test type as priority for demo)
    if (filterPriority !== 'all') {
      testCases = testCases.filter(tc => {
        const priority = getPriorityFromTestType(tc.testType);
        return priority === filterPriority;
      });
    }
    
    return testCases;
  };

  // Helper function to get priority from test type (for demo purposes)
  const getPriorityFromTestType = (testType) => {
    switch (testType) {
      case 'Security': return 'High';
      case 'Performance': return 'High';
      case 'Functional': return 'Medium';
      case 'Integration': return 'Medium';
      case 'Usability': return 'Low';
      default: return 'Medium';
    }
  };

  // Helper function to add priority to test cases
  const addPriorityToTestCases = (testCases) => {
    return testCases.map(tc => ({
      ...tc,
      priority: getPriorityFromTestType(tc.testType)
    }));
  };

  // Helper function to get priority icon
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'High':
        return <ArrowUp className="w-3 h-3 text-red-500" />;
      case 'Medium':
        return <Circle className="w-3 h-3 text-blue-500" />;
      case 'Low':
        return <ArrowDown className="w-3 h-3 text-green-500" />;
      default:
        return <Circle className="w-3 h-3 text-gray-500" />;
    }
  };


  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => 
      prev.includes(nodeId) 
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  const renderNode = (node, level = 0) => {
    const isExpanded = expandedNodes.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const hasTestCases = node.testCases && node.testCases.length > 0;

    return (
      <div key={node.id} className="space-y-2">
        <div 
          className={`flex items-center space-x-2 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer ${
            level === 0 ? 'bg-white/5' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate" />
              )}
            </button>
          )}
          
          <div className="flex items-center space-x-2 flex-1">
            <FileText className="w-4 h-4 text-[rgb(var(--tc-icon))]" />
            <span className="font-medium text-foreground">{node.name}</span>
            {node.type !== 'project' && (
              <span className="text-xs text-menu bg-white/5 px-2 py-1 rounded-full">
                {node.type}
              </span>
            )}
          </div>

          {hasTestCases && (
            <span className="text-sm text-menu">
              {node.testCases.length} test cases
            </span>
          )}
        </div>

        {/* Render test cases if this node has them */}
        {hasTestCases && isExpanded && (
          <div className="ml-8 space-y-2">
            {node.testCases.map((testCase) => (
              <motion.div
                key={testCase.tcid}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="group bg-card rounded-xl p-4 shadow-sm border border-subtle hover:bg-white/5 transition-colors"
                onDoubleClick={() => handleViewTestCase(testCase)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[rgb(var(--tc-icon))]/20 rounded-lg flex items-center justify-center">
                      <span className="text-[rgb(var(--tc-icon))] font-semibold text-sm">TC</span>
                    </div>
                    <div>
                       <h4 className="font-medium text-foreground">{testCase.tcid}: {testCase.name}</h4>
                       <p className="text-sm text-menu mt-1 line-clamp-2">{testCase.description}</p>
                       <div className="flex items-center space-x-3 mt-2">
                         <span className={`text-xs px-2 py-1 rounded-full ${statusColors[testCase.overallResult]}`}>
                           {testCase.overallResult}
                         </span>
                         <span className={`text-xs font-medium ${testTypeColors[testCase.testType]}`}>
                           {testCase.testType}
                         </span>
                         <span className="text-xs text-menu">
                           by {testCase.author}
                        </span>
                         <span className="text-xs text-menu">
                           {testCase.testSteps.length} steps
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                     <button 
                        onClick={() => handleViewTestCase(testCase)}
                        className="group p-2 text-menu hover:text-white hover:bg-white/10 rounded-lg transition-colors relative"
                        aria-label="View Test Case Details"
                      >
                       <Eye className="w-4 h-4" />
                     </button>
                     <button 
                        onClick={() => handleEditTestCase(testCase)}
                        className="group p-2 text-menu hover:text-white hover:bg-white/10 rounded-lg transition-colors relative"
                        aria-label="Edit Test Case"
                      >
                       <Edit className="w-4 h-4" />
                     </button>
                     <button 
                        onClick={() => handleDuplicateTestCase(testCase)}
                        className="group p-2 text-menu hover:text-white hover:bg-white/10 rounded-lg transition-colors relative"
                        aria-label="Duplicate Test Case"
                      >
                       <Copy className="w-4 h-4" />
                     </button>
                     <button 
                        onClick={() => handleDeleteTestCase(testCase)}
                        className="group p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors relative"
                        aria-label="Delete Test Case"
                      >
                       <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Test Cases</h1>
          <p className="text-menu mt-1">Manage and organize your test cases in a hierarchical structure.</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Projects selector (white on black) */}
          <select
            aria-label="Filter by Project"
            className="input-field text-sm h-10 !py-2 pr-8 w-80 lg:w-[28rem]"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            title="Filter by Project"
          >
            <option value="all">All Projects</option>
            {projectsList.map((p) => (
              <option key={p.id} value={p.id} title={p.name || p.projectName || p.id}>
                {p.name || p.projectName || p.id}
              </option>
            ))}
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-surface-muted border border-subtle text-white rounded-lg hover:brightness-110 transition-colors whitespace-nowrap">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button 
            className="flex items-center space-x-2 px-4 py-2 btn-primary whitespace-nowrap"
            onClick={() => setShowNewTestCaseModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>New Test Case</span>
          </button>
        </div>
      </div>



             {/* Test Hierarchy */}
       <div className="card">
         <div className="flex justify-between items-center mb-4">
           <h3 className="text-lg font-semibold text-foreground">Test Cases</h3>
           <div className="flex items-center space-x-2">
             <span className="text-sm text-menu">({getFilteredTestCases().length})</span>
             <div className="flex bg-surface-muted rounded-lg p-1 border border-subtle">
               <button
                 onClick={() => setViewMode('tree')}
                 className={`p-2 rounded-md transition-colors ${
                   viewMode === 'tree' 
                     ? 'bg-white/10 text-white' 
                     : 'text-menu hover:text-white'
                 }`}
                 title="Tree View"
               >
                 <List className="w-4 h-4" />
               </button>
                                <button
                   onClick={() => setViewMode('grid')}
                   className={`p-2 rounded-md transition-colors ${
                     viewMode === 'grid' 
                        ? 'bg-white/10 text-white' 
                        : 'text-menu hover:text-white'
                   }`}
                   title="Grid View"
                 >
                   <Grid className="w-4 h-4" />
                 </button>
             </div>
           </div>
         </div>
         
         {viewMode === 'tree' ? (
           <div className="space-y-2">
             {testHierarchy.map(node => renderNode(node))}
           </div>
         ) : (
           <TestCasesGrid
             testCases={addPriorityToTestCases(getFilteredTestCases())}
             onViewTestCase={handleViewTestCase}
             onEditTestCase={handleEditTestCase}
             onDeleteTestCase={handleDeleteTestCase}
             onDuplicateTestCase={handleDuplicateTestCase}
             onBulkEdit={handleBulkEdit}
             onBulkDelete={handleBulkDelete}
           />
         )}
       </div>

             {/* New Test Case Modal */}
       {showNewTestCaseModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-card border border-subtle rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
           >
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-semibold text-foreground">Create New Test Case</h3>
               <button
                 onClick={() => setShowNewTestCaseModal(false)}
                 className="p-2 text-menu hover:text-white hover:bg-white/10 rounded transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>
             
              <form onSubmit={handleNewTestCaseSubmit} className="tc-testcase-form tc-testcase-new space-y-6">
               {/* Basic Information */}
               <div className="flex items-center gap-2">
                 <Info className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                 <h4 className="text-lg font-medium text-foreground">Basic Information</h4>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-foreground mb-2">
                     Test Case ID (TCID) <span className="text-red-500">*</span>
                   </label>
                   <input
                     type="text"
                     placeholder="e.g., TC-008"
                     className="input-field"
                     value={newTestCaseForm.tcid}
                     onChange={(e) => setNewTestCaseForm(prev => ({ ...prev, tcid: e.target.value }))}
                     required
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-foreground mb-2">
                     Test Case Name <span className="text-red-500">*</span>
                   </label>
                   <input
                     type="text"
                     placeholder="Enter test case name"
                     className="input-field"
                     value={newTestCaseForm.name}
                     onChange={(e) => setNewTestCaseForm(prev => ({ ...prev, name: e.target.value }))}
                     required
                   />
                 </div>
               </div>

               <div>
                 <div className="flex items-center gap-2 mb-2">
                   <ClipboardList className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                   <h4 className="text-lg font-medium text-foreground">Description/Objective</h4>
                 </div>
                 <label className="block text-sm font-medium text-foreground mb-2">
                   Description/Objective <span className="text-red-500">*</span>
                 </label>
                 <textarea
                   placeholder="Describe WHAT, WHY and sometimes HOW you are testing..."
                   rows="3"
                   className="input-field"
                   value={newTestCaseForm.description}
                   onChange={(e) => setNewTestCaseForm(prev => ({ ...prev, description: e.target.value }))}
                   required
                 />
               </div>

               {/* Status & Results */}
               <div className="flex items-center gap-2">
                 <BarChart3 className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                 <h4 className="text-lg font-medium text-foreground">Status & Results</h4>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-foreground mb-2">
                     Test Author <span className="text-red-500">*</span>
                   </label>
                   <input
                     type="text"
                     placeholder="Enter test author name"
                     className="input-field"
                     value={newTestCaseForm.author}
                     onChange={(e) => setNewTestCaseForm(prev => ({ ...prev, author: e.target.value }))}
                     required
                   />
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                     Test Type
                   </label>
                   <select 
                     className="input-field"
                     value={newTestCaseForm.testType}
                     onChange={(e) => setNewTestCaseForm(prev => ({ ...prev, testType: e.target.value }))}
                   >
                     <option value="">Select Test Type</option>
                     <option value="Functional">Functional</option>
                     <option value="Security">Security</option>
                     <option value="Performance">Performance</option>
                     <option value="Usability">Usability</option>
                     <option value="Integration">Integration</option>
                   </select>
                 </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Priority
                    </label>
                    <select
                      className="input-field"
                      value={newTestCaseForm.priority}
                      onChange={(e) => setNewTestCaseForm(prev => ({ ...prev, priority: e.target.value }))}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                     Overall Test Result
                   </label>
                   <select 
                     className="input-field"
                     value={newTestCaseForm.overallResult}
                     onChange={(e) => setNewTestCaseForm(prev => ({ ...prev, overallResult: e.target.value }))}
                   >
                     <option value="">Select Result</option>
                     <option value="Passed">Passed</option>
                     <option value="Failed">Failed</option>
                     <option value="In Progress">In Progress</option>
                     <option value="Not Run">Not Run</option>
                   </select>
                 </div>
               </div>

               <div>
                 <div className="flex items-center gap-2 mb-2">
                   <ListChecks className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                   <h4 className="text-lg font-medium text-foreground">Pre-Requisites</h4>
                 </div>
                 <label className="block text-sm font-medium text-foreground mb-2">
                   Test Pre-Requisites
                 </label>
                 <textarea
                   placeholder="Describe system and data requirements needed prior to execution..."
                   rows="2"
                   className="input-field"
                   value={newTestCaseForm.prerequisites}
                   onChange={(e) => setNewTestCaseForm(prev => ({ ...prev, prerequisites: e.target.value }))}
                 />
               </div>

               {/* Test Steps Section */}
               <div>
               <div className="flex justify-between items-center mb-4">
                   <div className="flex items-center gap-2">
                     <ListChecks className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                     <h4 className="text-lg font-medium text-foreground">Test Steps</h4>
                   </div>
                   <button
                     type="button"
                     onClick={() => addTestStep('new')}
                     className="btn-primary text-sm"
                   >
                     <Plus className="w-4 h-4 mr-1" />
                     Add Step
                   </button>
                 </div>
                 
                 <div className="space-y-4">
                    {newTestCaseForm.testSteps.map((step, index) => (
                      <div key={index} className="bg-surface-muted rounded-lg p-4 border border-subtle">
                       <div className="flex justify-between items-center mb-3">
                          <h5 className="font-medium text-foreground">Step {step.stepNumber}</h5>
                         <button
                           type="button"
                           onClick={() => removeTestStep(index, 'new')}
                           className="text-red-500 hover:text-red-600 p-1"
                         >
                           <Minus className="w-4 h-4" />
                         </button>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <div>
                            <label className="block text-xs font-medium text-menu mb-1">
                             Description <span className="text-red-500">*</span>
                           </label>
                           <textarea
                             placeholder="Describe the user or system action..."
                             rows="2"
                             className="input-field text-sm"
                             value={step.description}
                             onChange={(e) => updateTestStep(index, 'description', e.target.value, 'new')}
                             required
                           />
                         </div>
                         
                         <div>
                            <label className="block text-xs font-medium text-menu mb-1">
                             Test Data
                           </label>
                           <input
                             type="text"
                             placeholder="Data to use during execution..."
                             className="input-field text-sm"
                             value={step.testData}
                             onChange={(e) => updateTestStep(index, 'testData', e.target.value, 'new')}
                           />
                         </div>
                         
                         <div>
                            <label className="block text-xs font-medium text-menu mb-1">
                             Expected Result <span className="text-red-500">*</span>
                           </label>
                           <textarea
                             placeholder="What should happen..."
                             rows="2"
                             className="input-field text-sm"
                             value={step.expectedResult}
                             onChange={(e) => updateTestStep(index, 'expectedResult', e.target.value, 'new')}
                             required
                           />
                         </div>
                         
                         <div>
                            <label className="block text-xs font-medium text-menu mb-1">
                             Step Status
                           </label>
                           <select 
                             className="input-field text-sm"
                             value={step.stepStatus}
                             onChange={(e) => updateTestStep(index, 'stepStatus', e.target.value, 'new')}
                           >
                             <option value="Not Run">Not Run</option>
                             <option value="Passed">Passed</option>
                             <option value="Failed">Failed</option>
                             <option value="In Progress">In Progress</option>
                           </select>
                         </div>
                       </div>
                       
                       <div className="mt-3">
                          <label className="block text-xs font-medium text-menu mb-1">
                           Notes/Comments
                         </label>
                         <textarea
                           placeholder="Additional notes..."
                           rows="1"
                           className="input-field text-sm"
                           value={step.notes}
                           onChange={(e) => updateTestStep(index, 'notes', e.target.value, 'new')}
                         />
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
               
               <div className="flex space-x-3 pt-4 border-t border-grey-light">
                 <button
                   type="button"
                   onClick={() => setShowNewTestCaseModal(false)}
                   className="flex-1 btn-secondary"
                 >
                   Cancel
                 </button>
                 <button
                   type="submit"
                   className="flex-1 btn-primary"
                 >
                   Create Test Case
                 </button>
               </div>
             </form>
           </motion.div>
         </div>
       )}

      {/* View Test Case Modal */}
      {showViewTestCaseModal && selectedTestCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
             className="tc-testcase-form tc-testcase-view bg-card border border-subtle rounded-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-semibold text-foreground">Test Case Details</h3>
              <button
                onClick={() => setShowViewTestCaseModal(false)}
                 className="p-2 text-menu hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6 text-foreground">
              {/* Test Case Header */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                    <h4 className="text-lg font-medium text-foreground">Basic Information</h4>
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Test Case ID (TCID)</label>
                      <input disabled className="input-field" value={selectedTestCase.tcid} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Test Case Name</label>
                      <input disabled className="input-field" value={selectedTestCase.name} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Author</label>
                      <input disabled className="input-field" value={selectedTestCase.author} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Test Type</label>
                      <input disabled className="input-field" value={selectedTestCase.testType} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
                      <div className="relative w-full">
                        <div className="input-field pr-24"></div>
                        <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-full ${priorityPill(selectedTestCase.priority || getPriorityFromTestType(selectedTestCase.testType))}`}>
                          {selectedTestCase.priority || getPriorityFromTestType(selectedTestCase.testType)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                    <h4 className="text-lg font-medium text-foreground">Status & Results</h4>
                  </div>
                   <div className="space-y-3">
                    <div>
                       <span className="text-sm font-medium text-menu">Overall Result:</span>
                      <span className={`ml-2 text-xs px-2 py-1 rounded-full ${statusColors[selectedTestCase.overallResult]}`}>
                        {selectedTestCase.overallResult}
                      </span>
                    </div>
                    <div>
                       <span className="text-sm font-medium text-menu">Total Steps:</span>
                       <p className="text-foreground">{selectedTestCase.testSteps.length}</p>
                    </div>
                    <div>
                       <span className="text-sm font-medium text-menu">Passed Steps:</span>
                       <p className="text-foreground">{selectedTestCase.testSteps.filter(step => step.stepStatus === 'Passed').length}</p>
                    </div>
                    <div>
                       <span className="text-sm font-medium text-menu">Failed Steps:</span>
                       <p className="text-foreground">{selectedTestCase.testSteps.filter(step => step.stepStatus === 'Failed').length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                 <div className="flex items-center gap-2 mb-2">
                   <ClipboardList className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                   <h4 className="text-lg font-medium text-foreground">Description/Objective</h4>
                 </div>
                 <textarea disabled className="input-field" rows="3" value={selectedTestCase.description} />
              </div>

              {/* Prerequisites */}
              {selectedTestCase.prerequisites && (
                <div>
                   <div className="flex items-center gap-2 mb-2">
                     <ListChecks className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                     <h4 className="text-lg font-medium text-foreground">Pre-Requisites</h4>
                   </div>
                   <textarea disabled className="input-field" rows="2" value={selectedTestCase.prerequisites} />
                </div>
              )}

              {/* Test Steps */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ListOrdered className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                  <h4 className="text-lg font-medium text-foreground">Test Steps</h4>
                </div>
                <div className="space-y-4">
                  {selectedTestCase.testSteps.map((step, index) => (
                    <div key={index} className="step-card border border-subtle p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                         <h5 className="font-medium text-foreground">Step {step.stepNumber}</h5>
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[step.stepStatus]}`}>
                          {step.stepStatus}
                        </span>
                      </div>
                      
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                            <textarea disabled className="input-field" rows="2" value={step.description} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Test Data</label>
                            <textarea disabled className="input-field" rows="2" value={step.testData} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Expected Result</label>
                            <textarea disabled className="input-field" rows="2" value={step.expectedResult} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Actual Result</label>
                            <textarea disabled className="input-field" rows="2" value={step.actualResult || 'Not recorded'} />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                            <textarea disabled className="input-field" rows="2" value={step.notes || ''} />
                          </div>
                        </div>
                      
                      {step.notes && (
                        <div className="mt-3">
                          <span className="font-medium text-slate text-sm">Notes:</span>
                          <p className="text-charcoal text-sm mt-1">{step.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Test Case Modal */}
      {showEditTestCaseModal && selectedTestCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
             className="bg-card border border-subtle rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-semibold text-foreground">Edit Test Case</h3>
              <button
                onClick={() => setShowEditTestCaseModal(false)}
                 className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-menu" />
              </button>
            </div>
            
            <form onSubmit={handleEditTestCaseSubmit} className="tc-testcase-form tc-testcase-edit space-y-6">
              {/* Basic Information */}
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                <h4 className="text-lg font-medium text-foreground">Basic Information</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Test Case ID (TCID) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., TC-008"
                    className="input-field"
                    value={editTestCaseForm.tcid}
                    onChange={(e) => setEditTestCaseForm(prev => ({ ...prev, tcid: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Test Case Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter test case name"
                    className="input-field"
                    value={editTestCaseForm.name}
                    onChange={(e) => setEditTestCaseForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                  <h4 className="text-lg font-medium text-foreground">Description/Objective</h4>
                </div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description/Objective <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Describe WHAT, WHY and sometimes HOW you are testing..."
                  rows="3"
                  className="input-field"
                  value={editTestCaseForm.description}
                  onChange={(e) => setEditTestCaseForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                <h4 className="text-lg font-medium text-foreground">Status & Results</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Test Author <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter test author name"
                    className="input-field"
                    value={editTestCaseForm.author}
                    onChange={(e) => setEditTestCaseForm(prev => ({ ...prev, author: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Test Type
                  </label>
                  <select 
                    className="input-field"
                    value={editTestCaseForm.testType}
                    onChange={(e) => setEditTestCaseForm(prev => ({ ...prev, testType: e.target.value }))}
                  >
                    <option value="">Select Test Type</option>
                    <option value="Functional">Functional</option>
                    <option value="Security">Security</option>
                    <option value="Performance">Performance</option>
                    <option value="Usability">Usability</option>
                    <option value="Integration">Integration</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Priority
                  </label>
                  <select
                    className="input-field"
                    value={editTestCaseForm.priority}
                    onChange={(e) => setEditTestCaseForm(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Overall Test Result
                  </label>
                  <select 
                    className="input-field"
                    value={editTestCaseForm.overallResult}
                    onChange={(e) => setEditTestCaseForm(prev => ({ ...prev, overallResult: e.target.value }))}
                  >
                    <option value="">Select Result</option>
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Not Run">Not Run</option>
                  </select>
                </div>
              </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ListOrdered className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                    <h4 className="text-lg font-medium text-foreground">Pre-Requisites</h4>
                  </div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                  Test Pre-Requisites
                </label>
                <textarea
                  placeholder="Describe system and data requirements needed prior to execution..."
                  rows="2"
                    className="input-field"
                  value={editTestCaseForm.prerequisites}
                  onChange={(e) => setEditTestCaseForm(prev => ({ ...prev, prerequisites: e.target.value }))}
                />
              </div>

              {/* Test Steps Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-[rgb(var(--tc-icon))]" />
                    <h4 className="text-lg font-medium text-foreground">Test Steps</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => addTestStep('edit')}
                    className="btn-primary text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Step
                  </button>
                </div>
                
                    <div className="space-y-4">
                  {editTestCaseForm.testSteps.map((step, index) => (
                    <div key={index} className="bg-surface-muted rounded-lg p-4 border border-subtle">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium text-foreground">Step {step.stepNumber}</h5>
                        <button
                          type="button"
                          onClick={() => removeTestStep(index, 'edit')}
                          className="text-red-500 hover:text-red-600 p-1"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">
                            Description <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            placeholder="Describe the user or system action..."
                            rows="2"
                            className="input-field text-sm"
                            value={step.description}
                            onChange={(e) => updateTestStep(index, 'description', e.target.value, 'edit')}
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">
                            Test Data
                          </label>
                          <input
                            type="text"
                            placeholder="Data to use during execution..."
                            className="input-field text-sm"
                            value={step.testData}
                            onChange={(e) => updateTestStep(index, 'testData', e.target.value, 'edit')}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">
                            Expected Result <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            placeholder="What should happen..."
                            rows="2"
                            className="input-field text-sm"
                            value={step.expectedResult}
                            onChange={(e) => updateTestStep(index, 'expectedResult', e.target.value, 'edit')}
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">
                            Actual Result
                          </label>
                          <textarea
                            placeholder="What actually happened..."
                            rows="2"
                            className="input-field text-sm"
                            value={step.actualResult}
                            onChange={(e) => updateTestStep(index, 'actualResult', e.target.value, 'edit')}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">Step Status</label>
                          <select 
                            className="input-field text-sm"
                            value={step.stepStatus}
                            onChange={(e) => updateTestStep(index, 'stepStatus', e.target.value, 'edit')}
                          >
                            <option value="Not Run">Not Run</option>
                            <option value="Passed">Passed</option>
                            <option value="Failed">Failed</option>
                            <option value="In Progress">In Progress</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mt-3 md:col-span-2">
                        <label className="block text-xs font-medium text-foreground mb-1">Notes/Comments</label>
                        <textarea
                          placeholder="Additional notes..."
                          rows="2"
                          className="input-field text-sm"
                          value={step.notes}
                          onChange={(e) => updateTestStep(index, 'notes', e.target.value, 'edit')}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4 border-t border-grey-light">
                <button
                  type="button"
                  onClick={() => setShowEditTestCaseModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Update Test Case
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TestCases; 