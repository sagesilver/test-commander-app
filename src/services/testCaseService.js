import {
  collection,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

export const testCaseService = {
  async listTestCasesByFolder(organizationId, projectId, folderId = null) {
    assert(organizationId, 'organizationId required');
    assert(projectId, 'projectId required');

    const colRef = collection(db, 'organizations', organizationId, 'projects', projectId, 'testCases');
    const q = query(colRef, where('folderId', '==', folderId === undefined ? null : folderId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async createTestCase(organizationId, projectId, payload) {
    assert(organizationId, 'organizationId required');
    assert(projectId, 'projectId required');
    assert(payload && typeof payload === 'object', 'payload required');
    assert(typeof payload.tcid === 'string' && payload.tcid.trim().length > 0, 'tcid required');
    assert(typeof payload.name === 'string' && payload.name.trim().length > 0, 'name required');
    assert(typeof payload.description === 'string' && payload.description.trim().length > 0, 'description required');
    assert(typeof payload.author === 'string' && payload.author.trim().length > 0, 'author required');

    const callable = httpsCallable(functions, 'createTestCaseWithUniqueTcid');
    const result = await callable({ organizationId, projectId, payload });
    return result?.data || null;
  },

  async updateTestCase(organizationId, projectId, testCaseId, updates) {
    assert(organizationId && projectId && testCaseId, 'ids required');
    const ref = doc(db, 'organizations', organizationId, 'projects', projectId, 'testCases', testCaseId);
    await updateDoc(ref, updates || {});
    return { success: true };
  },

  async deleteTestCase(organizationId, projectId, testCaseId) {
    assert(organizationId && projectId && testCaseId, 'ids required');
    const ref = doc(db, 'organizations', organizationId, 'projects', projectId, 'testCases', testCaseId);
    await deleteDoc(ref);
    return { success: true };
  },
};


