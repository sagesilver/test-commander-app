import React, { useMemo } from 'react';
import DataTable from './table/DataTable';
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

  // Column definitions for headless table
  const columns = [
    {
      id: 'id',
      header: 'Defect ID',
      accessorKey: 'id',
      size: 150,
      cell: ({ getValue }) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 text-white">{getValue()}</span>
      ),
      filterType: 'text',
    },
    {
      id: 'title',
      header: 'Title',
      accessorKey: 'title',
      size: 350,
      cell: ({ getValue }) => (
        <div className="font-medium text-gray-900 truncate w-full" title={getValue()}>{getValue()}</div>
      ),
      filterType: 'text',
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      size: 130,
      cell: ({ getValue }) => {
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
        const value = getValue();
        const style = config[value] || config['Open'];
        
        return (
          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
            <span className="text-sm">{style.icon}</span>
            <span>{value}</span>
          </span>
        );
      },
      filterType: 'select',
    },
    {
      id: 'severity',
      header: 'Severity',
      accessorKey: 'severity',
      size: 120,
      cell: () => {
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
        const style = config['Medium'];
        
        return (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
            {style.icon}
            <span>Medium</span>
          </div>
        );
      },
    },
    {
      id: 'priority',
      header: 'Priority',
      accessorKey: 'priority',
      size: 120,
      cell: ({ getValue }) => {
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
        const value = getValue();
        const style = config[value] || config['Medium'];
        
        return (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
            {style.icon}
            <span>{value}</span>
          </div>
        );
      },
      filterType: 'select',
    },
    {
      id: 'assignedTo',
      header: 'Assigned To',
      accessorKey: 'assignedTo',
      size: 180,
      cell: ({ getValue }) => {
        const colors = [
          'from-purple-500 to-pink-500',
          'from-blue-500 to-cyan-500', 
          'from-green-500 to-emerald-500',
          'from-orange-500 to-red-500',
          'from-indigo-500 to-purple-500'
        ];
        const value = getValue();
        const assigneeInitials = value?.split(' ').map(n => n[0]).join('').toUpperCase() || 'UN';
        const colorIndex = (value?.length || 0) % colors.length;
        
        return (
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 bg-gradient-to-br ${colors[colorIndex]} rounded-full flex items-center justify-center`}>
              <span className="text-white text-xs font-bold">{assigneeInitials}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{value || 'Unassigned'}</span>
          </div>
        );
      },
      filterType: 'text',
    },
    { id: 'project', header: 'Project', accessorKey: 'project', size: 160, cell: ({ getValue }) => (<span className="text-sm text-gray-700">{getValue()}</span>), filterType: 'text' },
    {
      id: 'module', header: 'Module', accessorKey: 'module', size: 140, cell: ({ getValue }) => (<span className="text-sm text-gray-700">{getValue()}</span>), filterType: 'text'
    },
    {
      id: 'updatedDate',
      header: 'Updated',
      accessorKey: 'updatedDate',
      size: 120,
      cell: ({ getValue }) => (
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-gray-500" />
          <span className="text-sm text-gray-600">{getValue()}</span>
        </div>
      ),
      filterType: 'text',
    },
    {
      id: 'comments',
      header: 'Comments',
      accessorKey: 'comments',
      size: 100,
      cell: ({ getValue }) => (
        <div className="flex items-center space-x-1">
          <MessageSquare className="w-3 h-3 text-gray-500" />
          <span className="text-sm text-gray-600">{getValue()}</span>
        </div>
      ),
      filterType: 'text',
    },
    {
      id: 'attachments',
      header: 'Files',
      accessorKey: 'attachments',
      size: 80,
      cell: ({ getValue }) => (
        getValue() > 0 ? (
          <div className="flex items-center space-x-1">
            <Paperclip className="w-3 h-3 text-gray-500" />
            <span className="text-sm text-gray-600">{getValue()}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )
      ),
      filterType: 'text',
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 120,
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDefect(row.original.originalData);
            }}
            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="View Defect"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditDefect(row.original.originalData);
            }}
            className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Edit Defect"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteDefect(row.original.originalData);
            }}
            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete Defect"
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
          <DataTable
            data={gridData}
            columns={columns}
            defaultPageSize={20}
            pageSizeOptions={[10, 20, 50]}
            emptyMessage="No defects"
          />
        </div>
      </div>
    </div>
  );
};

export default DefectsGrid;