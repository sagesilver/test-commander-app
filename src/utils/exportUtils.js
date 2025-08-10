// Utilities to export arrays of plain objects to CSV, XLSX, and HTML files
// Follows designs/Test-Commander-Export-Spec.md

import { unparse } from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

function ensureExtension(filename, ext) {
  if (!filename) return `export.${ext}`;
  const lower = filename.toLowerCase();
  return lower.endsWith(`.${ext}`) ? filename : `${filename}.${ext}`;
}

function safeRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    // Ensure only primitives/strings in cells for CSV/HTML readability
    const clean = {};
    Object.entries(row || {}).forEach(([key, value]) => {
      if (value == null) {
        clean[key] = '';
      } else if (Array.isArray(value)) {
        clean[key] = value.join(', ');
      } else if (typeof value === 'object') {
        try {
          clean[key] = JSON.stringify(value);
        } catch (_) {
          clean[key] = String(value);
        }
      } else {
        clean[key] = value;
      }
    });
    return clean;
  });
}

export function exportCSV(rows, filename = 'export') {
  const data = safeRows(rows);
  const csv = unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, ensureExtension(filename, 'csv'));
}

export function exportXLSX(rows, filename = 'export') {
  const data = safeRows(rows);
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');
  // Use writeFile for robust browser download handling
  XLSX.writeFile(workbook, ensureExtension(filename, 'xlsx'));
}

export function exportHTML(rows, filename = 'export') {
  const data = safeRows(rows);
  const keys = data.length > 0 ? Object.keys(data[0]) : [];
  const header = keys.map((k) => `<th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;">${k}</th>`).join('');
  const body = data
    .map((row) =>
      `<tr>${keys
        .map((k) => `<td style="padding:8px;border-bottom:1px solid #f1f5f9;">${row[k] ?? ''}</td>`)
        .join('')}</tr>`
    )
    .join('');

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${filename}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial; color: #0f172a; background: #ffffff; }
    table { border-collapse: collapse; width: 100%; }
    thead { background:#f8fafc; }
  </style>
  </head>
<body>
  <h1 style="font-size:18px;margin:16px 0;">${filename}</h1>
  <table>
    <thead><tr>${header}</tr></thead>
    <tbody>${body || '<tr><td>No data</td></tr>'}</tbody>
  </table>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  saveAs(blob, ensureExtension(filename, 'html'));
}


