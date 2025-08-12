import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Folder as FolderIcon, Edit, Eye, Copy, Trash2, ListChecks } from 'lucide-react';
import { folderService } from '../../services/folderService';
import { testCaseService } from '../../services/testCaseService';
import { testTypeService } from '../../services/testTypeService';
import { resolveUserName } from '../../utils/textUtils';
import ColoredIcon from './ColoredIcon';
import TagPills from '../TagPills';

export default function TestCasesListView({
  organizationId,
  projects = [],
  selectedProjectId = null,
  refreshKey = 0,
  searchTerm = '',
  filterStatus = 'all',
  filterPriority = 'all',
  filterTestType = 'all',
  selectedTagIds = [],
  resolveTags,
  onViewTestCase,
  onEditTestCase,
  onDuplicateTestCase,
  onDeleteTestCase,
  organizationUsers = [],
}) {
  const [expanded, setExpanded] = useState(new Set());
  const [projectChildren, setProjectChildren] = useState(new Map()); // projectId -> root nodes
  const [folderChildren, setFolderChildren] = useState(new Map()); // key: `${projectId}:${folderId}` -> nodes
  const [busy, setBusy] = useState(false);
  
  // util to strip HTML for previews/search
  function stripHtml(html) {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
  const [orgTypes, setOrgTypes] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set()); // tc.id -> expanded description

  const nodeKey = (projectId, folderId) => `${projectId || 'all'}:${folderId || 'root'}`;

  const passesFilters = (tc) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const resolvedAuthor = resolveUserName(tc.author, organizationUsers);
      const text = `${tc.tcid} ${tc.name} ${stripHtml(tc.description || '')} ${resolvedAuthor}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    if (filterStatus !== 'all' && (tc.overallResult || 'Not Run') !== filterStatus) return false;
    if (filterPriority !== 'all' && (tc.priority || 'Medium') !== filterPriority) return false;
    if (filterTestType !== 'all') {
      const typeName = tc.testType || tc.testTypeCode || '';
      if (typeName !== filterTestType) return false;
    }
    if (Array.isArray(selectedTagIds) && selectedTagIds.length > 0) {
      const set = new Set(selectedTagIds);
      if (!Array.isArray(tc.tags) || !tc.tags.some((id) => set.has(id))) return false;
    }
    return true;
  };

  const loadRootForProject = async (projectId) => {
    const [folders, testCases] = await Promise.all([
      folderService.listChildren(organizationId, projectId, null),
      testCaseService.listTestCasesByFolder(organizationId, projectId, null),
    ]);
    const nodes = [
      ...folders.map((f) => ({ type: 'folder', id: f.id, name: f.name, raw: f })),
      ...testCases.map((t) => ({ type: 'tc', id: t.id, raw: t })),
    ];
    setProjectChildren((prev) => {
      const m = new Map(prev);
      m.set(projectId, nodes);
      return m;
    });
  };

  const loadChildrenForFolder = async (projectId, folderId) => {
    const [folders, testCases] = await Promise.all([
      folderService.listChildren(organizationId, projectId, folderId),
      testCaseService.listTestCasesByFolder(organizationId, projectId, folderId),
    ]);
    const nodes = [
      ...folders.map((f) => ({ type: 'folder', id: f.id, name: f.name, raw: f })),
      ...testCases.map((t) => ({ type: 'tc', id: t.id, raw: t })),
    ];
    setFolderChildren((prev) => {
      const m = new Map(prev);
      m.set(nodeKey(projectId, folderId), nodes);
      return m;
    });
  };

  useEffect(() => {
    setExpanded(new Set());
    setProjectChildren(new Map());
    setFolderChildren(new Map());
  }, [organizationId, selectedProjectId]);

  // Load organization test types for icons/names
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!organizationId) return;
      try {
        const list = await testTypeService.getResolvedOrgTestTypes(organizationId);
        if (!cancelled) setOrgTypes(list || []);
      } catch (e) {
        if (!cancelled) setOrgTypes([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const findType = (tc) => {
    const code = tc?.testTypeCode || tc?.testType || '';
    return orgTypes.find((t) => t.id === code) || null;
  };

  const toggleRowExpand = (id) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedRows(next);
  };

  const priorityPill = (p) => {
    switch (p) {
      case 'High':
        return 'border text-red-800 bg-red-100 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30';
      case 'Medium':
        return 'border text-blue-800 bg-blue-100 border-blue-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-900/30';
      case 'Low':
        return 'border text-green-800 bg-green-100 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30';
      default:
        return 'border text-gray-800 bg-gray-100 border-gray-200 dark:bg-white/10 dark:text-menu dark:border-white/10';
    }
  };

  // Deterministic mock run history of last 20 runs with seeded PRNG
  const mockRunHistory = (tc) => {
    const seedStr = String(tc?.id || tc?.tcid || 'tc');
    // Simple string hash -> 32-bit seed
    let h = 1779033703 ^ seedStr.length;
    for (let i = 0; i < seedStr.length; i += 1) {
      h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    // Mulberry32
    let t = h >>> 0;
    const rand = () => {
      t += 0x6D2B79F5;
      let r = t;
      r = Math.imul(r ^ (r >>> 15), r | 1);
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
    // Randomise number of visible runs per test (min 4, max 20)
    const length = 4 + Math.floor(rand() * 17); // 4..20
    const out = [];
    for (let i = 0; i < length; i += 1) {
      const r = rand();
      // Skew to look realistic: mostly pass, occasional none/fail
      if (r < 0.62) out.push('pass');
      else if (r < 0.82) out.push('none');
      else out.push('fail');
    }
    return out;
  };

  const RunHistoryViz = ({ history = [] }) => {
    const items = history.slice(-20);
    const barH = 12; // px (h-3)
    const topGreen = `calc(50% - ${barH * 0.75}px)`; // 75% above axis
    const topRed = `calc(50% - ${barH * 0.25}px)`; // 75% below axis
    return (
      <div
        className="relative h-4 flex items-stretch gap-1 select-none"
        aria-label="Run history (latest at right)"
        title="Run History: Latest Run at Right"
      >
        <div className="absolute left-0 right-0 top-1/2 h-px bg-white/40" />
        {items.map((s, i) => (
          <div key={i} className="relative w-1.5 h-4">
            {s === 'pass' && (
              <span
                className="absolute left-1/2 -translate-x-1/2 w-1.5 rounded bg-emerald-500"
                style={{ top: topGreen, height: `${barH}px` }}
              />
            )}
            {s === 'fail' && (
              <span
                className="absolute left-1/2 -translate-x-1/2 w-1.5 rounded bg-red-500"
                style={{ top: topRed, height: `${barH}px` }}
              />
            )}
            {s === 'none' && (
              <span
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/60"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const toggleProject = async (projectId) => {
    const next = new Set(expanded);
    const id = `project:${projectId}`;
    if (next.has(id)) {
      next.delete(id);
      setExpanded(next);
      return;
    }
    next.add(id);
    setExpanded(next);
    if (!projectChildren.has(projectId)) {
      setBusy(true);
      try { await loadRootForProject(projectId); } finally { setBusy(false); }
    }
  };

  const toggleFolder = async (projectId, folder) => {
    const next = new Set(expanded);
    const id = `folder:${projectId}:${folder.id}`;
    if (next.has(id)) {
      next.delete(id);
      setExpanded(next);
      return;
    }
    next.add(id);
    setExpanded(next);
    const key = nodeKey(projectId, folder.id);
    if (!folderChildren.has(key)) {
      setBusy(true);
      try { await loadChildrenForFolder(projectId, folder.id); } finally { setBusy(false); }
    }
  };

  const renderTestCaseRow = (tc) => {
    const type = findType(tc);
    const expanded = expandedRows.has(tc.id);
    const tagsResolved = typeof resolveTags === 'function' ? resolveTags(tc.tags) : [];
    const stepsCount = Array.isArray(tc.testSteps) ? tc.testSteps.length : 0;
    const history = mockRunHistory(tc);

    return (
      <div
        key={tc.id}
        className="p-3 bg-card border border-subtle rounded-lg hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Left: TCID with test type icon */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {type?.icon?.url ? (
                <ColoredIcon icon={type.icon} size={16} />
              ) : (
                <span className="w-4 h-4 rounded-sm bg-[rgb(var(--tc-icon))]/30 inline-block" />
              )}
              <span className="font-medium text-foreground">{tc.tcid}</span>
            </div>

            {/* Center: name, test type, meta, optional description */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground truncate" title={tc.name}>{tc.name}</h4>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-menu">
                {type?.icon?.url && <ColoredIcon icon={type.icon} size={14} />}
                <span className="truncate">{type?.name || tc.testType || tc.testTypeCode || '—'}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${priorityPill(tc.priority)}`}>{tc.priority || '—'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-menu">{stepsCount} steps</span>
                <TagPills tags={tagsResolved} size="sm" />
              </div>
              {expanded && (
                <div className="mt-2 text-sm text-muted whitespace-pre-wrap">{stripHtml(tc.description || '') || '—'}</div>
              )}
            </div>
          </div>

          {/* Right: run history and actions */}
          <div className="flex items-center gap-3">
            <RunHistoryViz history={history} />
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleRowExpand(tc.id)}
                className="p-1 hover:bg-white/10 rounded text-menu hover:text-foreground"
                title={expanded ? 'Hide description' : 'Show description'}
              >
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
              <button onClick={() => onViewTestCase?.(tc)} className="p-1 hover:bg-white/10 rounded text-menu hover:text-foreground" title="View">
                <Eye className="h-4 w-4" />
              </button>
              <button onClick={() => onEditTestCase?.(tc)} className="p-1 hover:bg-white/10 rounded text-menu hover:text-foreground" title="Edit">
                <Edit className="h-4 w-4" />
              </button>
              <button onClick={() => onDuplicateTestCase?.(tc)} className="p-1 hover:bg-white/10 rounded text-menu hover:text-foreground" title="Duplicate">
                <Copy className="h-4 w-4" />
              </button>
              <button onClick={() => onDeleteTestCase?.(tc)} className="p-1 hover:bg-white/10 rounded text-menu hover:text-red-400" title="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFolderBlock = (projectId, folder) => {
    const id = `folder:${projectId}:${folder.id}`;
    const isOpen = expanded.has(id);
    const key = nodeKey(projectId, folder.id);
    let children = folderChildren.get(key) || [];
    if (children.length > 0) {
      children = children.filter((n) => n.type === 'folder' || passesFilters(n.raw));
    }
    return (
      <div key={id} className="mb-1">
        <div className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors border border-subtle`}
             onClick={() => toggleFolder(projectId, folder)}>
          <button className="p-1 hover:bg-white/10 rounded text-menu hover:text-foreground">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <div className="flex items-center gap-2 flex-1">
            <FolderIcon className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-foreground">{folder.name}</span>
          </div>
        </div>
        {isOpen && children.length > 0 && (
          <div className="ml-6 border-l border-subtle pl-4">
            {children.map((child) => child.type === 'folder'
              ? renderFolderBlock(projectId, child.raw)
              : renderTestCaseRow(child.raw))}
          </div>
        )}
      </div>
    );
  };

  const renderProjectBlock = (project) => {
    const pid = project.id || project.projectId;
    const id = `project:${pid}`;
    const isOpen = expanded.has(id);
    const nodes = projectChildren.get(pid) || [];
    const filtered = nodes.filter((n) => n.type === 'folder' || passesFilters(n.raw));
    return (
      <div key={id} className="mb-4">
        <div className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors border border-subtle`}
             onClick={() => toggleProject(pid)}>
          <button className="p-1 hover:bg-white/10 rounded text-menu hover:text-foreground">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <div className="flex items-center gap-2 flex-1">
            <ListChecks className="h-5 w-5 text-green-600" />
            <span className="font-medium text-foreground">{project.name || project.projectName || pid}</span>
          </div>
        </div>
        {isOpen && (
          <div className="ml-6 border-l border-subtle pl-4">
            {filtered.length === 0 && (
              <div className="text-sm text-menu py-2">No matching items.</div>
            )}
            {filtered.map((n) => n.type === 'folder' ? renderFolderBlock(pid, n.raw) : renderTestCaseRow(n.raw))}
          </div>
        )}
      </div>
    );
  };

  // If a specific project is selected, show only that; else show all projects collapsed by default
  const effectiveProjects = selectedProjectId
    ? projects.filter((p) => (p.id || p.projectId) === selectedProjectId)
    : projects;

  // When refreshKey changes, reload visible project/folder nodes
  useEffect(() => {
    (async () => {
      if (!selectedProjectId) return;
      // Reload root nodes for selected project
      await loadRootForProject(selectedProjectId);
      // Reload any expanded folders within selected project
      const expandedForProject = Array.from(expanded).filter(id => id.startsWith(`folder:${selectedProjectId}:`));
      for (const id of expandedForProject) {
        const folderId = id.split(':')[2];
        await loadChildrenForFolder(selectedProjectId, folderId);
      }
    })();
  }, [refreshKey]);

  return (
    <div className="p-6">
      {busy && <div className="text-xs text-menu mb-2">Loading…</div>}
      {effectiveProjects.length === 0 ? (
        <div className="text-menu">No projects to display.</div>
      ) : (
        <div className="space-y-2">
          {effectiveProjects.map((p) => renderProjectBlock(p))}
        </div>
      )}
    </div>
  );
}


