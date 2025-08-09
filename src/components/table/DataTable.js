import React, { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

const classNames = (...parts) => parts.filter(Boolean).join(' ');

function getUniqueValues(data, accessorKey) {
  const set = new Set();
  for (const row of data) {
    const value = accessorKey in row ? row[accessorKey] : undefined;
    if (value != null && value !== '') set.add(value);
  }
  return Array.from(set).sort();
}

export default function DataTable({
  columns,
  data,
  pageSizeOptions = [10, 20, 50],
  defaultPageSize = 20,
  initialState = {},
  emptyMessage = 'No records',
  className,
}) {
  const [globalFilter, setGlobalFilter] = useState(initialState.globalFilter || '');
  const [sorting, setSorting] = useState(initialState.sorting || []);
  const [columnFilters, setColumnFilters] = useState(initialState.columnFilters || []);
  const [pagination, setPagination] = useState({
    pageIndex: initialState.page || 0,
    pageSize: initialState.pageSize || defaultPageSize,
  });
  const [columnSizing, setColumnSizing] = useState({});
  const [columnSizingInfo, setColumnSizingInfo] = useState({});

  const table = useReactTable({
    data: data || [],
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
      globalFilter,
      columnSizing,
      columnSizingInfo,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onColumnSizingChange: setColumnSizing,
    onColumnSizingInfoChange: setColumnSizingInfo,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    defaultColumn: { minSize: 100, size: 150, maxSize: 600, enableResizing: true },
    columnResizeMode: 'onChange',
  });

  const total = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const start = total === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min(total, (pageIndex + 1) * pageSize);

  return (
    <div className={className}>
      {/* Quick filter */}
      <div className="w-full flex items-center gap-3 p-2 border-b border-subtle bg-surface-muted">
        <span className="text-sm text-foreground">Filter</span>
        <input
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Type to filter..."
          className="input-field h-8 text-sm max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderSpacing: 0, tableLayout: 'fixed', minWidth: table.getTotalSize ? table.getTotalSize() : undefined }}>
          <thead className="bg-surface-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-subtle h-14">
                {headerGroup.headers.map((header) => {
                  const width = header.getSize ? header.getSize() : header.column.columnDef.size;
                  return (
                    <th
                      key={header.id}
                      style={{ width, minWidth: header.column.columnDef.minSize, maxWidth: header.column.columnDef.maxSize }}
                      className={classNames('relative group px-4 text-left font-medium text-foreground select-none')}
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          className="flex items-center gap-1 focus:outline-none"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{ asc: '↑', desc: '↓' }[header.column.getIsSorted() ?? null] && (
                            <span className="text-menu">
                              {{ asc: '↑', desc: '↓' }[header.column.getIsSorted()]}
                            </span>
                          )}
                        </button>
                      )}
                      {header.column.getCanResize?.() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="absolute top-0 right-0 h-full w-2 -mr-1 cursor-col-resize select-none opacity-0 group-hover:opacity-100 bg-transparent"
                          title="Drag to resize"
                          style={{ touchAction: 'none' }}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
            {/* Filter row */}
            <tr className="border-b border-subtle h-12">
              {table.getAllLeafColumns().map((col) => {
                const def = col.columnDef;
                const filterType = def.filterType || 'text';
                const canFilter = def.enableColumnFilter !== false && def.id !== 'actions';
                const accessorKey = def.accessorKey;
                const options = (filterType === 'select' && accessorKey)
                  ? getUniqueValues(data, accessorKey)
                  : [];
                return (
                  <th key={col.id} className="px-4">
                    {canFilter ? (
                      filterType === 'select' ? (
                        <select
                          className="input-field h-8 text-sm"
                          value={(col.getFilterValue() ?? '')}
                          onChange={(e) => col.setFilterValue(e.target.value || undefined)}
                        >
                          <option value="">All</option>
                          {options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="input-field h-8 text-sm"
                          value={(col.getFilterValue() ?? '')}
                          onChange={(e) => col.setFilterValue(e.target.value || undefined)}
                          placeholder="Filter"
                        />
                      )
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={table.getAllLeafColumns().length} className="px-4 py-8 text-center text-menu">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-subtle hover:bg-white/5 h-14">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 align-middle text-foreground" style={{ width: cell.column.getSize ? cell.column.getSize() : undefined }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer / pagination */}
      <div className="flex items-center justify-end gap-3 p-3 border-t border-subtle">
        <div className="hidden sm:block text-sm text-foreground">
          {start}-{end} of {total}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-menu">Rows per page</span>
          <select
            className="input-field h-8 text-sm w-[84px]"
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="px-2 py-1 rounded text-menu hover:text-foreground disabled:opacity-40"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            title="First page"
          >«</button>
          <button
            className="px-2 py-1 rounded text-menu hover:text-foreground disabled:opacity-40"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title="Previous page"
          >‹</button>
          <button
            className="px-2 py-1 rounded text-menu hover:text-foreground disabled:opacity-40"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title="Next page"
          >›</button>
          <button
            className="px-2 py-1 rounded text-menu hover:text-foreground disabled:opacity-40"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            title="Last page"
          >»</button>
        </div>
      </div>
    </div>
  );
}


