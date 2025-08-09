## Test Commander – Grid View V2 (Spec)

### Purpose
Replace the current MUI DataGrid with a custom, headless table that preserves the exact visual design and UX shown in the Test Cases screenshot while adding a clean foundation for extensibility.

### Implementation status (V2)
- **Implemented**: Headless grid with inline per‑column filters, header sorting (Shift for multi‑sort), pagination (bottom‑right), column resizing (drag handle), fixed table layout with horizontal scroll, truncated Name with tooltip, dark/light theming, and container background that expands with row count.
- **Deferred (not in V2)**: State persistence (URL/localStorage for columns/sorts/filters/page). Leave out until requested.
- **Approved (to add with Firestore integration)**: Row virtualization using TanStack Virtual, enabled when row count > 200; rowHeight 56 px; overscan 8–12; sticky headers remain.

### Non‑negotiable requirements
- **Parity styling**: The new grid must visually match the existing grid in `src/components/TestCasesGrid.js` (dark screenshot) and its light equivalent. Layout, spacing, typography, colours, hover states and badges must be identical.
- **Per‑column sort and filter**: Each column supports sort (ASC/DESC/none) and a column‑specific filter control using standard, intuitive mechanisms.
- **Row vertical alignment**: All cells are vertically centred; consistent row height with even baselines across columns.
- **Action tooltips**: Hover tooltips for actions: View, Edit, Delete. Tooltips appear with short delays and are accessible.
- **Pagination UI**: Rows‑per‑page selector and page navigation located at the bottom‑right; format mirrors current footer (e.g., “1–21 of 21”).
- **Record count**: Total record indicator beside the section title chip (e.g., “21 total”).
- **Theme support**: Works in dark and light modes; respects `ThemeContext` and existing CSS tokens.

### References (current implementation)
- Grid component: `src/components/TestCasesGrid.js`
- Page usage: `src/pages/TestCases.js`
- Dark/light theme: `src/contexts/ThemeContext.js`

### Visual and interaction specifications
- **Container**: Card with rounded corners and subtle border
  - Classes: `bg-card rounded-lg shadow-lg border border-subtle`.
- **Header bar**: Sticky top header area
  - Classes: `p-4 bg-surface-muted border-b border-subtle`.
  - Title: left‑aligned `Test Cases` text + pills showing total count (`{n} total`) with chip styles: `bg-[rgb(var(--tc-icon))]/20 text-[rgb(var(--tc-contrast))]`.
- **Row height**: 56 px. **Column header height**: 56 px.
- **Typography**: Uses current app font scale; header label weight medium/semibold to match screenshot.
- **Cell alignment**: Every cell uses flex alignment, middle‑center vertically; truncated long text with native `title` attribute tooltips where relevant (e.g., Name column).
- **Hover states**: Row hover background: `rgba(255,255,255,0.05)` in dark mode; appropriate light analogue.
- **Badges/pills**: Reuse existing styles from V1 grid
  - Test Type pill mapping:
    - Functional → `text-[rgb(var(--tc-contrast))] bg-white/5`
    - Security → `text-red-400 bg-red-900/20`
    - Performance → `text-purple-300 bg-purple-900/20`
    - Usability → `text-green-400 bg-green-900/20`
    - Integration → `text-orange-300 bg-orange-900/20`
  - Priority chip mapping:
    - High → red up‑arrow; `bg-red-900/20 text-red-400`
    - Medium → orange dot; `bg-orange-900/20 text-orange-300`
    - Low → green down‑arrow; `bg-green-900/20 text-green-400`
  - Status pill mapping:
    - Passed → `bg-green-900/20 text-green-400`
    - Failed → `bg-red-900/20 text-red-400`
    - In Progress → `bg-amber-900/20 text-amber-300`
    - Not Run → `bg-white/5 text-menu`
- **Actions column**:
  - Buttons (View, Edit, Delete) with 24–28 px hit area, icon size 16 px.
  - Hover styles: `hover:bg-white/10` for neutral, `hover:bg-red-900/20` for delete.
  - Tooltips: “View Details”, “Edit Test Case”, “Delete Test Case”.
  - Events do not trigger row selection or navigation.
- **Footer/pagination**:
  - Bottom border on footer; right‑aligned controls.
  - Rows per page: 10, 20, 50; default 20.
  - Display text mirrors “x–y of z”.
- **Icons**: Lucide icons as in V1 grid; colour and sizes unchanged.

### Behavioural requirements
- **Sorting**
  - Click header toggles: none → ASC → DESC → none.
  - Multi‑column sorting supported via modifier key (Shift+Click). Sort indicators match current style.
- **Filtering**
  - Global quick filter input in the toolbar (top of grid body) with debounce 300 ms.
  - Per‑column filters rendered inline in a filter row under headers; types:
    - Text: contains/equals/starts with.
    - Select: single/multi select from distinct values.
    - Date: from/to.
  - Clear filter per column and clear‑all.
