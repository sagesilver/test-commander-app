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
    return defects.map((defect) => {
      return ({
        id: defect.id,
        key: defect.key,
        title: defect.title,
        description: defect.description,
        status: defect.status,
        severity: defect.severity,
        priority: defect.priority,
        raisedBy: defect.raisedByName || defect.raisedBy || defect.reporterId || defect.reporter || 'Unknown',
        assignedTo: defect.assignedToName || defect.assignedTo || 'Unassigned',
        project: defect.projectName || defect.projectId,
        module: defect.folderId,
        createdDate: defect.createdAt,
        updatedDate: defect.updatedAt,
        attachments: defect.attachmentCount || 0,
        comments: defect.commentCount || 0,
        environment: defect.environment,
        browser: defect.browser,
        os: defect.operatingSystem,
        // Store original data for actions
        originalData: defect
      });
    });
  }, [defects]);

  // Column definitions matching TestCasesGrid look & feel
  const columns = [
    {
      id: 'key',
      header: 'Defect ID',
      accessorKey: 'key',
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
          'open': {
            classes: 'bg-red-900/20 text-red-400',
            icon: '○',
            label: 'Open'
          },
          'in_progress': {
            classes: 'bg-amber-900/20 text-amber-300',
            icon: '⟳',
            label: 'In Progress'
          },
          'in_review': {
            classes: 'bg-blue-900/20 text-blue-300',
            icon: '👁',
            label: 'In Review'
          },
          'blocked': {
            classes: 'bg-purple-900/20 text-purple-300',
            icon: '🚫',
            label: 'Blocked'
          },
          'resolved': {
            classes: 'bg-green-900/20 text-green-400',
            icon: '✓',
            label: 'Resolved'
          },
          'verified': {
            classes: 'bg-emerald-900/20 text-emerald-400',
            icon: '✅',
            label: 'Verified'
          },
          'closed': {
            classes: 'bg-white/5 text-menu',
            icon: '✗',
            label: 'Closed'
          },
          'archived': {
            classes: 'bg-gray-900/20 text-gray-400',
            icon: '📁',
            label: 'Archived'
          }
        };
        const value = getValue();
        const style = config[value] || config['open'];
        
        return (
          <span className={`inline-flex items-center h-7 space-x-1 px-2 rounded-full text-sm font-medium ${style.classes}`}>
            <span className="text-sm">{style.icon}</span>
            <span>{style.label}</span>
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
          'critical': { icon: <AlertTriangle className="w-3 h-3 text-red-400" />, classes: 'bg-red-900/20 text-red-400', label: 'Critical' },
          'high': { icon: <ArrowUp className="w-3 h-3 text-red-400" />, classes: 'bg-red-900/20 text-red-400', label: 'High' },
          'medium': { icon: <Circle className="w-3 h-3 text-orange-300" />, classes: 'bg-orange-900/20 text-orange-300', label: 'Medium' },
          'low': { icon: <ArrowDown className="w-3 h-3 text-green-400" />, classes: 'bg-green-900/20 text-green-400', label: 'Low' },
          'trivial': { icon: <Circle className="w-3 h-3 text-gray-400" />, classes: 'bg-gray-900/20 text-gray-400', label: 'Trivial' },
        };
        const value = getValue();
        const style = config[value] || config['medium'];
        return (
          <div className={`h-full flex items-center`}>
            <div className={`inline-flex items-center h-7 space-x-1 px-2 rounded-full text-sm font-medium ${style.classes}`}>
              {style.icon}
              <span>{style.label}</span>
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
          'p0': { icon: <AlertTriangle className="w-3 h-3 text-red-400" />, classes: 'bg-red-900/20 text-red-400', label: 'P0' },
          'p1': { icon: <ArrowUp className="w-3 h-3 text-red-400" />, classes: 'bg-red-900/20 text-red-400', label: 'P1' },
          'p2': { icon: <Circle className="w-3 h-3 text-orange-300" />, classes: 'bg-orange-900/20 text-orange-300', label: 'P2' },
          'p3': { icon: <ArrowDown className="w-3 h-3 text-green-400" />, classes: 'bg-green-900/20 text-green-400', label: 'P3' },
        };
        const value = getValue();
        const style = config[value] || config['p2'];
        
        return (
          <div className={`h-full flex items-center`}>
            <div className={`inline-flex items-center h-7 space-x-1 px-2 rounded-full text-sm font-medium ${style.classes}`}>
              {style.icon}
              <span>{style.label}</span>
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
    {
      id: 'raisedBy',
      header: 'Raised By',
      accessorKey: 'raisedBy',
      size: 180,
      cell: ({ getValue }) => {
        const colors = [
          'from-green-600 to-emerald-500',
          'from-blue-600 to-cyan-500',
          'from-violet-600 to-fuchsia-500',
          'from-orange-600 to-red-500',
          'from-indigo-600 to-purple-500',
        ];
        const value = getValue();
        const userInitials = value?.split(' ').map(n => n[0]).join('').toUpperCase() || 'UN';
        const colorIndex = (value?.length || 0) % colors.length;
        
        return (
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 bg-gradient-to-br ${colors[colorIndex]} rounded-full flex items-center justify-center`}>
              <span className="text-white text-xs font-bold">{userInitials}</span>
            </div>
            <span className="text-sm font-medium text-foreground">{value || 'Unknown'}</span>
          </div>
        );
      },
      filterType: 'text',
    },
    { 
      id: 'project', 
      header: 'Project', 
      accessorKey: 'project', 
      size: 160, 
      cell: ({ getValue, row }) => {
        const projectId = getValue();
        const projectName = row.original.originalData.projectName || projectId;
        return <span className="text-sm text-foreground">{projectName || 'Unknown Project'}</span>;
      }, 
      filterType: 'text' 
    },
    {
      id: 'module', header: 'Module', accessorKey: 'module', size: 140, cell: ({ getValue }) => (<span className="text-sm text-foreground">{getValue()}</span>), filterType: 'text'
    },
         {
       id: 'updatedDate',
       header: 'Updated',
       accessorKey: 'updatedDate',
       size: 120,
       cell: ({ getValue }) => {
         const timestamp = getValue();
         let displayDate = 'Unknown';
         
         if (timestamp) {
           if (timestamp && typeof timestamp.toDate === 'function') {
             // Firestore timestamp
             displayDate = timestamp.toDate().toLocaleDateString();
           } else if (timestamp instanceof Date) {
             displayDate = timestamp.toLocaleDateString();
           } else if (typeof timestamp === 'string') {
             displayDate = new Date(timestamp).toLocaleDateString();
           } else if (timestamp && timestamp.seconds) {
             // Firestore timestamp object
             displayDate = new Date(timestamp.seconds * 1000).toLocaleDateString();
           }
         }
         
         return (
           <div className="flex items-center space-x-1">
             <Clock className="w-3 h-3 text-menu" />
             <span className="text-sm text-menu">{displayDate}</span>
           </div>
         );
       },
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