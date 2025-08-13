import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from './Toast';
import DataTable from './table/DataTable';
import { resolveUserName } from '../utils/textUtils';
import { 
  Search, 
  Edit,
  Trash2,
  Eye,
  ArrowUp,
  ArrowDown,
  Circle,
  Download,
  Plus,
  Settings,
  MoreVertical
} from 'lucide-react';

import { testTypeService } from '../services/testTypeService';

const TestCasesGrid = ({ 
  testCases, 
  onViewTestCase, 
  onEditTestCase, 
  onDeleteTestCase, 
  onDuplicateTestCase,
  onBulkEdit,
  onBulkDelete,
  resolveTags,
  onFilterByTag,
  organizationUsers = [],
}) => {
  const [orgTypes, setOrgTypes] = useState([]);
  const { push } = useToast() || { push: () => {} };
  useEffect(() => {
    (async () => {
      // Grid view may not know org; best-effort: derive from first row
      const first = Array.isArray(testCases) && testCases.length > 0 ? testCases[0] : null;
      const orgId = first?.organizationId || null;
      if (!orgId) return;
      const list = await testTypeService.getResolvedOrgTestTypes(orgId);
      setOrgTypes(list);
    })();
  }, [testCases]);
  // Prepare data for MUI DataGrid with unique IDs
  const gridData = useMemo(() => {
    if (!testCases || !Array.isArray(testCases)) {
      return [];
    }
    
    return testCases.map((testCase, index) => {
      return ({
      id: index, // MUI DataGrid requires unique id field
      tcid: testCase.tcid || '',
      name: testCase.name || '',
      author: resolveUserName(testCase.author, organizationUsers),
      testType: testCase.testType || '',
      testTypeCode: testCase.testTypeCode || '',
      priority: testCase.priority || 'Medium',
      overallResult: testCase.overallResult || 'Not Run',
      stepsCount: Array.isArray(testCase.testSteps) ? testCase.testSteps.length : 0,
        
      // Store original data for actions
        originalData: testCase
      });
    });
  }, [testCases, resolveTags]);

  // Column definitions for headless DataTable (TanStack)
  const columns = [
    {
      id: 'tcid',
      header: 'Test Case ID',
      accessorKey: 'tcid',
      size: 200,
      cell: ({ getValue }) => (
        <span
          className="inline-flex items-center justify-center min-w-[180px] px-2 py-0.5 rounded-md text-xs font-medium bg-[rgb(var(--tc-icon))]/20 text-[rgb(var(--tc-icon))] text-center"
          title={getValue()}
        >
          {getValue()}
        </span>
      ),
      enableSorting: true,
      filterType: 'text',
    },
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      size: 350,
      cell: ({ getValue }) => (
        <div className="font-medium text-foreground truncate max-w-[340px]" title={getValue()}>{getValue()}</div>
      ),
      enableSorting: true,
      filterType: 'text',
    },
    {
      id: 'author',
      header: 'Author',
      accessorKey: 'author',
      size: 180,
      cell: ({ getValue }) => {
        const gradients = [
          'from-blue-600 to-cyan-500',
          'from-violet-600 to-fuchsia-500',
          'from-emerald-600 to-green-500',
          'from-orange-600 to-red-500',
          'from-indigo-600 to-purple-500',
        ];
        const value = getValue();
        const authorInitials = value?.split(' ').map(n => n[0]).join('').toUpperCase() || 'NA';
        const colorIndex = (value?.length || 0) % gradients.length;

        return (
            <div className="h-full flex items-center space-x-2">
            <div className={`w-6 h-6 bg-gradient-to-br ${gradients[colorIndex]} rounded-full flex items-center justify-center`}>
              <span className="text-white text-xs font-bold">{authorInitials}</span>
            </div>
            <span className="text-sm font-medium text-foreground">{value}</span>
          </div>
        );
      },
      enableSorting: true,
      filterType: 'text',
    },
    {
      id: 'testType',
      header: 'Test Type',
      accessorKey: 'testType',
      size: 180,
      cell: ({ row }) => {
        const code = row.original.testTypeCode;
        const found = orgTypes.find((t) => t.id === code);
        const name = found?.name || row.getValue('testType');
        const icon = found?.icon || null;
        return (
          <span className="inline-flex items-center h-7 px-2 rounded-full text-sm font-medium text-foreground bg-white/5" title={code || ''}>
            {icon?.url && (
              <span
                className="mr-1"
                style={{
                  WebkitMaskImage: `url(${icon.url})`,
                  maskImage: `url(${icon.url})`,
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  backgroundColor: icon.colorDark || '#60a5fa',
                  width: '16px',
                  height: '16px',
                  display: 'inline-block',
                }}
              />
            )}
            {name}
          </span>
        );
      },
      enableSorting: true,
      filterType: 'text',
    },
    {
      id: 'priority',
      header: 'Priority',
      accessorKey: 'priority',
      size: 120,
      cell: ({ getValue }) => {
        const config = {
          High: {
            icon: <ArrowUp className="w-3 h-3 text-red-400" />,
            classes: 'bg-red-900/20 text-red-400',
          },
          Medium: {
            icon: <Circle className="w-3 h-3 text-orange-300" />,
            classes: 'bg-orange-900/20 text-orange-300',
          },
          Low: {
            icon: <ArrowDown className="w-3 h-3 text-green-400" />,
            classes: 'bg-green-900/20 text-green-400',
          },
        };
        const value = getValue();
        const style = config[value] || config['Medium'];
        
        return (
          <div className={`h-full flex items-center`}>
            <div className={`inline-flex items-center h-7 space-x-1 px-2 rounded-full text-sm font-medium ${style.classes}`}>
            {style.icon}
            <span>{value}</span>
            </div>
          </div>
        );
      },
      enableSorting: true,
      filterType: 'select',
    },
    {
      id: 'overallResult',
      header: 'Status',
      accessorKey: 'overallResult',
      size: 130,
      cell: ({ getValue }) => {
        const config = {
          Passed: { classes: 'bg-green-900/20 text-green-400', icon: '✓' },
          Failed: { classes: 'bg-red-900/20 text-red-400', icon: '✗' },
          'In Progress': { classes: 'bg-amber-900/20 text-amber-300', icon: '⟳' },
          'Not Run': { classes: 'bg-white/5 text-menu', icon: '○' },
        };
        const value = getValue();
        const style = config[value] || config['Not Run'];
        
        return (
          <span className={`inline-flex items-center h-7 space-x-1 px-2 rounded-full text-sm font-medium ${style.classes}`}>
            <span className="text-sm">{style.icon}</span>
            <span>{value}</span>
          </span>
        );
      },
      enableSorting: true,
      filterType: 'select',
    },
    {
      id: 'stepsCount',
      header: 'Steps',
      accessorKey: 'stepsCount',
      size: 100,
      cell: ({ getValue }) => (
        <div className="h-full flex items-center space-x-2">
          <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">{getValue()}</span>
          </div>
          <span className="text-sm text-menu">steps</span>
        </div>
      ),
      enableSorting: true,
      filterType: 'text',
    },
    
    {
      id: 'actions',
      header: 'Actions',
      size: 140,
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div className="h-full flex items-center space-x-1">
          <button
            onClick={() => onViewTestCase(row.original.originalData)}
            className="p-1.5 text-menu hover:text-white hover:bg-white/10 rounded transition-all duration-200"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEditTestCase(row.original.originalData)}
            className="p-1.5 text-menu hover:text-white hover:bg-white/10 rounded transition-all duration-200"
            title="Edit Test Case"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteTestCase(row.original.originalData)}
            className="p-1.5 text-menu hover:text-red-300 hover:bg-red-900/20 rounded transition-all duration-200"
            title="Delete Test Case"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    }

  ];

  return (
    <div className="space-y-6">
      {/* MUI DataGrid */}
        <div className="bg-card rounded-lg shadow-lg border border-subtle">
        <div className="flex items-center justify-between p-4 bg-surface-muted border-b border-subtle">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-foreground">Test Cases</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[rgb(var(--tc-icon))]/20 text-[rgb(var(--tc-contrast))]">
              {gridData.length} total
            </span>
          </div>
          {/* Filter controls are rendered inside grid toolbar below */}
          <div />
        </div>
        
        <div className="w-full" style={{ width: '100%' }}>
          <DataTable
            data={gridData}
            columns={columns}
            defaultPageSize={20}
            pageSizeOptions={[10, 20, 50]}
            emptyMessage="No test cases"
            className="text-foreground"
            onRowAddSuccess={(row) => {
              const tc = row?.originalData || {};
              if (tc?.tcid && tc?.name) {
                push({ variant: 'success', message: `Test Case <${tc.tcid}: ${tc.name}> was successfully added to the database` });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TestCasesGrid; 