- **Pagination**
  - Client‑side pagination by default; API supports server‑side when provided with `total`, `page`, `pageSize`, `onPageChange`, `onPageSizeChange`.
- **Empty/loading states**
  - Loading overlay with spinner and subdued text.
  - Empty state with icon and guidance; honour quick filter state (“No results”).
- **Keyboard & a11y**
  - Semantic `<table>` with `<thead>/<tbody>`.
  - Tab and arrow key focus across headers and cells; Enter to activate sort; Esc closes a filter popover.
  - ARIA labels for toolbar controls and action buttons; tooltips accessible.

### Theming
- Respect `ThemeContext` which toggles `html.dark`; use existing CSS tokens:
  - `--tc-foreground`, `--tc-surface`, `--tc-icon`, `--tc-contrast`, `--tc-menu`, `--tc-subtle`.
- No inline hard‑coded colours beyond what already exists in V1; light equivalents provided via the same tokens and Tailwind utilities.

### Performance
- Target 1,000+ rows with smooth scroll; enable row virtualization when row count > 200.
- Column resize/reorder should not re‑mount cells.
 - Table uses `table-layout: fixed` and horizontal scrolling to prevent layout shifts and ensure the card background expands with content.
 - Virtualization is approved but deferred until Firestore data source is connected; then turn on automatically when `rows.length > 200` with `overscan=8–12` and constant `rowHeight=56`.

### State persistence
- Deferred for V2. When enabled later, persist (key `tc_grid_v2`) visible columns/order/widths/density and sorts/filters/page/pageSize to URL + `localStorage`.

### API (component contract)
```
<DataTable
  columns={ColumnDef[]}
  data={Row[]}
  pageSizeOptions={[10, 20, 50]}
  defaultPageSize={20}
  initialState={{ sorts, filters, page, pageSize, columnSizing }}
  onView={row => void}
  onEdit={row => void}
  onDelete={row => void}
  serverState={optional: { total, page, pageSize }}
  onStateChange={optional: (state) => void}
  emptyMessage="No test cases"
/>
```
- ColumnDef supports: `id`, `header`, `accessorKey|accessorFn`, `minSize|size|maxSize`, `enableSorting`, `filterType` (`text|select|date|none`), `cell` renderer, `enableResizing`.

### Column resizing
- Users can resize any column by dragging the right edge of the header; handle is visible on hover.
- Resize mode is on‑change; widths update live without re‑mounting cells.
- Column sizes are persisted with other grid state.

### Columns (Test Cases grid parity)
1) `Test Case ID` – 150 px – blue chip.
2) `Name` – 350 px (resizable) – text truncation with `title` tooltip; does not auto‑expand to fit full text.
3) `Author` – 180 px – circle avatar with initials (gradient), name text.
4) `Test Type` – 140 px – pill colour mapping above.
5) `Priority` – 120 px – icon + coloured chip mapping above.
6) `Status` – 130 px – pill mapping above.
7) `Steps` – 100 px – circular count + “steps”.
8) `Actions` – 140 px – three icon buttons with tooltips; not sortable/filterable.

### Acceptance criteria
- Visual snapshot comparison (dark and light) against the current MUI grid shows no perceivable differences in spacing, colours, typography, hover states, borders, or icon treatments.
- Each column sorts and filters independently; global quick filter works; clear‑all resets view.
- Rows remain vertically centred and 56 px high across all densities.
- Footer shows page controls at bottom‑right; page size selector defaults to 20; display text “x–y of z”.
- Total count chip is correct and updates as data changes.
- Tooltips appear on hover/focus for all action icons; keyboard users can trigger actions.
- Theme toggle switches instantly without visual artefacts.
- Handles 1,000 rows with no noticeable jank; virtualization turns on automatically when needed.
- Column resizing works for all columns; drag handle present and responsive; new sizes are respected across body cells.
- The grid card/container background grows to accommodate all visible rows; no clipping after ~10 rows.

### Out of scope for V2 (may be added next)
- Inline cell editing, bulk selection/operations, column pinning/grouping, CSV/XLSX export, row reordering.

### Implementation guidance (non‑binding)
- Use TanStack Table v8 (headless) for core table logic; TanStack Virtual for virtualization.
- Build in `src/components/table/`:
  - `DataTable.tsx` (shell + header/body/footer + toolbar)
  - `ColumnHeader.tsx` (label + sort + filter trigger)
  - `Filters/` (TextFilter, SelectFilter, DateRangeFilter)
  - `cells/` (StatusPill, PriorityChip, AuthorAvatarCell, StepsCell, ActionsCell)
  - `Paginator.tsx` (bottom‑right controls)
- Reuse existing tokens/classes from V1 to guarantee identical styling.

### Test plan
- Visual regression for dark/light.
- Unit tests for sort/filter logic per column.
- Interaction tests: tooltips, keyboard navigation, pagination state, state persistence.
- Performance test with 1,000 rows (virtualized) and 50 columns synthetic.
 - After Firestore hookup: enable virtualization and verify smooth scroll, overscan tuning, and sticky header behaviour.


