# Test Commander – Export Specification

This document specifies the libraries, approach, and example code for implementing **CSV**, **XLSX**, and **HTML** exports for Test Commander entities such as **Defects** and **Test Cases**.

---

## 1. CSV Export

**Library:** [`papaparse`](https://www.npmjs.com/package/papaparse)  
- Simple, fast CSV creation and parsing.
- Works in-browser and Node.js.
- Can download directly as a `.csv` file in the browser.

### Installation
```bash
npm install papaparse
```

### Example
```javascript
import { unparse } from 'papaparse';

const csv = unparse(dataArray); // dataArray = [{col1:..., col2:...}, ...]
const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
link.setAttribute("href", url);
link.setAttribute("download", "export.csv");
document.body.appendChild(link);
link.click();
```

---

## 2. XLSX Export

**Library:** [`xlsx`](https://www.npmjs.com/package/xlsx) (a.k.a. SheetJS)  
- Supports `.xlsx`, `.xls`, `.csv`, `.ods`.
- Can export multiple sheets in a single file.
- Widely used, active project.

### Installation
```bash
npm install xlsx
```

### Example
```javascript
import * as XLSX from 'xlsx';

const ws = XLSX.utils.json_to_sheet(dataArray);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Export");
XLSX.writeFile(wb, "export.xlsx");
```

---

## 3. HTML Export

**Options:**  
- **Full table export for reports**: use [`file-saver`](https://www.npmjs.com/package/file-saver) + generate HTML string.
- **Styled PDF/HTML**: [`jspdf`](https://www.npmjs.com/package/jspdf) with `autoTable` plugin (can output HTML or PDF).
- **Pure HTML file**: Just wrap the table markup in `<html><body>...</body></html>` and save as `.html`.

### Installation
```bash
npm install file-saver
```

### Example (Basic HTML File Export)
```javascript
import { saveAs } from 'file-saver';

const htmlContent = `<html><body>${tableHtml}</body></html>`;
const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
saveAs(blob, 'export.html');
```

---

## 4. Combined Option

If you want **one library** that can handle CSV, XLSX, and HTML table exports:
- [`exceljs`](https://www.npmjs.com/package/exceljs) — robust spreadsheet export, can generate `.xlsx` with styling and formulas, but heavier than `xlsx`.
- Still use `papaparse` for super-lightweight CSVs.

---

## 5. Recommendation for Test Commander

- **CSV:** `papaparse`
- **XLSX:** `xlsx` (SheetJS)
- **HTML:** simple Blob + `file-saver` (or `jspdf` if you want a PDF-like HTML export)
- Keep exports behind **role checks** so only permitted users can download.

---

## 6. Integration with RBAC

Exports should be protected with the following rules:
- **Only** users with the `view_reports` or `manage_test_cases` / `manage_defects` permission can export.
- Client-side buttons hidden if user lacks permission.
- Server-side security rules or Cloud Functions should validate permissions before serving data.

---

## 7. Next Steps

- Implement export buttons in **Defects** and **Test Cases** grid views.
- Apply filters before exporting (only export what's visible in the grid).
- Support both **full dataset** export and **filtered dataset** export.
