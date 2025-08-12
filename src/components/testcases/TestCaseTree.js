import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Folder as FolderIcon, ChevronDown, ChevronRight, ListChecks } from 'lucide-react';
import { folderService } from '../../services/folderService';
import { testCaseService } from '../../services/testCaseService';
import { testTypeService } from '../../services/testTypeService';
import { resolveUserName } from '../../utils/textUtils';

const statusClasses = {
  Passed: 'text-green-400 bg-green-900/20',
  Failed: 'text-red-400 bg-red-900/20',
  'In Progress': 'text-amber-300 bg-amber-900/20',
  'Not Run': 'text-menu bg-white/5',
};

function useOrgTestTypes(organizationId) {
  const [orgTypes, setOrgTypes] = useState([]);
  useEffect(() => {
    let alive = true;
    if (!organizationId) return undefined;
    (async () => {
      const list = await testTypeService.getResolvedOrgTestTypes(organizationId);
      if (alive) setOrgTypes(list || []);
    })();
    return () => { alive = false; };
  }, [organizationId]);
  const mapById = useMemo(() => new Map(orgTypes.map(t => [t.id, t])), [orgTypes]);
  return { orgTypes, mapById };
}

export default function TestCaseTree({
  organizationId,
  projectId,
  selectedFolderId,
  onSelectFolder,
  onSelectTestCase,
  onOpenTestCase,
  refreshKey = 0,
  reloadFolderId = null,
  searchTerm = '',
  filterStatus = 'all',
  filterPriority = 'all',
  filterTestType = 'all',
  selectedTagIds = [],
  organizationUsers = [],
  expandTargetFolderId = null,
  expandRequestKey = 0,
  expandAllKey = 0,
  collapseAllKey = 0,
  inlinePanelOpen = false,
  enableDragDrop = false,
}) {
  const { mapById: testTypeMap } = useOrgTestTypes(organizationId);
  const [rootItems, setRootItems] = useState([]);
  const [expanded, setExpanded] = useState(() => new Set());
  const [childrenMap, setChildrenMap] = useState(() => new Map());
  const [busy, setBusy] = useState(false);
  const clickTimer = useRef(null);

  // Deterministic mock run history of last 10 runs for previewing UI
  const mockRunHistory = (seed) => {
    const seedStr = String(seed || 'tc');
    let h = 1779033703 ^ seedStr.length;
    for (let i = 0; i < seedStr.length; i += 1) {
      // eslint-disable-next-line no-bitwise
      h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
      // eslint-disable-next-line no-bitwise
      h = (h << 13) | (h >>> 19);
    }
    // eslint-disable-next-line no-bitwise
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    // eslint-disable-next-line no-bitwise
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    // eslint-disable-next-line no-bitwise
    h ^= h >>> 16;
    let t = h >>> 0;
    const rand = () => {
      // Mulberry32
      // eslint-disable-next-line no-bitwise
      t += 0x6D2B79F5;
      let r = t;
      // eslint-disable-next-line no-bitwise
      r = Math.imul(r ^ (r >>> 15), r | 1);
      // eslint-disable-next-line no-bitwise
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      // eslint-disable-next-line no-bitwise
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
    const out = [];
    for (let i = 0; i < 10; i += 1) {
      const r = rand();
      if (r < 0.62) out.push('pass');
      else if (r < 0.82) out.push('none');
      else out.push('fail');
    }
    return out;
  };

  const RunHistoryMini = ({ history = [] }) => {
    const items = history.slice(-10);
    const barH = 8; // compact bars to match label height
    const topGreen = `calc(50% - ${barH * 0.75}px)`;
    const topRed = `calc(50% - ${barH * 0.25}px)`;
    return (
      <div className="relative h-4 flex items-center gap-0.5 select-none self-center" aria-label="Last 10 runs (latest at right)">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-white/30" />
        {items.map((s, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={i} className="relative w-1.5 h-4">
            {s === 'pass' && (
              <span className="absolute left-1/2 -translate-x-1/2 w-1.5 rounded bg-emerald-500" style={{ top: topGreen, height: `${barH}px` }} />
            )}
            {s === 'fail' && (
              <span className="absolute left-1/2 -translate-x-1/2 w-1.5 rounded bg-red-500" style={{ top: topRed, height: `${barH}px` }} />
            )}
            {s === 'none' && (
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/60" />
            )}
          </div>
        ))}
      </div>
    );
  };

  // Load root (parentFolderId === null) folders + test cases
  const loadItems = async (parentFolderId) => {
    const [folders, testCases] = await Promise.all([
      folderService.listChildren(organizationId, projectId, parentFolderId || null),
      testCaseService.listTestCasesByFolder(organizationId, projectId, parentFolderId || null),
    ]);
    const folderNodes = folders.map(f => ({
      type: 'folder',
      id: f.id,
      name: f.name,
      parentFolderId: f.parentFolderId || null,
      projectId,
      raw: f,
    }));
    // Business rule: test cases must belong to a folder. Do not surface root-level orphans.
    const tcNodes = (parentFolderId == null ? [] : testCases).map(tc => ({
      type: 'tc',
      id: tc.id,
      tcid: tc.tcid,
      name: tc.name,
      testTypeCode: tc.testTypeCode || tc.testType || '',
      overallResult: tc.overallResult || 'Not Run',
      parentFolderId: tc.folderId || null,
      raw: tc,
    }));
    return [...folderNodes, ...tcNodes];
  };

  useEffect(() => {
    let alive = true;
    if (!organizationId || !projectId) return undefined;
    (async () => {
      setBusy(true);
      try {
        const items = await loadItems(null);
        if (alive) setRootItems(items);
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => { alive = false; };
  }, [organizationId, projectId, refreshKey]);


  // Targeted reload of a specific folder's children when requested by parent
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!organizationId || !projectId) return;
      if (reloadFolderId === null) {
        // reload roots
        const items = await loadItems(null);
        if (!ignore) setRootItems(items);
        return;
      }
      await reloadFolderChildren(reloadFolderId);
    })();
    return () => { ignore = true; };
  }, [reloadFolderId]);

  const ensureLoaded = async (folderId) => {
    if (!childrenMap.has(folderId)) {
      const items = await loadItems(folderId);
      setChildrenMap(prev => {
        const m = new Map(prev);
        m.set(folderId, items);
        return m;
      });
    }
  };

  const toggle = async (folderId) => {
    const isOpen = expanded.has(folderId);
    const next = new Set(expanded);
    if (isOpen) {
      next.delete(folderId);
      setExpanded(next);
      return;
    }
    next.add(folderId);
    setExpanded(next);
    await ensureLoaded(folderId);
  };

  // Reload helpers for post-move updates
  const reloadFolderChildren = async (folderId) => {
    const items = await loadItems(folderId);
    setChildrenMap(prev => {
      const m = new Map(prev);
      m.set(folderId, items);
      return m;
    });
  };
  const reloadRoots = async () => {
    const items = await loadItems(null);
    setRootItems(items);
  };

  const isIllegalFolderMove = async (movingFolderId, targetFolderId) => {
    if (!targetFolderId) return false;
    if (movingFolderId === targetFolderId) return true;
    // Walk up ancestors from target to root
    let cursor = targetFolderId;
    let safety = 0;
    while (cursor && safety < 1000) {
      // eslint-disable-next-line no-await-in-loop
      const f = await folderService.getFolder(organizationId, projectId, cursor);
      if (!f) break;
      if (cursor === movingFolderId) return true;
      cursor = f.parentFolderId || null;
      safety += 1;
    }
    return false;
  };

  const handleDragStart = (ev, payload) => {
    ev.dataTransfer.setData('application/json', JSON.stringify(payload));
    ev.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverFolder = (ev) => {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnFolder = async (ev, targetFolder) => {
    ev.preventDefault();
    const raw = ev.dataTransfer.getData('application/json');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.kind === 'tc') {
      if (data.sourceFolderId === targetFolder.id) return;
      await testCaseService.updateTestCase(organizationId, projectId, data.id, { folderId: targetFolder.id });
      // Refresh source and target
      if (data.sourceFolderId) await reloadFolderChildren(data.sourceFolderId);
      else await reloadRoots();
      await reloadFolderChildren(targetFolder.id);
    } else if (data.kind === 'folder') {
      if (await isIllegalFolderMove(data.id, targetFolder.id)) return;
      await folderService.moveFolder(organizationId, projectId, data.id, targetFolder.id);
      // Refresh both old and new parents
      if (data.sourceParentId) await reloadFolderChildren(data.sourceParentId);
      else await reloadRoots();
      await reloadFolderChildren(targetFolder.id);
    }
  };

  const passesFilters = (tc) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const sanitize = (html) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html || '';
        return (tmp.textContent || tmp.innerText || '').toLowerCase();
      };
      const text = `${tc.tcid} ${tc.name} ${sanitize(tc.description)} ${resolveUserName(tc.author, organizationUsers)}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    if (filterStatus !== 'all' && (tc.overallResult || 'Not Run') !== filterStatus) return false;
    if (filterPriority !== 'all' && (tc.priority || 'Medium') !== filterPriority) return false;
    if (filterTestType !== 'all') {
      const typeName = testTypeMap.get(tc.testTypeCode || tc.testType)?.name || tc.testType || tc.testTypeCode || '';
      if (typeName !== filterTestType) return false;
    }
    if (Array.isArray(selectedTagIds) && selectedTagIds.length > 0) {
      const set = new Set(selectedTagIds);
      if (!Array.isArray(tc.tags) || !tc.tags.some((id) => set.has(id))) return false;
    }
    return true;
  };

  const renderTestCase = (node, level) => {
    const type = testTypeMap.get(node.testTypeCode?.toString().toLowerCase()) || testTypeMap.get(node.testTypeCode);
    const iconUrl = type?.icon?.url || null;
    const iconColor = type?.icon?.colorDark || '#60a5fa';
    const displayName = type?.name || node.testTypeCode || '';
    if (!passesFilters(node.raw)) return null;
    const history = mockRunHistory(node.id || node.tcid);
    const stepsCount = Array.isArray(node.raw?.testSteps) ? node.raw.testSteps.length : 0;
    return (
      <div
        key={`tc:${node.id}`}
        className="mb-1 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-subtle text-foreground dark:text-[#b3bbc9] transition-colors cursor-pointer dark:bg-[#141617] hover:dark:bg-[#171a1d]"
        style={{ paddingLeft: `${level * 16 + 28}px` }}
        title={`${node.tcid}: ${node.name}`}
        {...(enableDragDrop ? { draggable: true, onDragStart: (e) => handleDragStart(e, { kind: 'tc', id: node.id, sourceFolderId: node.parentFolderId || null }) } : {})}
        onClick={() => onSelectTestCase?.(node.raw)}
        onDoubleClick={() => onOpenTestCase?.(node.raw)}
      >
        <div className="inline-flex items-center gap-2 min-w-0 flex-wrap">
          {iconUrl ? (
            <span
              style={{ WebkitMaskImage: `url(${iconUrl})`, maskImage: `url(${iconUrl})`, WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskSize: 'contain', maskSize: 'contain', backgroundColor: iconColor, width: 16, height: 16 }}
              className="inline-block flex-shrink-0"
              aria-hidden="true"
            />
          ) : (
            <span className="w-4 h-4 rounded-sm bg-[rgb(var(--tc-icon))]/30 block" />
          )}
          <span className="font-semibold text-sm truncate">{node.tcid}</span>
          <span className="text-menu">|</span>
          <span className="truncate">{node.name}</span>
          {/* When inline panel is closed, show meta pills before the mini viz */}
          {!inlinePanelOpen && (
            <>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                (node.raw?.priority === 'High') ? 'border text-red-800 bg-red-100 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
                : (node.raw?.priority === 'Medium') ? 'border text-blue-800 bg-blue-100 border-blue-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-900/30'
                : (node.raw?.priority === 'Low') ? 'border text-green-800 bg-green-100 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30'
                : 'border text-gray-800 bg-gray-100 border-gray-200 dark:bg-white/10 dark:text-menu dark:border-white/10'
              }`}>{node.raw?.priority || '—'}</span>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/5 text-menu">
                {iconUrl ? (
                  <span
                    style={{ WebkitMaskImage: `url(${iconUrl})`, maskImage: `url(${iconUrl})`, WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskSize: 'contain', maskSize: 'contain', backgroundColor: iconColor, width: 12, height: 12 }}
                    className="inline-block"
                  />
                ) : null}
                <span>{displayName || '—'}</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-menu">{stepsCount} steps</span>
            </>
          )}
          {/* Inline last 10 runs mini viz only when inline panel is closed */}
          {!inlinePanelOpen && <RunHistoryMini history={history} />}
        </div>
      </div>
    );
  };

  const renderFolder = (node, level) => {
    const isOpen = expanded.has(node.id);
    const isSelected = selectedFolderId === node.id;
    let kids = childrenMap.get(node.id) || [];
    // Apply filtering to children: always show folders; test cases filtered.
    kids = kids.filter((c) => c.type === 'folder' || passesFilters(c.raw));
    
    // Auto-expand folders that contain matching test cases when searching
    const hasMatchingTestCases = kids.some(c => c.type === 'tc' && passesFilters(c.raw));
    const shouldAutoExpand = (searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterTestType !== 'all' || (selectedTagIds && selectedTagIds.length > 0)) && hasMatchingTestCases;
    
    if (shouldAutoExpand && !isOpen) {
      // Auto-expand this folder
      setTimeout(() => toggle(node.id), 100);
    }
    
    return (
      <div key={`folder:${node.id}`}>
        <div
          className={`mb-1 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-subtle transition-colors ${isSelected ? 'bg-white/10 text-white' : 'text-menu hover:bg-white/5'}`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          title={node.name}
          {...(enableDragDrop ? { draggable: true, onDragStart: (e) => handleDragStart(e, { kind: 'folder', id: node.id, sourceParentId: node.parentFolderId || null }), onDragOver: handleDragOverFolder, onDrop: (e) => handleDropOnFolder(e, node) } : {})}
          onClick={() => {
            if (clickTimer.current) clearTimeout(clickTimer.current);
            clickTimer.current = setTimeout(() => {
              onSelectFolder?.(node.raw);
              toggle(node.id);
            }, 160);
          }}
          onDoubleClick={async () => {
            if (clickTimer.current) clearTimeout(clickTimer.current);
            const newName = window.prompt('Rename folder', node.name);
            const finalName = (newName || '').trim();
            if (!finalName || finalName === node.name) return;
            await folderService.renameFolder(organizationId, projectId, node.id, finalName);
            if (!node.parentFolderId) await reloadRoots();
            else await reloadFolderChildren(node.parentFolderId);
          }}
        >
          <button className="p-1 hover:bg-white/10 rounded text-menu hover:text-foreground" onClick={(e) => { e.stopPropagation(); toggle(node.id); }}>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {level === 0 ? (
            <ListChecks className="h-5 w-5 text-green-600" />
          ) : (
            <FolderIcon className="h-5 w-5 text-blue-600" />
          )}
          <span className="text-foreground">{node.name}</span>
        </div>
        {isOpen && kids.length > 0 && (
          <div className="ml-2 space-y-1">
            {kids
              .sort((a, b) => {
                // folders first, then test cases by name
                if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
                return (a.name || '').localeCompare(b.name || '');
              })
              .map((c) => c.type === 'folder' ? renderFolder(c, level + 1) : renderTestCase(c, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Expand all subfolders for the requested target folder
  useEffect(() => {
    (async () => {
      if (!expandTargetFolderId || !expandRequestKey) return;
      // BFS through descendants, ensuring children are loaded and marking expanded
      const queue = [expandTargetFolderId];
      const next = new Set(expanded);
      // Use direct load to avoid state lag
      const localChildren = new Map(childrenMap);
      const loadKids = async (fid) => {
        if (!localChildren.has(fid)) {
          const items = await loadItems(fid);
          localChildren.set(fid, items);
        }
        return localChildren.get(fid) || [];
      };
      while (queue.length > 0) {
        const fid = queue.shift();
        next.add(fid);
        // eslint-disable-next-line no-await-in-loop
        const items = await loadKids(fid);
        for (const it of items) {
          if (it.type === 'folder') queue.push(it.id);
        }
      }
      setChildrenMap(localChildren);
      setExpanded(next);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandRequestKey]);

  // Expand ALL folders across the tree
  useEffect(() => {
    (async () => {
      if (!expandAllKey) return;
      const next = new Set();
      const localChildren = new Map(childrenMap);
      const queue = [];
      // seed with root folders
      for (const it of rootItems) {
        if (it.type === 'folder') queue.push(it.id);
      }
      const loadKids = async (fid) => {
        if (!localChildren.has(fid)) {
          const items = await loadItems(fid);
          localChildren.set(fid, items);
        }
        return localChildren.get(fid) || [];
      };
      while (queue.length > 0) {
        const fid = queue.shift();
        next.add(fid);
        // eslint-disable-next-line no-await-in-loop
        const items = await loadKids(fid);
        for (const it of items) {
          if (it.type === 'folder') queue.push(it.id);
        }
      }
      setChildrenMap(localChildren);
      setExpanded(next);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandAllKey]);

  // Collapse ALL folders
  useEffect(() => {
    if (!collapseAllKey) return;
    setExpanded(new Set());
  }, [collapseAllKey]);

  return (
    <div>
      {busy && <div className="text-xs text-menu px-3 py-1">Loading…</div>}
      <div
        className="space-y-1"
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Root drop handling */}
        <div
          className="rounded-md"
          {...(enableDragDrop ? { onDragOver: handleDragOverFolder, onDrop: async (e) => {
            const raw = e.dataTransfer.getData('application/json');
            if (!raw) return;
            const data = JSON.parse(raw);
            if (data.kind === 'folder') {
              if (await isIllegalFolderMove(data.id, null)) return;
              await folderService.moveFolder(organizationId, projectId, data.id, null);
              if (data.sourceParentId) await reloadFolderChildren(data.sourceParentId);
              await reloadRoots();
            }
          } } : {})}
        >
          {rootItems
            .sort((a, b) => {
              if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
              return (a.name || '').localeCompare(b.name || '');
            })
            .map((n) => n.type === 'folder' ? renderFolder(n, 0) : renderTestCase(n, 0))}
        </div>
      </div>
    </div>
  );
}


