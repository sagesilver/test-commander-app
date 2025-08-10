import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

export const folderService = {
  async listChildren(organizationId, projectId, parentFolderId = null) {
    assert(organizationId && projectId, 'ids required');
    const col = collection(db, 'organizations', organizationId, 'projects', projectId, 'folders');
    const q = query(col, where('parentFolderId', '==', parentFolderId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async getFolder(organizationId, projectId, folderId) {
    assert(organizationId && projectId && folderId, 'ids required');
    const ref = doc(db, 'organizations', organizationId, 'projects', projectId, 'folders', folderId);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async createFolder(organizationId, projectId, { name, description = '', parentFolderId = null, createdBy }) {
    assert(organizationId && projectId, 'ids required');
    assert(typeof name === 'string' && name.trim().length > 0, 'name required');

    if (parentFolderId) {
      // validate parent exists
      const parent = await this.getFolder(organizationId, projectId, parentFolderId);
      if (!parent) throw new Error('Parent folder does not exist');
    }

    const col = collection(db, 'organizations', organizationId, 'projects', projectId, 'folders');
    const docRef = await addDoc(col, {
      name: name.trim(),
      description,
      parentFolderId: parentFolderId || null,
      organizationId,
      projectId,
      createdBy: createdBy || null,
      createdAt: new Date(),
    });
    return { id: docRef.id };
  },

  async renameFolder(organizationId, projectId, folderId, newName) {
    assert(organizationId && projectId && folderId, 'ids required');
    assert(typeof newName === 'string' && newName.trim().length > 0, 'newName required');
    const ref = doc(db, 'organizations', organizationId, 'projects', projectId, 'folders', folderId);
    await updateDoc(ref, { name: newName.trim() });
  },

  async moveFolder(organizationId, projectId, folderId, newParentFolderId) {
    assert(organizationId && projectId && folderId, 'ids required');
    if (newParentFolderId) {
      const parent = await this.getFolder(organizationId, projectId, newParentFolderId);
      if (!parent) throw new Error('New parent folder does not exist');
      if (newParentFolderId === folderId) throw new Error('Cannot move folder into itself');
    }
    const ref = doc(db, 'organizations', organizationId, 'projects', projectId, 'folders', folderId);
    await updateDoc(ref, { parentFolderId: newParentFolderId || null });
  },

  async deleteFolder(organizationId, projectId, folderId) {
    assert(organizationId && projectId && folderId, 'ids required');
    const ref = doc(db, 'organizations', organizationId, 'projects', projectId, 'folders', folderId);
    await deleteDoc(ref);
  },
};


