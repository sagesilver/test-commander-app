import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../services/authService';
import { testTypeService } from '../services/testTypeService';
import { organizationService } from '../services/organizationService';
import { 
  ArrowLeft, 
  FileText, 
  X, 
  Download,
  FileSpreadsheet,
  FileCode,
  Building
} from 'lucide-react';

const TestImport = () => {
  const { currentUserData, currentOrganization } = useAuth();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });
  const [availableTestTypes, setAvailableTestTypes] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  
  // Form state
  const [numTests, setNumTests] = useState(10);
  const [minSteps, setMinSteps] = useState(3);
  const [maxSteps, setMaxSteps] = useState(8);
  const [includeLargeFields, setIncludeLargeFields] = useState(true);
  const [fileFormat, setFileFormat] = useState('csv');

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrganizationId) {
      loadTestTypes();
    } else {
      setAvailableTestTypes([]);
    }
  }, [selectedOrganizationId]);

  const loadOrganizations = async () => {
    try {
      setLoadingOrgs(true);
      const orgs = await organizationService.getAllOrganizations();
      
      if (orgs.length === 0) {
        // No organizations exist - this is unusual for App Admins
        console.warn('No organizations found in the system');
        setOrganizations([]);
        setSelectedOrganizationId('');
        return;
      }
      
      setOrganizations(orgs);
      
      // For App Admins, prioritize current organization but fall back to any available
      if (currentOrganization?.id) {
        setSelectedOrganizationId(currentOrganization.id);
      } else if (orgs.length > 0) {
        // Find the first active organization or just the first one
        const activeOrg = orgs.find(org => org.isActive !== false) || orgs[0];
        setSelectedOrganizationId(activeOrg.id);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
      setAlert({
        show: true,
        message: 'Error loading organizations: ' + error.message,
        severity: 'error'
      });
      setOrganizations([]);
      setSelectedOrganizationId('');
    } finally {
      setLoadingOrgs(false);
    }
  };

  const loadTestTypes = async () => {
    if (!selectedOrganizationId) {
      setAvailableTestTypes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // For App Admins, load ONLY ENABLED test types from the selected organization
      let enabledTestTypes = [];
      
      // Load organization-specific test types and filter to ONLY enabled ones
      try {
        const orgTestTypes = await testTypeService.getResolvedOrgTestTypes(selectedOrganizationId);
        // Only include test types that are explicitly enabled (enabled === true)
        enabledTestTypes = orgTestTypes.filter(tt => tt.enabled === true);
      } catch (error) {
        console.warn('Could not load organization test types:', error);
      }
      
      // Load global test types and filter to ONLY enabled ones
      try {
        const globalTestTypes = await testTypeService.listGlobalTestTypes({ status: 'ACTIVE' });
        // Only include global test types that are enabled
        const enabledGlobalTypes = globalTestTypes.filter(tt => tt.enabled === true);
        enabledTestTypes.push(...enabledGlobalTypes);
      } catch (error) {
        console.warn('Could not load global test types:', error);
      }
      
      // Remove duplicates and ensure all are enabled
      const uniqueEnabledTypes = enabledTestTypes.filter((tt, index, self) => 
        index === self.findIndex(t => t.id === tt.id)
      );
      
      setAvailableTestTypes(uniqueEnabledTypes);
    } catch (error) {
      console.error('Error loading test types:', error);
      setAlert({
        show: true,
        message: 'Error loading test types: ' + error.message,
        severity: 'error'
      });
      setAvailableTestTypes([]);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUserData || !currentUserData.roles?.includes(USER_ROLES.APP_ADMIN)) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Access Denied</h2>
          <p className="text-red-600">You need to be an App Admin to access Test Import.</p>
        </div>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!selectedOrganizationId) {
      setAlert({
        show: true,
        message: 'Please select an organization first.',
        severity: 'error'
      });
      return;
    }

    if (fileFormat === 'xlsx' || fileFormat === 'json') {
      setAlert({
        show: true,
        message: 'XLSX and JSON formats are coming soon!',
        severity: 'error'
      });
      return;
    }

    if (availableTestTypes.length === 0) {
      setAlert({
        show: true,
        message: 'No enabled test types available for the selected organization. Please ensure test types are configured and enabled.',
        severity: 'error'
      });
      return;
    }

    setGenerating(true);
    
    try {
      // Generate test data based on form values
      const testData = generateTestData();
      
      // Create and download the file
      if (fileFormat === 'csv') {
        downloadCSV(testData);
      }
      
      setAlert({
        show: true,
        message: `Successfully generated ${numTests} test cases in ${fileFormat.toUpperCase()} format!`,
        severity: 'success'
      });
    } catch (error) {
      setAlert({
        show: true,
        message: 'Error generating test data: ' + error.message,
        severity: 'error'
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateTestData = () => {
    const priorities = ['High', 'Medium', 'Low'];
    const authors = ['Test Engineer', 'QA Analyst', 'Developer', 'Business Analyst'];

    // Ensure we have test types available
    if (availableTestTypes.length === 0) {
      throw new Error('No test types available for the selected organization');
    }

    const data = [];
    
    for (let i = 1; i <= numTests; i++) {
      const testType = availableTestTypes[Math.floor(Math.random() * availableTestTypes.length)];
      const numSteps = Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;
      
      const testCase = {
        Name: includeLargeFields 
          ? `Comprehensive Test Case ${i} - This is a very long test case name that includes multiple words and descriptions to test the system's ability to handle large field values in the test case name field. This should be sufficient to test the maximum length capabilities.`
          : `Test Case ${i}`,
        Description: includeLargeFields
          ? `This is a comprehensive test case description that includes detailed information about what is being tested, the expected behavior, and any special considerations. The description should be thorough enough to provide context for testers and stakeholders. This field is designed to test the system's ability to handle large amounts of text in the description field.`
          : `Test case description for test case ${i}`,
        Author: authors[Math.floor(Math.random() * authors.length)],
        'Test Type Name': testType.name,
        'Overall Result': 'Not Run',
        Prerequisites: includeLargeFields
          ? `This test case requires several prerequisites to be met before execution can begin. These include system availability, test data preparation, user account setup, and environment configuration. The prerequisites should be clearly documented to ensure proper test execution.`
          : `System is available and test data is prepared`,
        Priority: priorities[Math.floor(Math.random() * priorities.length)],
        'Steps JSON': generateStepsJSON(numSteps, includeLargeFields)
      };
      
      data.push(testCase);
    }
    
    return data;
  };

  const generateStepsJSON = (numSteps, includeLargeFields) => {
    const steps = [];
    
    for (let i = 1; i <= numSteps; i++) {
      const step = {
        stepNumber: i,
        action: includeLargeFields
          ? `This is a detailed action description for step ${i} that includes comprehensive instructions on what the tester should do. The action should be clear, specific, and actionable. This field is designed to test the system's ability to handle large amounts of text in the action field.`
          : `Action ${i}`,
        expectedResult: includeLargeFields
          ? `This is a detailed expected result description for step ${i} that includes comprehensive information about what the tester should expect to see or experience. The expected result should be clear, specific, and verifiable. This field is designed to test the system's ability to handle large amounts of text in the expected result field.`
          : `Expected result ${i}`,
        testData: includeLargeFields
          ? `This is comprehensive test data for step ${i} that includes all necessary information, parameters, and values needed to execute this step. The test data should be complete, accurate, and relevant to the test case. This field is designed to test the system's ability to handle large amounts of text in the test data field.`
          : `Test data for step ${i}`
      };
      steps.push(step);
    }
    
    return JSON.stringify(steps);
  };

  const downloadCSV = (data) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape quotes and wrap in quotes if contains comma or newline
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `import-test-${numTests}x-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loadingOrgs) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[rgb(var(--tc-icon))] border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-muted">Loading organizations...</span>
        </div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h2 className="text-amber-800 font-semibold">No Organizations Available</h2>
          <p className="text-amber-600 mb-3">
            No organizations found in the system. As an App Admin, you need to create at least one organization to test the import functionality.
          </p>
          <div className="space-y-2 text-sm">
            <p className="font-medium">To proceed, you can:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Go to the Organizations section and create a new organization</li>
              <li>Or use the Firebase console to create an organization manually</li>
              <li>Or run the organization setup script if available</li>
            </ul>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => navigate('/organizations')}
              className="btn-primary text-sm"
            >
              Go to Organizations
            </button>
            <button
              onClick={() => navigate('/test-utilities')}
              className="btn-secondary text-sm"
            >
              Back to Test Utilities
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/test-utilities')}
            className="p-2 text-muted hover:text-foreground transition-colors"
            title="Back to Test Utilities"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-foreground">Test Import Utility</h1>
        </div>
        <p className="text-muted">Generate test case data files for testing the import functionality</p>
      </div>

      {/* Alert Messages */}
      {alert.show && (
        <div className={`p-4 rounded-lg mb-6 flex items-center space-x-2 ${
          alert.severity === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <span>{alert.message}</span>
          <button
            onClick={() => setAlert({ ...alert, show: false })}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="card max-w-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Generate Test Data</h2>
          <p className="text-muted text-sm">
            This utility generates test case data files that can be used to test the import functionality. 
            The generated files include Name, Description, Author, Test Type Name, Overall Result, Prerequisites, Priority, and Steps JSON.
            Configure the options below and click Generate to create a test file.
          </p>
        </div>

        <div className="space-y-6">
          {/* Organization Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Organization
            </label>
            <div className="relative">
              <select
                value={selectedOrganizationId}
                onChange={(e) => setSelectedOrganizationId(e.target.value)}
                className="input-field w-full pr-8"
                disabled={loading}
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
              <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            </div>
            <p className="text-muted text-xs mt-1">
              Select an organization to load only its enabled test types (App Admins see enabled types from org + global)
            </p>
          </div>

          {/* Test Types Status */}
          {selectedOrganizationId && (
            <div className="p-3 border border-subtle rounded-lg bg-surface-muted">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-[rgb(var(--tc-icon))] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-muted">Loading enabled test types...</span>
                </div>
              ) : (
                <div className="text-sm">
                  <span className="text-foreground">Enabled test types: </span>
                  <span className="font-medium text-[rgb(var(--tc-icon))]">{availableTestTypes.length}</span>
                  <span className="text-muted ml-1">(Organization + Global enabled only)</span>
                  {availableTestTypes.length === 0 && (
                    <span className="text-amber-600 ml-2">⚠️ No enabled test types found</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Generate Button Help */}
          {selectedOrganizationId && availableTestTypes.length === 0 && (
            <div className="p-3 border border-amber-200 rounded-lg bg-amber-50">
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">⚠️ Cannot Generate Test Data</p>
                <p>No enabled test types found. As an App Admin, you can:</p>
                <ul className="list-disc list-inside mt-1 ml-2 space-y-1">
                  <li>Select a different organization that has enabled test types</li>
                  <li>Enable test types in the Test Types management section</li>
                  <li>Create new test types if none exist</li>
                </ul>
              </div>
            </div>
          )}

          {/* Number of Tests Slider */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Number of Test Cases: {numTests}
            </label>
            <input
              type="range"
              min="1"
              max="1000"
              value={numTests}
              onChange={(e) => setNumTests(parseInt(e.target.value))}
              className="w-full h-2 bg-subtle rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>1</span>
              <span>1000</span>
            </div>
          </div>

          {/* Test Steps Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Min Steps
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={minSteps}
                onChange={(e) => setMinSteps(parseInt(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Max Steps
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={maxSteps}
                onChange={(e) => setMaxSteps(parseInt(e.target.value))}
                className="input-field"
              />
            </div>
          </div>

          {/* Large Field Testing */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeLargeFields}
                onChange={(e) => setIncludeLargeFields(e.target.checked)}
                className="rounded border-subtle text-[rgb(var(--tc-icon))] focus:ring-[rgb(var(--tc-icon))]"
              />
              <span className="text-sm font-medium text-foreground">Include large field value testing</span>
            </label>
            <p className="text-muted text-xs mt-1">
              Generates longer text for Name, Description, Prerequisites, and Step fields
            </p>
          </div>

          {/* Tags Inclusion - Coming Soon */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Include Tags</label>
            <div className="p-3 border border-subtle rounded-lg bg-surface-muted">
              <p className="text-muted text-sm">⚠️ Tags feature is coming soon!</p>
            </div>
          </div>

          {/* File Format Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">File Format</label>
            <div className="grid grid-cols-3 gap-3">
              <label className="flex items-center space-x-2 cursor-pointer p-3 border border-subtle rounded-lg hover:border-[rgb(var(--tc-icon))] transition-colors">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={fileFormat === 'csv'}
                  onChange={() => setFileFormat('csv')}
                  className="text-[rgb(var(--tc-icon))] focus:ring-[rgb(var(--tc-icon))]"
                />
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[rgb(var(--tc-icon))]" />
                  <span className="text-sm text-foreground">CSV</span>
                </div>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer p-3 border border-subtle rounded-lg hover:border-[rgb(var(--tc-icon))] transition-colors">
                <input
                  type="radio"
                  name="format"
                  value="xlsx"
                  checked={fileFormat === 'xlsx'}
                  onChange={() => setFileFormat('xlsx')}
                  className="text-[rgb(var(--tc-icon))] focus:ring-[rgb(var(--tc-icon))]"
                />
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-muted" />
                  <span className="text-sm text-muted">XLSX</span>
                </div>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer p-3 border border-subtle rounded-lg hover:border-[rgb(var(--tc-icon))] transition-colors">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={fileFormat === 'json'}
                  onChange={() => setFileFormat('json')}
                  className="text-[rgb(var(--tc-icon))] focus:ring-[rgb(var(--tc-icon))]"
                />
                <div className="flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-muted" />
                  <span className="text-sm text-foreground">JSON</span>
                </div>
              </label>
            </div>
            {(fileFormat === 'xlsx' || fileFormat === 'json') && (
              <p className="text-amber-600 text-xs mt-2">
                ⚠️ {fileFormat.toUpperCase()} format is coming soon!
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleGenerate}
              disabled={generating || (fileFormat === 'xlsx' || fileFormat === 'json') || !selectedOrganizationId || availableTestTypes.length === 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate Test File
                </>
              )}
            </button>
            <button
              onClick={() => navigate('/test-utilities')}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestImport;
