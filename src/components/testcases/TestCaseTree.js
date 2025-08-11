import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Folder as FolderIcon } from 'lucide-react';
import { folderService } from '../../services/folderService';
import { testCaseService } from '../../services/testCaseService';
import { testTypeService } from '../../services/testTypeService';

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
  searchTerm = '',
  filterStatus = 'all',
  filterPriority = 'all',
  filterTestType = 'all',
  selectedTagIds = [],
}) {
  const { mapById: testTypeMap } = useOrgTestTypes(organizationId);
  const [rootItems, setRootItems] = useState([]);
  const [expanded, setExpanded] = useState(() => new Set());
  const [childrenMap, setChildrenMap] = useState(() => new Map());
  const [busy, setBusy] = useState(false);
  const clickTimer = useRef(null);

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
      raw: f,
    }));
    const tcNodes = testCases.map(tc => ({
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
      const text = `${tc.tcid} ${tc.name} ${tc.description || ''} ${tc.author || ''}`.toLowerCase();
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
    return (
      <div
        key={`tc:${node.id}`}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-foreground hover:bg-white/5 cursor-pointer"
        style={{ paddingLeft: `${level * 16 + 28}px` }}
        title={`${node.tcid}: ${node.name}`}
        draggable
        onDragStart={(e) => handleDragStart(e, { kind: 'tc', id: node.id, sourceFolderId: node.parentFolderId || null })}
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
          <span className="truncate" style={{ maxWidth: 320 }}>{node.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusClasses[node.overallResult] || 'bg-white/5 text-menu'}`}>
            Last: {node.overallResult || 'Not Run'}
          </span>
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
    return (
      <div key={`folder:${node.id}`}>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${isSelected ? 'bg-white/10 text-white' : 'text-menu hover:bg-white/5'}`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          title={node.name}
          draggable
          onDragStart={(e) => handleDragStart(e, { kind: 'folder', id: node.id, sourceParentId: node.parentFolderId || null })}
          onDragOver={handleDragOverFolder}
          onDrop={(e) => handleDropOnFolder(e, node)}
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
          <span className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
          <FolderIcon className="w-4 h-4 text-foreground" />
          <span className="text-foreground">{node.name}</span>
        </div>
        {isOpen && kids.length > 0 && (
          <div className="ml-2">
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
          onDragOver={handleDragOverFolder}
          onDrop={async (e) => {
            // Drop onto root area → move to root (parentFolderId = null)
            const raw = e.dataTransfer.getData('application/json');
            if (!raw) return;
            const data = JSON.parse(raw);
            if (data.kind === 'tc') {
              await testCaseService.updateTestCase(organizationId, projectId, data.id, { folderId: null });
              if (data.sourceFolderId) await reloadFolderChildren(data.sourceFolderId);
              await reloadRoots();
            } else if (data.kind === 'folder') {
              if (await isIllegalFolderMove(data.id, null)) return;
              await folderService.moveFolder(organizationId, projectId, data.id, null);
              if (data.sourceParentId) await reloadFolderChildren(data.sourceParentId);
              await reloadRoots();
            }
          }}
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


