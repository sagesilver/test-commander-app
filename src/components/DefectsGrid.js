import React, { useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { 
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Circle,
  User,
  Clock,
  MessageSquare,
  Paperclip,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

const DefectsGrid = ({ defects, onViewDefect, onEditDefect, onDeleteDefect }) => {
  
  // Transform defects data for the grid
  const gridData = useMemo(() => {
    return defects.map((defect) => ({
      id: defect.id,
      title: defect.title,
      description: defect.description,
      status: defect.status,
      severity: defect.severity,
      priority: defect.priority,
      reporter: defect.reporter,
      assignedTo: defect.assignedTo,
      project: defect.project,
      module: defect.module,
      createdDate: defect.createdDate,
      updatedDate: defect.updatedDate,
      attachments: defect.attachments,
      comments: defect.comments,
      environment: defect.environment,
      browser: defect.browser,
      os: defect.os,
      // Store original data for actions
      originalData: defect
    }));
  }, [defects]);

  // Column definitions for MUI DataGrid
  const columns = [
    {
      field: 'id',
      headerName: 'Defect ID',
      width: 150,
      renderCell: (params) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 text-white">
          {params.value}
        </span>
      )
    },
    {
      field: 'title',
      headerName: 'Title',
      width: 350,
      renderCell: (params) => (
        <div className="font-medium text-gray-900 truncate w-full" title={params.value}>
          {params.value}
        </div>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => {
        const config = {
          'Open': {
            bg: 'bg-gradient-to-r from-red-500 to-red-600',
            text: 'text-white',
            icon: '●'
          },
          'In Progress': {
            bg: 'bg-gradient-to-r from-amber-500 to-amber-600',
            text: 'text-white',
            icon: '⟳'
          },
          'Resolved': {
            bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
            text: 'text-white',
            icon: '✓'
          },
          'Closed': {
            bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
            text: 'text-white',
            icon: '✗'
          },
          'On Hold': {
            bg: 'bg-gradient-to-r from-purple-500 to-purple-600',
            text: 'text-white',
            icon: '⏸'
          }
        };
        const style = config[params.value] || config['Open'];
        
        return (
          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
            <span className="text-sm">{style.icon}</span>
            <span>{params.value}</span>
          </span>
        );
      }
    },
    {
      field: 'severity',
      headerName: 'Severity',
      width: 120,
      renderCell: (params) => {
        const config = {
          'Critical': { 
            icon: <AlertTriangle className="w-3 h-3 text-white" />,
            bg: 'bg-gradient-to-r from-red-600 to-red-700',
            text: 'text-white'
          },
          'High': { 
            icon: <ArrowUp className="w-3 h-3 text-white" />,
            bg: 'bg-gradient-to-r from-red-500 to-red-600',
            text: 'text-white'
          },
          'Medium': { 
            icon: <Circle className="w-3 h-3 text-white" />,
            bg: 'bg-gradient-to-r from-amber-500 to-amber-600',
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
      field: 'priority',
      headerName: 'Priority',
      width: 120,
      renderCell: (params) => {
        const config = {
          'Critical': { 
            icon: <AlertTriangle className="w-3 h-3 text-white" />,
            bg: 'bg-gradient-to-r from-red-600 to-red-700',
            text: 'text-white'
          },
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
      field: 'assignedTo',
      headerName: 'Assigned To',
      width: 180,
      renderCell: (params) => {
        const colors = [
          'from-purple-500 to-pink-500',
          'from-blue-500 to-cyan-500', 
          'from-green-500 to-emerald-500',
          'from-orange-500 to-red-500',
          'from-indigo-500 to-purple-500'
        ];
        const assigneeInitials = params.value?.split(' ').map(n => n[0]).join('').toUpperCase() || 'UN';
        const colorIndex = (params.value?.length || 0) % colors.length;
        
        return (
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 bg-gradient-to-br ${colors[colorIndex]} rounded-full flex items-center justify-center`}>
              <span className="text-white text-xs font-bold">{assigneeInitials}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{params.value || 'Unassigned'}</span>
          </div>
        );
      }
    },
    {
      field: 'project',
      headerName: 'Project',
      width: 160,
      renderCell: (params) => (
        <span className="text-sm text-gray-700">{params.value}</span>
      )
    },
    {
      field: 'module',
      headerName: 'Module',
      width: 140,
      renderCell: (params) => (
        <span className="text-sm text-gray-700">{params.value}</span>
      )
    },
    {
      field: 'updatedDate',
      headerName: 'Updated',
      width: 120,
      renderCell: (params) => (
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-gray-500" />
          <span className="text-sm text-gray-600">{params.value}</span>
        </div>
      )
    },
    {
      field: 'comments',
      headerName: 'Comments',
      width: 100,
      renderCell: (params) => (
        <div className="flex items-center space-x-1">
          <MessageSquare className="w-3 h-3 text-gray-500" />
          <span className="text-sm text-gray-600">{params.value}</span>
        </div>
      )
    },
    {
      field: 'attachments',
      headerName: 'Files',
      width: 80,
      renderCell: (params) => (
        params.value > 0 ? (
          <div className="flex items-center space-x-1">
            <Paperclip className="w-3 h-3 text-gray-500" />
            <span className="text-sm text-gray-600">{params.value}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDefect(params.row.originalData);
            }}
            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="View Defect"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditDefect(params.row.originalData);
            }}
            className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Edit Defect"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteDefect(params.row.originalData);
            }}
            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete Defect"
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
            <h3 className="text-lg font-semibold text-gray-900">Defects</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
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

export default DefectsGrid;