// Lightweight import utilities for CSV/XLSX according to Test Commander Import Spec

function trimString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

export function normaliseTcid(raw) {
  return (raw || '')
    .toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9\-]/g, '')
    .slice(0, 100);
}

export function parseCSVText(text) {
  // Returns array of objects using first row as header. Handles quoted fields and commas/newlines inside quotes.
  const rows = [];
  let i = 0;
  const len = text.length;
  const record = [];
  let field = '';
  let inQuotes = false;
  const pushField = () => {
    record.push(field);
    field = '';
  };
  const pushRecord = () => {
    if (record.length > 0 || rows.length === 0) rows.push(record.slice());
    record.length = 0;
  };
  while (i < len) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < len && text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i += 1;
          continue;
        }
      } else {
        field += ch;
        i += 1;
        continue;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i += 1;
        continue;
      }
      if (ch === ',') {
        pushField();
        i += 1;
        continue;
      }
      if (ch === '\n') {
        pushField();
        pushRecord();
        i += 1;
        continue;
      }
      if (ch === '\r') {
        // handle CRLF\r\n
        if (i + 1 < len && text[i + 1] === '\n') {
          pushField();
          pushRecord();
          i += 2;
          continue;
        }
        // lone CR
        pushField();
        pushRecord();
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
    }
  }
  // flush last field/record
  pushField();
  pushRecord();

  if (rows.length === 0) return [];
  const header = rows[0].map((h) => (h || '').toString().trim());
  const records = rows.slice(1).filter((r) => r.some((v) => (v || '').toString().trim() !== ''));
  return records.map((r) => {
    const obj = {};
    for (let c = 0; c < header.length; c += 1) {
      obj[header[c]] = r[c] != null ? r[c] : '';
    }
    return obj;
  });
}

export async function parseXLSXFile(file) {
  // Dynamic import; requires 'xlsx' package. If absent, throw instructive error.
  let XLSX;
  try {
    XLSX = await import(/* webpackIgnore: true */ 'xlsx');
  } catch (err) {
    throw new Error('XLSX import requires the "xlsx" package. Install it to enable .xlsx parsing.');
  }
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const byName = {};
  wb.SheetNames.forEach((name) => {
    const sheet = wb.Sheets[name];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    byName[name] = json;
  });
  return byName;
}

const REQUIRED_COLUMNS = [
  // TCID is now system-generated; not required from file
  'Name',
  'Description',
  'Author',
  // Folder Path is determined by user selection during import, not from file
];

export function mapRowsToTestCases(rows) {
  const errors = [];
  const seen = new Set();
  const out = [];
  for (const index in rows) {
    const row = rows[index];
    const at = Number(index) + 2; // header is line 1
    const missing = REQUIRED_COLUMNS.filter((k) => !row.hasOwnProperty(k));
    if (missing.length > 0) {
      errors.push({ line: at, message: `Missing required columns: ${missing.join(', ')}` });
      continue;
    }
    // TCID is ignored (system-generated). If provided, we do not enforce uniqueness within file.

    const testTypeName = trimString(row['Test Type Name']) || '';
    if (!testTypeName) {
      errors.push({ line: at, message: 'Test Type Name is required' });
      continue;
    }

    let steps = [];
    const stepsJson = trimString(row['Steps JSON']);
    if (stepsJson) {
      try {
        const parsed = JSON.parse(stepsJson);
        if (Array.isArray(parsed)) {
          steps = parsed
            .map((s, i) => ({
              order: Number(s.order || i + 1),
              action: trimString(s.action) || '',
              expectedResult: trimString(s.expectedResult) || '',
            }))
            .filter((s) => s.action || s.expectedResult)
            .sort((a, b) => a.order - b.order);
        }
      } catch (e) {
        errors.push({ line: at, message: 'Invalid Steps JSON' });
      }
    }

    const outRow = {
      name: trimString(row['Name']) || '',
      description: row['Description'] != null ? String(row['Description']) : '',
      author: trimString(row['Author']) || '',
      // folderPath is now determined by user selection during import, not from file
      folderPath: '',
      testTypeCode: '', // Removed as per edit hint
      testTypeName,
      overallResult: trimString(row['Overall Result']) || 'Not Run',
      prerequisites: trimString(row['Prerequisites']) || '',
      priority: trimString(row['Priority']) || 'Medium',
      steps,
    };
    out.push(outRow);
  }
  return { testCases: out, errors };
}

export async function parseImportFile(file) {
  const name = file?.name || '';
  const lower = name.toLowerCase();
  if (lower.endsWith('.csv')) {
    const text = await file.text();
    const rows = parseCSVText(text);
    return mapRowsToTestCases(rows);
  }
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    const sheets = await parseXLSXFile(file);
    // Prefer TestCases sheet, else first sheet
    const candidates = ['TestCases', 'Sheet1'];
    let rows = [];
    for (const key of candidates) {
      if (sheets[key]) { rows = sheets[key]; break; }
    }
    if (!rows || rows.length === 0) {
      const firstName = Object.keys(sheets)[0];
      rows = sheets[firstName] || [];
    }
    return mapRowsToTestCases(rows);
  }
  throw new Error('Unsupported file format. Please provide a .csv or .xlsx file.');
}


