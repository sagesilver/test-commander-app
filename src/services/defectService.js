import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  collectionGroup,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db, functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

export const defectService = {
  async listDefectsByProject(organizationId, projectId, options = {}) {
    assert(organizationId, 'organizationId required');
    assert(projectId, 'projectId required');

    const {
      folderId = null,
      status = null,
      severity = null,
      priority = null,
      assignedTo = null,
      pageSize = 25,
      startAfterDoc = null,
      orderByField = 'updatedAt',
      orderDirection = 'desc'
    } = options;

    const colRef = collection(db, 'organizations', organizationId, 'projects', projectId, 'defects');
    let q = query(colRef);

    // Apply filters
    if (folderId !== null) {
      q = query(q, where('folderId', '==', folderId));
    }
    if (status) {
      q = query(q, where('status', '==', status));
    }
    if (severity) {
      q = query(q, where('severity', '==', severity));
    }
    if (priority) {
      q = query(q, where('priority', '==', priority));
    }
    if (assignedTo) {
      q = query(q, where('assignedTo', '==', assignedTo));
    }

    // Apply ordering and pagination
    q = query(q, orderBy(orderByField, orderDirection), limit(pageSize));
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data(), projectId }));
  },

  async getAllDefects(organizationId, options = {}) {
    assert(organizationId, 'organizationId required');
    
    const {
      status = null,
      severity = null,
      priority = null,
      assignedTo = null,
      pageSize = 25,
      startAfterDoc = null
    } = options;

    // Use collection group query for cross-project defects
    const q = query(
      collectionGroup(db, 'defects'),
      where('organizationId', '==', organizationId),
      orderBy('updatedAt', 'desc'),
      limit(pageSize)
    );

    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    try {
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data()
      }));
    } catch (error) {
      console.error('Error in getAllDefects:', error);
      throw error;
    }
  },

  async getDefect(organizationId, projectId, defectId) {
    assert(organizationId, 'organizationId required');
    assert(projectId, 'projectId required');
    assert(defectId, 'defectId required');

    const docRef = doc(db, 'organizations', organizationId, 'projects', projectId, 'defects', defectId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  },

  async createDefect(organizationId, projectId, payload) {
    assert(organizationId, 'organizationId required');
    assert(projectId, 'projectId required');
    assert(payload && typeof payload === 'object', 'payload required');
    assert(typeof payload.title === 'string' && payload.title.trim().length > 0, 'title required');
    assert(typeof payload.description === 'string' && payload.description.trim().length > 0, 'description required');
    assert(typeof payload.severity === 'string' && payload.severity.trim().length > 0, 'severity required');
    assert(typeof payload.priority === 'string' && payload.priority.trim().length > 0, 'priority required');

    const callable = httpsCallable(functions, 'createDefectWithUniqueKey');
    const result = await callable({ organizationId, projectId, payload });
    return result?.data || null;
  },

  async updateDefect(organizationId, projectId, defectId, updates) {
    assert(organizationId && projectId && defectId, 'ids required');
    assert(updates && typeof updates === 'object', 'updates required');
    
    const ref = doc(db, 'organizations', organizationId, 'projects', projectId, 'defects', defectId);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: updates.updatedBy || null
    };
    
    await updateDoc(ref, updateData);
    return { success: true };
  },

  async moveDefect(organizationId, projectId, defectId, targetFolderId) {
    assert(organizationId && projectId && defectId !== undefined, 'ids required');
    const updates = { folderId: targetFolderId || null };
    const ref = doc(db, 'organizations', organizationId, 'projects', projectId, 'defects', defectId);
    await updateDoc(ref, updates);
    return { success: true };
  },

  async deleteDefect(organizationId, projectId, defectId) {
    assert(organizationId && projectId && defectId, 'ids required');
    
    // Soft delete - mark as archived
    const ref = doc(db, 'organizations', organizationId, 'projects', projectId, 'defects', defectId);
    await updateDoc(ref, {
      status: 'Archived',
      archivedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  },

  async getReferenceValues(organizationId, refType) {
    assert(organizationId, 'organizationId required');
    assert(refType, 'refType required');

    // First try org-specific values, then fall back to global defaults
    const orgRef = collection(db, 'organizations', organizationId, 'ref_values', refType, 'values');
    const globalRef = collection(db, 'ref_values', refType, 'values');
    
    try {
      const orgSnap = await getDocs(orgRef);
      if (!orgSnap.empty) {
        return orgSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (error) {
      console.warn('Could not fetch org-specific reference values:', error);
    }

    // Fall back to global defaults
    try {
      const globalSnap = await getDocs(globalRef);
      return globalSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.warn('Could not fetch global reference values:', error);
      return [];
    }
  },

  async getDefectFolders(organizationId, projectId) {
    assert(organizationId, 'organizationId required');
    assert(projectId, 'projectId required');

    const colRef = collection(db, 'organizations', organizationId, 'projects', projectId, 'defect_folders');
    const q = query(colRef, orderBy('name'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  // Comment management
  async createComment(organizationId, projectId, defectId, comment) {
    assert(organizationId, 'organizationId required');
    assert(projectId, 'projectId required');
    assert(defectId, 'defectId required');
    assert(comment && comment.trim(), 'comment required');

    const callable = httpsCallable(functions, 'createDefectComment');
    const result = await callable({ organizationId, projectId, defectId, comment });
    return result?.data || null;
  },

  async updateComment(organizationId, projectId, defectId, commentId, comment) {
    assert(organizationId, 'organizationId required');
    assert(projectId, 'projectId required');
    assert(defectId, 'defectId required');
    assert(commentId, 'commentId required');
    assert(comment && comment.trim(), 'comment required');

    const callable = httpsCallable(functions, 'updateDefectComment');
    const result = await callable({ organizationId, projectId, defectId, commentId, comment });
    return result?.data || null;
  },

  async deleteComment(organizationId, projectId, defectId, commentId) {
    assert(organizationId, 'organizationId required');
    assert(projectId, 'projectId required');
    assert(defectId, 'defectId required');
    assert(commentId, 'commentId required');

    const callable = httpsCallable(functions, 'deleteDefectComment');
    const result = await callable({ organizationId, projectId, defectId, commentId });
    return result?.data || null;
  },

  async getComments(organizationId, projectId, defectId) {
    assert(organizationId, 'organizationId required');
    assert(projectId, 'projectId required');
    assert(defectId, 'defectId required');

    const colRef = collection(db, 'organizations', organizationId, 'projects', projectId, 'defects', defectId, 'comments');
    const q = query(colRef, orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async getHistory(organizationId, projectId, defectId) {
    assert(organizationId, 'organizationId required');
    assert(projectId, 'projectId required');
    assert(defectId, 'defectId required');

    const colRef = collection(db, 'organizations', organizationId, 'projects', projectId, 'defects', defectId, 'history');
    const q = query(colRef, orderBy('at', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  // Import/Export
  async exportDefects(organizationId, projectId, filters, format = 'csv') {
    assert(organizationId, 'organizationId required');

    const callable = httpsCallable(functions, 'exportDefects');
    const result = await callable({ organizationId, projectId, filters, format });
    return result?.data || null;
  },

  async importDefects(organizationId, projectId, defects, dryRun = false) {
    assert(organizationId, 'organizationId required');
    assert(projectId, 'projectId required');
    assert(Array.isArray(defects), 'defects must be an array');

    const callable = httpsCallable(functions, 'importDefects');
    const result = await callable({ organizationId, projectId, defects, dryRun });
    return result?.data || null;
  },

  // Tag management
  async getTagCatalog(organizationId) {
    assert(organizationId, 'organizationId required');

    const colRef = collection(db, 'organizations', organizationId, 'tag_catalog');
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
};
