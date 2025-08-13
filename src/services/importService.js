import { folderService } from './folderService';
import { testTypeService } from './testTypeService';
import { testCaseService } from './testCaseService';

function splitPath(path) {
  return (path || '')
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function resolveFolderPath(organizationId, projectId, folderPath, createMissing = true) {
  const parts = splitPath(folderPath);
  if (parts.length === 0) return null; // root
  let parentId = null;
  for (const name of parts) {
    // list children under current parent
    const children = await folderService.listChildren(organizationId, projectId, parentId);
    const found = children.find((c) => String(c.name).trim().toLowerCase() === name.toLowerCase());
    if (found) {
      parentId = found.id;
      continue;
    }
    if (!createMissing) {
      throw new Error(`Folder segment not found: ${name}`);
    }
    const created = await folderService.createFolder(organizationId, projectId, {
      name,
      parentFolderId: parentId,
    });
    parentId = created.id;
  }
  return parentId; // final folder id
}

async function resolveTestTypeForOrg(organizationId, { name }) {
  if (!name) {
    throw new Error('Test Type Name is required');
  }
  
  const list = await testTypeService.getResolvedOrgTestTypes(organizationId);
  const lower = String(name).toLowerCase();
  const testType = list.find((t) => String(t.name).toLowerCase() === lower);
  
  if (!testType || testType.enabled === false) {
    throw new Error(`Test Type '${name}' is not enabled for this organization. Available types: ${list.filter(t => t.enabled).map(t => t.name).join(', ')}`);
  }
  
  return { id: testType.id, name: testType.name };
}

function mapStepsToUi(steps) {
  // Input: [{ order, action, expectedResult }]
  if (!Array.isArray(steps)) return [];
  const sorted = [...steps].sort((a, b) => (a.order || 0) - (b.order || 0));
  return sorted.map((s, idx) => ({
    stepNumber: Number(s.order || idx + 1),
    description: s.action || '',
    testData: '',
    expectedResult: s.expectedResult || '',
    actualResult: '',
    stepStatus: 'Not Run',
    notes: '',
  }));
}

export const importService = {
  async importTestCases({
    organizationId,
    projectId,
    rows,
    options = { createMissingFolders: true },
    targetFolderId = null,
    actorName = '',
  }) {
    if (!organizationId || !projectId) throw new Error('organizationId and projectId are required');
    if (!Array.isArray(rows) || rows.length === 0) return { created: 0, errors: [] };
    const errors = [];
    let created = 0;
    // Process sequentially to keep it simple initially
    for (const row of rows) {
      try {
        const folderId = targetFolderId != null
          ? targetFolderId
          : await resolveFolderPath(
              organizationId,
              projectId,
              row.folderPath || '',
              options.createMissingFolders !== false
            );
        const tt = await resolveTestTypeForOrg(organizationId, {
          name: row.testTypeName,
        });
        const payload = {
          name: row.name,
          description: row.description,
          // Override author with the importing user's display name (required per requirement)
          author: actorName || row.author || '',
          folderId: folderId || null,
          testTypeName: tt.name,
          testTypeCode: tt.id,
          overallResult: row.overallResult || 'Not Run',
          prerequisites: row.prerequisites || '',
          priority: row.priority || 'Medium',
          testSteps: mapStepsToUi(row.steps || []),
        };
        await testCaseService.createTestCase(organizationId, projectId, payload);
        created += 1;
      } catch (err) {
        errors.push({ tcid: row.tcid, message: err?.message || 'Failed to import row' });
      }
    }
    return { created, errors };
  },
};


