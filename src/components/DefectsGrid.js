import React, { useMemo } from 'react';
import DataTable from './table/DataTable';
import { 
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Circle,
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

  // Column definitions matching TestCasesGrid look & feel
  const columns = [
    {
      id: 'id',
      header: 'Defect ID',
      accessorKey: 'id',
      size: 150,
      cell: ({ getValue }) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-[rgb(var(--tc-icon))]/20 text-[rgb(var(--tc-contrast))]">{getValue()}</span>
      ),
      filterType: 'text',
    },
    {
      id: 'title',
      header: 'Title',
      accessorKey: 'title',
      size: 350,
      cell: ({ getValue }) => (
        <div className="font-medium text-foreground truncate max-w-[340px]" title={getValue()}>{getValue()}</div>
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
            classes: 'bg-red-900/20 text-red-400',
            icon: '○'
          },
          'In Progress': {
            classes: 'bg-amber-900/20 text-amber-300',
            icon: '⟳'
          },
          'Resolved': {
            classes: 'bg-green-900/20 text-green-400',
            icon: '✓'
          },
          'Closed': {
            classes: 'bg-white/5 text-menu',
            icon: '✗'
          },
          'On Hold': {
            classes: 'bg-purple-900/20 text-purple-300',
            icon: '⏸'
          }
        };
        const value = getValue();
        const style = config[value] || config['Open'];
        
        return (
          <span className={`inline-flex items-center h-7 space-x-1 px-2 rounded-full text-sm font-medium ${style.classes}`}>
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
      cell: ({ getValue }) => {
        const config = {
          'Critical': { icon: <AlertTriangle className="w-3 h-3 text-red-400" />, classes: 'bg-red-900/20 text-red-400' },
          'High': { icon: <ArrowUp className="w-3 h-3 text-red-400" />, classes: 'bg-red-900/20 text-red-400' },
          'Medium': { icon: <Circle className="w-3 h-3 text-orange-300" />, classes: 'bg-orange-900/20 text-orange-300' },
          'Low': { icon: <ArrowDown className="w-3 h-3 text-green-400" />, classes: 'bg-green-900/20 text-green-400' },
        };
        const value = getValue();
        const style = config[value] || config['Medium'];
        return (
          <div className={`h-full flex items-center`}>
            <div className={`inline-flex items-center h-7 space-x-1 px-2 rounded-full text-sm font-medium ${style.classes}`}>
              {style.icon}
              <span>{value || 'Medium'}</span>
            </div>
          </div>
        );
      },
      filterType: 'select',
    },
    {
      id: 'priority',
      header: 'Priority',
      accessorKey: 'priority',
      size: 120,
      cell: ({ getValue }) => {
        const config = {
          'Critical': { icon: <AlertTriangle className="w-3 h-3 text-red-400" />, classes: 'bg-red-900/20 text-red-400' },
          'High': { icon: <ArrowUp className="w-3 h-3 text-red-400" />, classes: 'bg-red-900/20 text-red-400' },
          'Medium': { icon: <Circle className="w-3 h-3 text-orange-300" />, classes: 'bg-orange-900/20 text-orange-300' },
          'Low': { icon: <ArrowDown className="w-3 h-3 text-green-400" />, classes: 'bg-green-900/20 text-green-400' },
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
      filterType: 'select',
    },
    {
      id: 'assignedTo',
      header: 'Assigned To',
      accessorKey: 'assignedTo',
      size: 180,
      cell: ({ getValue }) => {
        const colors = [
          'from-blue-600 to-cyan-500',
          'from-violet-600 to-fuchsia-500',
          'from-emerald-600 to-green-500',
          'from-orange-600 to-red-500',
          'from-indigo-600 to-purple-500',
        ];
        const value = getValue();
        const assigneeInitials = value?.split(' ').map(n => n[0]).join('').toUpperCase() || 'UN';
        const colorIndex = (value?.length || 0) % colors.length;
        
        return (
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 bg-gradient-to-br ${colors[colorIndex]} rounded-full flex items-center justify-center`}>
              <span className="text-white text-xs font-bold">{assigneeInitials}</span>
            </div>
            <span className="text-sm font-medium text-foreground">{value || 'Unassigned'}</span>
          </div>
        );
      },
      filterType: 'text',
    },
    { id: 'project', header: 'Project', accessorKey: 'project', size: 160, cell: ({ getValue }) => (<span className="text-sm text-foreground">{getValue()}</span>), filterType: 'text' },
    {
      id: 'module', header: 'Module', accessorKey: 'module', size: 140, cell: ({ getValue }) => (<span className="text-sm text-foreground">{getValue()}</span>), filterType: 'text'
    },
    {
      id: 'updatedDate',
      header: 'Updated',
      accessorKey: 'updatedDate',
      size: 120,
      cell: ({ getValue }) => (
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-menu" />
          <span className="text-sm text-menu">{getValue()}</span>
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
          <MessageSquare className="w-3 h-3 text-menu" />
          <span className="text-sm text-menu">{getValue()}</span>
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
            <Paperclip className="w-3 h-3 text-menu" />
            <span className="text-sm text-menu">{getValue()}</span>
          </div>
        ) : (
          <span className="text-sm text-menu">—</span>
        )
      ),
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
            onClick={(e) => {
              e.stopPropagation();
              onViewDefect(row.original.originalData);
            }}
            className="p-1.5 text-menu hover:text-white hover:bg-white/10 rounded transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditDefect(row.original.originalData);
            }}
            className="p-1.5 text-menu hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Edit Defect"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteDefect(row.original.originalData);
            }}
            className="p-1.5 text-menu hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
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
      <div className="bg-card rounded-lg shadow-lg border border-subtle">
        <div className="flex items-center justify-between p-4 bg-surface-muted border-b border-subtle">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-foreground">Defects</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[rgb(var(--tc-icon))]/20 text-[rgb(var(--tc-contrast))]">
              {gridData.length} total
            </span>
          </div>
          <div />
        </div>
        
        <div className="w-full">
          <DataTable
            data={gridData}
            columns={columns}
            defaultPageSize={20}
            pageSizeOptions={[10, 20, 50]}
            emptyMessage="No defects"
            className="text-foreground"
          />
        </div>
      </div>
    </div>
  );
};

export default DefectsGrid;