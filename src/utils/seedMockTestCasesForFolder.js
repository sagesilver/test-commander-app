import { testCaseService } from '../services/testCaseService';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uniqueTcid(prefix = 'TC-MOCK') {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${ymd}-${rand}`;
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const templates = [
  {
    name: 'User Login Flow',
    testType: 'Functional',
    overallResult: 'Not Run',
    prerequisites: 'Valid user account exists',
    steps: [
      { description: 'Navigate to login page', expectedResult: 'Login page is displayed', testData: 'URL /login' },
      { description: 'Enter valid username', expectedResult: 'Username accepted', testData: 'user@example.com' },
      { description: 'Enter valid password', expectedResult: 'Password accepted', testData: '********' },
      { description: 'Click Login', expectedResult: 'User redirected to dashboard' },
    ],
  },
  {
    name: 'Password Reset Functionality',
    testType: 'Functional',
    overallResult: 'Not Run',
    prerequisites: 'User email is registered',
    steps: [
      { description: 'Open Forgot Password page', expectedResult: 'Reset form is shown' },
      { description: 'Submit registered email', expectedResult: 'Reset email sent' },
    ],
  },
  {
    name: 'Profile Information Update',
    testType: 'Functional',
    overallResult: 'Not Run',
    prerequisites: 'User is logged in',
    steps: [
      { description: 'Open profile settings', expectedResult: 'Settings page displayed' },
      { description: 'Change first name', expectedResult: 'Value updated locally', testData: 'Michael' },
      { description: 'Save changes', expectedResult: 'Changes persisted with success message' },
    ],
  },
  {
    name: 'Product Search Functionality',
    testType: 'Functional',
    overallResult: 'Not Run',
    prerequisites: 'Catalog has data',
    steps: [
      { description: 'Open catalog page', expectedResult: 'Catalog visible with search bar' },
      { description: 'Search for term', expectedResult: 'Relevant results displayed', testData: 'laptop' },
    ],
  },
  {
    name: 'Category Filtering',
    testType: 'Functional',
    overallResult: 'Not Run',
    prerequisites: 'Multiple categories exist',
    steps: [
      { description: 'Select Electronics filter', expectedResult: 'Only electronics shown' },
      { description: 'Apply price range filter', expectedResult: 'Results within range', testData: '$100-$500' },
    ],
  },
];

function buildSteps(rawSteps) {
  return rawSteps.map((s, i) => ({
    stepNumber: i + 1,
    description: s.description,
    testData: s.testData || '',
    expectedResult: s.expectedResult,
    actualResult: '',
    stepStatus: 'Not Run',
    notes: '',
  }));
}

export async function seedMockTestCasesForFolder({ organizationId, projectId, folderId, author, count = 5 }) {
  if (!organizationId || !projectId || !folderId) throw new Error('organizationId, projectId, folderId required');
  const howMany = Math.min(Math.max(parseInt(count, 10) || 5, 1), 5);

  const pool = clone(templates);
  const picks = [];
  for (let i = 0; i < howMany; i += 1) {
    const idx = i % pool.length;
    picks.push(pool[idx]);
  }

  const created = [];
  for (const t of picks) {
    const tcid = uniqueTcid('TC-MOCK');
    const payload = {
      tcid,
      name: t.name,
      description: `${t.name} - seeded mock for Folder testing` ,
      author: author || 'Seeder',
      testType: t.testType,
      overallResult: t.overallResult,
      prerequisites: t.prerequisites,
      priority: 'Medium',
      tags: [],
      testSteps: buildSteps(t.steps),
      folderId,
    };
    try {
      const res = await testCaseService.createTestCase(organizationId, projectId, payload);
      created.push({ tcid, ok: true, res });
    } catch (e) {
      // retry once with a new tcid on collision
      if (String(e?.message || '').includes('already exists')) {
        const retryPayload = { ...payload, tcid: uniqueTcid('TC-MOCK') };
        const res2 = await testCaseService.createTestCase(organizationId, projectId, retryPayload);
        created.push({ tcid: retryPayload.tcid, ok: true, res: res2 });
      } else {
        created.push({ tcid, ok: false, error: e?.message || String(e) });
      }
    }
  }

  return created;
}


