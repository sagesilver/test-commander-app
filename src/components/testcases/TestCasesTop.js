import React from 'react';
import { Grid, Folder as FolderIcon, Plus, Search } from 'lucide-react';
import ExportMenu from '../ExportMenu';
import ImportButton from '../ImportButton';
import ImportTargetModal from './ImportTargetModal';
 

export default function TestCasesTop({
  title = 'Test Cases',
  projects = [],
  selectedProjectId = '',
  onChangeProject,
  onClickNew,
  newDisabled = false,
  exportData = [],
  exportFilename = 'test-cases-export',
  searchTerm = '',
  setSearchTerm,
  filterStatus = 'all',
  setFilterStatus,
  filterTestType = 'all',
  setFilterTestType,
  filterPriority = 'all',
  setFilterPriority,
  
  orgTypes = [],
  onGrid,
  onFolder,
  onImportParsed,
  onOpenTargetModal,
}) {
  return (
    <>
      {/* Header row */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            <p className="mt-2 text-muted">Manage and organize your test cases</p>
          </div>
          <div className="flex items-center gap-3">
            <ImportButton onParsed={onImportParsed} onOpenTargetModal={onOpenTargetModal} />
            <ExportMenu data={exportData} filename={exportFilename} onExport={() => {}} />
            <button
              onClick={onClickNew}
              disabled={newDisabled}
              className="btn-primary text-sm flex items-center gap-2 whitespace-nowrap disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              <span>New Test Case</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow-card border border-subtle p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-menu" />
            <input
              type="text"
              placeholder="Search test cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm?.(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Move project selector here: to the right of Search and left of Status */}
          <select
            value={selectedProjectId || ''}
            onChange={(e) => onChangeProject?.(e.target.value || null)}
            className="input-field"
          >
            <option value="">{projects.length === 0 ? 'No projects' : 'All Projects'}</option>
            {projects.map(p => (
              <option key={p.id || p.projectId} value={p.id || p.projectId}>{p.name || p.projectName}</option>
            ))}
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus?.(e.target.value)} className="input-field">
            <option value="all">All Statuses</option>
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
            <option value="Blocked">Blocked</option>
            <option value="Not Run">Not Run</option>
          </select>

          <select value={filterTestType} onChange={(e) => setFilterTestType?.(e.target.value)} className="input-field">
            <option value="all">All Test Types</option>
            {orgTypes.map(type => (
              <option key={type.id} value={type.name}>{type.name}</option>
            ))}
          </select>

          <select value={filterPriority} onChange={(e) => setFilterPriority?.(e.target.value)} className="input-field">
            <option value="all">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        
      </div>

      {/* View toggles */}
      <div className="flex items-center justify-end mb-4">
        <div className="flex bg-surface-muted rounded-lg p-1 border border-subtle">
          <button onClick={onGrid} className="p-2 rounded-md transition-colors text-menu hover:text-white" title="Grid View" data-testid="tc-top-grid">
            <Grid className="w-4 h-4" />
          </button>
          <button onClick={onFolder} className="p-2 rounded-md transition-colors text-menu hover:text-white" title="Folder View" data-testid="tc-top-folder">
            <FolderIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}


