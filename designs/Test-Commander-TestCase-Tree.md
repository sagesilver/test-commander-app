This is one of the test case views I currently have. It has a folder structure on the left and test cases (on the right) that are within each folder. I want to change it so that the test cases appear within the folder structure, but I want it to eb a composite record consisting of the test type icon, followed by the test case id, followed by the test case name and the  n followed by the last run test result. Can such a compisite record be constructed and displaed so that it looks like a record in a tree view ?

Yes. Doable—and cleanly.

# What to build

* One unified **tree** that contains both **folders (branches)** and **test cases (leaves)**.
* **Drag & drop** supports:

  1. Drag a **test case** onto any folder → update its `folderId`.
  2. Drag a **folder** onto another folder → update its `parentFolderId` (and keep its subtree intact).
* Composite labels for leaves (test cases): `[type icon]  TC-12345  |  Name  |  Last: Passed`.

# Suggested stack

* **@dnd-kit** (best modern DX for nested DnD) with its **SortableTree** pattern.
* Your existing tree UI (MUI TreeView or your own) for rendering; wire DnD sensors onto rows.

# Data assumptions

* `testCases/{id}` has `folderId`.
* `folders/{id}` has `parentFolderId`.
* (Optional but recommended) `folders/{id}.path` array of ancestor IDs for fast queries and to block illegal drops.

# Drag rules

* Can’t drop a folder **into itself** or **one of its descendants**.
* Respect RBAC: only roles with permission can move (APP\_ADMIN, ORG\_ADMIN, PROJECT\_ADMIN).

# UI wiring (essentials)

```tsx
// Pseudocode: React + dnd-kit
import { DndContext, useSensor, PointerSensor, DragEndEvent } from '@dnd-kit/core';

function Tree({ treeData, onMoveCase, onMoveFolder }) {
  const sensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });

  return (
    <DndContext sensors={[sensor]} onDragEnd={(e) => handleDragEnd(e, {onMoveCase, onMoveFolder})}>
      {treeData.map(node => <Row key={node.id} node={node} />)}
    </DndContext>
  );
}

function handleDragEnd(e: DragEndEvent, { onMoveCase, onMoveFolder }) {
  const { active, over } = e; // active.id & over.id like 'tc:abc' or 'folder:xyz'
  if (!over) return;

  const [activeType, activeId] = active.id.split(':');
  const [overType, overId]     = over.id.split(':');

  // All drops target a folder
  const targetFolderId = overType === 'folder' ? overId : null;
  if (!targetFolderId) return;

  if (activeType === 'tc') {
    onMoveCase(activeId, targetFolderId);  // update test case folderId
  } else if (activeType === 'folder') {
    onMoveFolder(activeId, targetFolderId); // update parentFolderId
  }
}
```

# Firestore updates

### Move a test case

* Single document update; trivial and fast.

```ts
// client
await updateDoc(doc(db, 'testCases', tcId), {
  folderId: targetFolderId,
  updatedAt: serverTimestamp(),
  updatedBy: userId
});
```

### Move a folder (with subtree)

Two safe options:

**A) Cloud Function (recommended for big trees):**

* Callable function `moveFolder({folderId, targetFolderId})`
* Validates: same project/org, RBAC, no cycles.
* Computes new `path` for the moved folder and **all descendants**.
* Uses **batched writes** in chunks of 500.

```ts
// index.ts (sketch)
export const moveFolder = onCall(async (req) => {
  const { folderId, targetFolderId, actor } = req.data;

  // 1) Load source folder, target folder
  // 2) Ensure target isn’t in folderId’s subtree
  // 3) Compute newPath = [...target.path, targetFolderId]
  // 4) Fetch descendants (folders + testCases)
  // 5) For each descendant, recompute path (for folders) and set folderId for test cases? (unchanged—only their path caches update if you store it)
  // 6) Write in batched chunks
});
```

**B) Client-side (OK for small trees):**

* Fetch subtree (folders + test cases).
* Run the same validations and **write in batches**.
* Downside: more reads; risk of client aborts mid‑operation.

### Preventing cycles

Before allowing a folder drop:

* If `targetFolderId === folderId` ⇒ reject.
* If you store `path` on every folder, check `targetFolder.path` **does not include** `folderId`. If you don’t store `path`, fetch ancestors iteratively.

### What to denormalize

* **Folders**: `path: string[]` (ancestor chain), `depth: number`, `projectId`.
* **Test cases**: `folderId`, (optional) `folderPath` for quick filtering, `lastResult`.
* Denormalized `path` lets you:

  * Block illegal drops instantly.
  * Filter trees without recursive queries.
  * Repaint the tree fast after a move.

# Security rules (must-have guards)

* Allow `update testCases/{id}.folderId` only when:

  * User has `canMoveTestCases(projectId)` AND
  * New `folderId` belongs to the same `projectId`/`orgId`.

* Allow `update folders/{id}.parentFolderId` only when:

  * User has `canMoveFolders(projectId)` AND
  * New parent is in same project/org AND
  * Not moving into a descendant (enforce by comparing `path` if you store it).

# UX details

* **Drag previews**: show the composite label while dragging.
* **Drop indicator**: highlight valid folder rows; dim invalid targets.
* **Optimistic UI**: reparent in the local tree immediately; rollback on error.
* **Keyboard support**: still allow Move via context menu “Move to…”.

# Performance notes

* For large trees, virtualize the left panel (e.g., `react-virtuoso`) to keep scrolling snappy.
* Chunk batched writes when moving big subtrees: max 500 mutations per batch; retry on transient errors.
* If you keep counts (e.g., number of cases per folder), update them in the same function transactionally.


