import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { getUserById } from './userService';
import { USER_ROLES } from './authService';

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function hasAppAdminRole(currentUserData) {
  return Array.isArray(currentUserData?.roles) && currentUserData.roles.includes(USER_ROLES.APP_ADMIN);
}

function hasOrgAdminRoleFor(currentUserData, organizationId) {
  return (
    Array.isArray(currentUserData?.roles) &&
    currentUserData.roles.includes(USER_ROLES.ORG_ADMIN) &&
    currentUserData?.organisationId === organizationId
  );
}

function hasProjectManagerRoleFor(currentUserData, organizationId) {
  return (
    Array.isArray(currentUserData?.roles) &&
    currentUserData.roles.includes(USER_ROLES.PROJECT_MANAGER) &&
    currentUserData?.organisationId === organizationId
  );
}

async function isProjectAdmin(currentUserId, organizationId, projectId) {
  const projectRef = doc(db, 'organizations', organizationId, 'projects', projectId);
  const snap = await getDoc(projectRef);
  if (!snap.exists()) return false;
  const data = snap.data();
  const adminIds = Array.isArray(data.projectAdminIds) ? data.projectAdminIds : [];
  return currentUserId != null && adminIds.includes(currentUserId);
}

export const projectsService = {
  async createProject(currentUserData, organizationId, projectData) {
    assert(currentUserData?.userId, 'Not authenticated');
    assert(
      hasAppAdminRole(currentUserData) ||
        hasOrgAdminRoleFor(currentUserData, organizationId) ||
        hasProjectManagerRoleFor(currentUserData, organizationId),
      'Not authorized to create projects for this organization'
    );

    const projectsColRef = collection(db, 'organizations', organizationId, 'projects');
    const newProjectRef = doc(projectsColRef);

    const now = serverTimestamp();
    const creatorId = currentUserData.userId;

    const projectDoc = {
      projectId: newProjectRef.id,
      organizationId,
      name: projectData?.name || '',
      description: projectData?.description || '',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      createdBy: creatorId,
      tags: Array.isArray(projectData?.tags) ? projectData.tags : [],
      projectAdminIds: Array.isArray(projectData?.projectAdminIds)
        ? Array.from(new Set([creatorId, ...projectData.projectAdminIds]))
        : [creatorId],
      metadata: {
        ...projectData?.metadata,
      },
      settings: {
        defaultFolderStructure: Boolean(projectData?.settings?.defaultFolderStructure) || false,
        allowCrossProjectClone: Boolean(projectData?.settings?.allowCrossProjectClone) || false,
        ...projectData?.settings,
      },
      // Compatibility with existing UI expectations
      projectManagerId: projectData?.projectManagerId || '',
      members: Array.isArray(projectData?.members) ? projectData.members : [],
      isActive: true,
    };

    await setDoc(newProjectRef, projectDoc);
    // Return a client-friendly object; Firestore timestamps will resolve on read
    return { id: newProjectRef.id, ...projectDoc };
  },

  async updateProject(currentUserData, organizationId, projectId, updates) {
    assert(currentUserData?.userId, 'Not authenticated');

    const isAdmin =
      hasAppAdminRole(currentUserData) ||
      hasOrgAdminRoleFor(currentUserData, organizationId) ||
      (await isProjectAdmin(currentUserData.userId, organizationId, projectId));
    assert(isAdmin, 'Not authorized to update this project');

    const projectRef = doc(db, 'organizations', organizationId, 'projects', projectId);
    const updateData = {
      ...updates,
      // Keep status/isActive consistent
      ...(typeof updates?.status === 'string'
        ? { isActive: updates.status === 'ACTIVE' }
        : {}),
      updatedAt: serverTimestamp(),
    };
    await updateDoc(projectRef, updateData);
  },

  async deactivateProject(currentUserData, organizationId, projectId) {
    assert(currentUserData?.userId, 'Not authenticated');
    const projectRef = doc(db, 'organizations', organizationId, 'projects', projectId);
    await updateDoc(projectRef, { status: 'INACTIVE', isActive: false, updatedAt: serverTimestamp() });
  },

  async reactivateProject(currentUserData, organizationId, projectId) {
    return this.updateProject(currentUserData, organizationId, projectId, { status: 'ACTIVE' });
  },

  async getProjectsForUser(currentUserData, options = {}) {
    const { organizationId = null, includeInactive = false } = options;
    const activeOnly = !includeInactive;

    // App Admin with no organization selected: return empty (avoid cross-org collectionGroup for now)
    if (hasAppAdminRole(currentUserData) && !organizationId) {
      return [];
    }

    // Determine org in scope
    const orgId = organizationId || currentUserData?.organisationId || null;
    assert(orgId, 'Organization not specified');

    // Org Admin or Org Member scope
    const constraints = [];
    const isAdmin = hasAppAdminRole(currentUserData) || hasOrgAdminRoleFor(currentUserData, orgId);
    if (!isAdmin && activeOnly) {
      constraints.push(where('status', '==', 'ACTIVE'));
    } else if (activeOnly) {
      // Admins may still prefer ACTIVE only; leave filter optional. Keeping it off avoids index quirks.
    }
    const q = query(collection(db, 'organizations', orgId, 'projects'), ...constraints);
    const snap = await getDocs(q);
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Enrich with createdByName (robust lookup: uid, userId field or email)
    const cache = new Map();
    for (const row of rows) {
      const creatorId = row.createdBy;
      if (creatorId && !cache.has(creatorId)) {
        try {
          const u = await getUserById(creatorId);
          const display = u?.name || u?.email || creatorId;
          cache.set(creatorId, display);
        } catch (_) {
          cache.set(creatorId, creatorId);
        }
      }
      row.createdByName = creatorId ? cache.get(creatorId) : '—';
    }
    return rows;
  },

  async getAllProjectsForAdmin(currentUserData, options = {}) {
    const { includeInactive = false } = options;
    assert(hasAppAdminRole(currentUserData), 'Only App Admin can load all projects');
    const activeOnly = !includeInactive;

    const orgsSnap = await getDocs(collection(db, 'organizations'));
    const all = [];
    for (const orgDoc of orgsSnap.docs) {
      const orgId = orgDoc.id;
      const constraints = [];
      if (activeOnly) constraints.push(where('status', '==', 'ACTIVE'));
      const projSnap = await getDocs(query(collection(db, 'organizations', orgId, 'projects'), ...constraints));
      for (const d of projSnap.docs) {
        all.push({ id: d.id, ...d.data() });
      }
    }
    // Enrich with createdByName
    const cache = new Map();
    for (const row of all) {
      const creatorId = row.createdBy;
      if (creatorId && !cache.has(creatorId)) {
        try {
          const u = await getUserById(creatorId);
          cache.set(creatorId, u?.name || u?.email || creatorId);
        } catch (_) {
          cache.set(creatorId, creatorId);
        }
      }
      row.createdByName = creatorId ? cache.get(creatorId) : '—';
    }
    return all;
  },
};


