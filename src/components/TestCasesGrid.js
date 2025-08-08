import React, { useState, useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
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

const TestCasesGrid = ({ 
  testCases, 
  onViewTestCase, 
  onEditTestCase, 
  onDeleteTestCase, 
  onDuplicateTestCase,
  onBulkEdit,
  onBulkDelete 
}) => {
  // Prepare data for MUI DataGrid with unique IDs
  const gridData = useMemo(() => {
    if (!testCases || !Array.isArray(testCases)) {
      return [];
    }
    
    return testCases.map((testCase, index) => ({
      id: index, // MUI DataGrid requires unique id field
      tcid: testCase.tcid || '',
      name: testCase.name || '',
      author: testCase.author || '',
      testType: testCase.testType || '',
      priority: testCase.priority || 'Medium',
      overallResult: testCase.overallResult || 'Not Run',
      stepsCount: Array.isArray(testCase.testSteps) ? testCase.testSteps.length : 0,
      // Store original data for actions
      originalData: testCase
    }));
  }, [testCases]);

  // Column definitions for MUI DataGrid
  const columns = [
    {
      field: 'tcid',
      headerName: 'Test Case ID',
      width: 150,
      renderCell: (params) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          {params.value}
        </span>
      )
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 350,
      renderCell: (params) => (
        <div className="font-medium text-gray-900 truncate w-full" title={params.value}>
          {params.value}
        </div>
      )
    },
    {
      field: 'author',
      headerName: 'Author',
      width: 180,
      renderCell: (params) => {
        const colors = [
          'from-purple-500 to-pink-500',
          'from-blue-500 to-cyan-500', 
          'from-green-500 to-emerald-500',
          'from-orange-500 to-red-500',
          'from-indigo-500 to-purple-500'
        ];
        const authorInitials = params.value?.split(' ').map(n => n[0]).join('').toUpperCase() || 'NA';
        const colorIndex = (params.value?.length || 0) % colors.length;
        
        return (
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 bg-gradient-to-br ${colors[colorIndex]} rounded-full flex items-center justify-center`}>
              <span className="text-white text-xs font-bold">{authorInitials}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{params.value}</span>
          </div>
        );
      }
    },
    {
      field: 'testType',
      headerName: 'Test Type',
      width: 140,
      renderCell: (params) => {
        const colors = {
          'Functional': 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
          'Security': 'bg-gradient-to-r from-red-500 to-red-600 text-white',
          'Performance': 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
          'Usability': 'bg-gradient-to-r from-green-500 to-green-600 text-white',
          'Integration': 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
        };
        
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${colors[params.value] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'}`}>
            {params.value}
          </span>
        );
      }
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 120,
      renderCell: (params) => {
        const config = {
          'High': { 
            icon: <ArrowUp className="w-3 h-3 text-white" />,
            bg: 'bg-gradient-to-r from-red-500 to-red-600',
            text: 'text-white'
          },
          'Medium': { 
            icon: <Circle className="w-3 h-3 text-white" />,
            bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
            text: 'text-white'
          },
          'Low': { 
            icon: <ArrowDown className="w-3 h-3 text-white" />,
            bg: 'bg-gradient-to-r from-green-500 to-green-600',
            text: 'text-white'
          }
        };
        const style = config[params.value] || config['Medium'];
        
        return (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
            {style.icon}
            <span>{params.value}</span>
          </div>
        );
      }
    },
    {
      field: 'overallResult',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => {
        const config = {
          'Passed': {
            bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
            text: 'text-white',
            icon: '✓'
          },
          'Failed': {
            bg: 'bg-gradient-to-r from-red-500 to-red-600',
            text: 'text-white',
            icon: '✗'
          },
          'In Progress': {
            bg: 'bg-gradient-to-r from-amber-500 to-amber-600',
            text: 'text-white',
            icon: '⟳'
          },
          'Not Run': {
            bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
            text: 'text-white',
            icon: '○'
          }
        };
        const style = config[params.value] || config['Not Run'];
        
        return (
          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
            <span className="text-sm">{style.icon}</span>
            <span>{params.value}</span>
          </span>
        );
      }
    },
    {
      field: 'stepsCount',
      headerName: 'Steps',
      width: 100,
      renderCell: (params) => (
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">{params.value}</span>
          </div>
          <span className="text-sm text-gray-600">steps</span>
        </div>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onViewTestCase(params.row.originalData)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all duration-200"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEditTestCase(params.row.originalData)}
            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-all duration-200"
            title="Edit Test Case"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteTestCase(params.row.originalData)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200"
            title="Delete Test Case"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }

  ];

  return (
    <div className="space-y-6">
      {/* MUI DataGrid */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">Test Cases</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {gridData.length} total
            </span>
          </div>

        </div>
        
        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={gridData}
            columns={columns}
            pageSize={20}
            rowsPerPageOptions={[10, 20, 50]}
            checkboxSelection={false}
            disableSelectionOnClick
            autoHeight={false}
            disableColumnMenu={false}
            disableColumnFilter={false}
            disableColumnSelector={false}
                              sx={{
              '& .MuiDataGrid-cell': {
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f9fafb',
              },
              '& .MuiDataGrid-columnHeader': {
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f3f4f6',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 'bold',
              },
              '& .MuiDataGrid-filler': {
                display: 'none',
              },
              '& .MuiDataGrid-columnHeader .MuiDataGrid-menuIcon': {
                visibility: 'visible !important',
                opacity: '1 !important',
                display: 'flex !important',
              },
              '& .MuiDataGrid-columnHeader .MuiDataGrid-sortIcon': {
                visibility: 'visible !important',
                opacity: '1 !important',
                display: 'flex !important',
              },
              '& .MuiDataGrid-columnHeader .MuiDataGrid-iconButtonContainer': {
                visibility: 'visible !important',
                opacity: '1 !important',
                display: 'flex !important',
              },
              '& .MuiDataGrid-columnHeader:hover .MuiDataGrid-menuIcon': {
                visibility: 'visible !important',
                opacity: '1 !important',
                display: 'flex !important',
              },
              '& .MuiDataGrid-columnHeader:not(:hover) .MuiDataGrid-menuIcon': {
                visibility: 'visible !important',
                opacity: '1 !important',
                display: 'flex !important',
              },
              '& .MuiDataGrid-columnHeader:hover .MuiDataGrid-sortIcon': {
                visibility: 'visible !important',
                opacity: '1 !important',
                display: 'flex !important',
              },
              '& .MuiDataGrid-columnHeader:not(:hover) .MuiDataGrid-sortIcon': {
                visibility: 'visible !important',
                opacity: '1 !important',
                display: 'flex !important',
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TestCasesGrid; 