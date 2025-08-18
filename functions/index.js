const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { randomUUID } = require('crypto');
const { writeBatch } = require('firebase-admin/firestore');

// Initialize Admin SDK once
try {
  admin.app();
} catch (e) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage();

// Helper to validate input
function assert(condition, message) {
  if (!condition) {
    throw new functions.https.HttpsError('invalid-argument', message);
  }
}

// Helper to get permissions for roles
function getPermissionsForRoles(roles) {
  const permissions = [];
  
  if (roles.includes('APP_ADMIN')) {
    permissions.push(
      'manage_organizations',
      'manage_users',
      'manage_projects',
      'manage_test_cases',
      'manage_defects',
      'view_reports',
      'system_settings'
    );
  } else if (roles.includes('ORG_ADMIN')) {
    permissions.push(
      'manage_users',
      'manage_projects',
      'manage_test_cases',
      'manage_defects',
      'view_reports'
    );
  } else if (roles.includes('PROJECT_MANAGER')) {
    permissions.push(
      'manage_projects',
      'manage_test_cases',
      'manage_defects',
      'view_reports'
    );
  } else if (roles.includes('ANALYST')) {
    permissions.push(
      'manage_test_cases',
      'view_reports'
    );
  } else if (roles.includes('TEST_ENGINEER')) {
    permissions.push(
      'manage_test_cases',
      'manage_defects',
      'view_reports'
    );
  } else if (roles.includes('DEFECT_COORDINATOR')) {
    permissions.push(
      'manage_defects',
      'view_reports'
    );
  }
  
  return permissions;
}

// Roles allowed
const ALLOWED_ROLES = new Set([
  'APP_ADMIN',
  'ORG_ADMIN',
  'PROJECT_MANAGER',
  'ANALYST',
  'TEST_ENGINEER',
  'DEFECT_COORDINATOR',
]);

// Default reference values for defects
const DEFAULT_DEFECT_REFERENCE_VALUES = {
  defect_status: [
    { id: 'open', label: 'Open', isDefault: true, isActive: true, order: 1 },
    { id: 'in_progress', label: 'In Progress', isDefault: true, isActive: true, order: 2 },
    { id: 'in_review', label: 'In Review', isDefault: true, isActive: true, order: 3 },
    { id: 'blocked', label: 'Blocked', isDefault: true, isActive: true, order: 4 },
    { id: 'resolved', label: 'Resolved', isDefault: true, isActive: true, order: 5 },
    { id: 'verified', label: 'Verified', isDefault: true, isActive: true, order: 6 },
    { id: 'closed', label: 'Closed', isDefault: true, isActive: true, order: 7 },
    { id: 'archived', label: 'Archived', isDefault: false, isActive: true, order: 8 }
  ],
  defect_severity: [
    { id: 'critical', label: 'Critical', isDefault: true, isActive: true, order: 1 },
    { id: 'high', label: 'High', isDefault: true, isActive: true, order: 2 },
    { id: 'medium', label: 'Medium', isDefault: true, isActive: true, order: 3 },
    { id: 'low', label: 'Low', isDefault: true, isActive: true, order: 4 },
    { id: 'trivial', label: 'Trivial', isDefault: true, isActive: true, order: 5 }
  ],
  defect_priority: [
    { id: 'p0', label: 'P0', isDefault: true, isActive: true, order: 1 },
    { id: 'p1', label: 'P1', isDefault: true, isActive: true, order: 2 },
    { id: 'p2', label: 'P2', isDefault: true, isActive: true, order: 3 },
    { id: 'p3', label: 'P3', isDefault: true, isActive: true, order: 4 }
  ],
  defect_reproducibility: [
    { id: 'always', label: 'Always', isDefault: true, isActive: true, order: 1 },
    { id: 'often', label: 'Often', isDefault: true, isActive: true, order: 2 },
    { id: 'intermittent', label: 'Intermittent', isDefault: true, isActive: true, order: 3 },
    { id: 'rare', label: 'Rare', isDefault: true, isActive: true, order: 4 },
    { id: 'unable_to_reproduce', label: 'Unable to Reproduce', isDefault: true, isActive: true, order: 5 }
  ],
  defect_resolution: [
    { id: 'fixed', label: 'Fixed', isDefault: true, isActive: true, order: 1 },
    { id: 'wont_fix', label: 'Won\'t Fix', isDefault: true, isActive: true, order: 2 },
    { id: 'duplicate', label: 'Duplicate', isDefault: true, isActive: true, order: 3 },
    { id: 'as_designed', label: 'As Designed', isDefault: true, isActive: true, order: 4 },
    { id: 'cannot_reproduce', label: 'Cannot Reproduce', isDefault: true, isActive: true, order: 5 },
    { id: 'deferred', label: 'Deferred', isDefault: true, isActive: true, order: 6 }
  ]
};

exports.createUserAndInvite = functions.region('australia-southeast1').https.onCall(async (data, context) => {
  console.log('Function called with data:', data);
  console.log('Context auth:', context.auth);
  
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const callerUid = context.auth.uid;
  console.log('Caller UID:', callerUid);

  // Load caller user doc for RBAC check (bypass security rules with Admin SDK)
  console.log('Attempting to read caller document from users collection...');
  const callerDoc = await db.collection('users').doc(callerUid).get();
  console.log('Caller document exists:', callerDoc.exists);
  if (!callerDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Caller has no user profile');
  }
  const caller = callerDoc.data();
  console.log('Caller data:', caller);
  const callerRoles = Array.isArray(caller.roles) ? caller.roles : [];

  const isAppAdmin = callerRoles.includes('APP_ADMIN');
  const isOrgAdmin = callerRoles.includes('ORG_ADMIN');

  // Validate payload
  const email = (data.email || '').toLowerCase().trim();
  const name = (data.name || '').trim();
  const roles = Array.isArray(data.roles) ? data.roles : [];
  const organisationId = data.organisationId || null;
  const isActive = data.isActive !== false;
  const profile = data.profile || {};
  const createdBy = data.createdBy || callerUid;

  assert(email && /.+@.+\..+/.test(email), 'Valid email is required');
  assert(name, 'Name is required');
  assert(roles.length > 0, 'At least one role is required');
  for (const r of roles) {
    assert(ALLOWED_ROLES.has(r), `Invalid role: ${r}`);
  }
  assert(organisationId || roles.includes('APP_ADMIN'), 'organisationId is required for non-APP_ADMIN users');

  // Permission checks
  if (isAppAdmin) {
    // ok
  } else if (isOrgAdmin) {
    if (roles.includes('APP_ADMIN')) {
      throw new functions.https.HttpsError('permission-denied', 'Org Admin cannot create APP_ADMIN users');
    }
    if (caller.organisationId !== organisationId) {
      throw new functions.https.HttpsError('permission-denied', 'Org Admin can only create users in their organization');
    }
  } else {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }

  // Check if user already exists in Firebase Auth
  let userRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(email);
    console.log('User already exists in Firebase Auth:', userRecord.uid);
    
    // Check if user already exists in Firestore
    const existingUserDoc = await db.collection('users').doc(userRecord.uid).get();
    if (existingUserDoc.exists) {
      throw new functions.https.HttpsError('already-exists', 'A user with this email already exists in the system');
    }
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      // Create new Firebase Auth user
      userRecord = await admin.auth().createUser({
        email,
        displayName: name,
        disabled: !isActive,
      });
      console.log('Created new Firebase Auth user:', userRecord.uid);
    } else if (error.code === 'already-exists') {
      throw error; // Re-throw our custom error
    } else {
      throw error;
    }
  }

  // Create Firestore document with real UID
  const userDoc = {
    userId: userRecord.uid,
    email,
    name,
    roles,
    organisationId: roles.includes('APP_ADMIN') ? null : organisationId,
    isActive,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy,
    lastLoginAt: null,
    profile: {
      avatar: '',
      department: profile.department || '',
      position: profile.position || '',
      phone: profile.phone || '',
    },
    permissions: getPermissionsForRoles(roles),
    mustChangePassword: true,
  };
  
  console.log('Creating Firestore document with real UID:', userRecord.uid);
  await db.collection('users').doc(userRecord.uid).set(userDoc, { merge: true });
  
  console.log('Firestore document created successfully');

  const response = {
    user: userDoc,
    message: 'User profile created successfully. A password reset email will be sent to complete their account setup.',
  };

  console.log('Returning response:', response);
  return response;
});

// ========== Test Types (Global + Org) ==========
exports.createGlobalTestType = functions.region('australia-southeast1').https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  const caller = (await db.collection('users').doc(context.auth.uid).get()).data();
  if (!caller || !Array.isArray(caller.roles) || !caller.roles.includes('APP_ADMIN')) {
    throw new functions.https.HttpsError('permission-denied', 'APP_ADMIN required');
  }
  const { code, name, category = null, description = '', icon, status = 'ACTIVE' } = data || {};
  if (!code || !name || !icon || !icon.name || !icon.url) {
    throw new functions.https.HttpsError('invalid-argument', 'code, name, icon.name, icon.url required');
  }
  const id = String(code).trim();
  const ref = db.collection('globalTestTypes').doc(id);
  const existing = await ref.get();
  if (existing.exists) throw new functions.https.HttpsError('already-exists', 'code already exists');
  await ref.set({ code: id, name, category, description, icon, status, createdAt: admin.firestore.FieldValue.serverTimestamp(), createdBy: context.auth.uid, updatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedBy: context.auth.uid });
  return { success: true, id };
});

exports.updateGlobalTestType = functions.region('australia-southeast1').https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  const caller = (await db.collection('users').doc(context.auth.uid).get()).data();
  if (!caller || !Array.isArray(caller.roles) || !caller.roles.includes('APP_ADMIN')) {
    throw new functions.https.HttpsError('permission-denied', 'APP_ADMIN required');
  }
  const { id, updates } = data || {};
  if (!id || !updates) throw new functions.https.HttpsError('invalid-argument', 'id and updates required');
  const ref = db.collection('globalTestTypes').doc(String(id));
  const allowed = ['name', 'category', 'description', 'icon', 'status'];
  const toSet = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
  toSet.updatedAt = admin.firestore.FieldValue.serverTimestamp();
  toSet.updatedBy = context.auth.uid;
  await ref.set(toSet, { merge: true });
  return { success: true };
});

exports.archiveGlobalTestType = functions.region('australia-southeast1').https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  const caller = (await db.collection('users').doc(context.auth.uid).get()).data();
  if (!caller || !Array.isArray(caller.roles) || !caller.roles.includes('APP_ADMIN')) {
    throw new functions.https.HttpsError('permission-denied', 'APP_ADMIN required');
  }
  const { id } = data || {};
  if (!id) throw new functions.https.HttpsError('invalid-argument', 'id required');
  await db.collection('globalTestTypes').doc(String(id)).set({ status: 'ARCHIVED', updatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedBy: context.auth.uid }, { merge: true });
  return { success: true };
});

exports.setOrgTestTypes = functions.region('australia-southeast1').https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  const { orgId, enabledIds = [], overrides = {} } = data || {};
  if (!orgId) throw new functions.https.HttpsError('invalid-argument', 'orgId required');

  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  const caller = callerDoc.data();
  const isAppAdmin = Array.isArray(caller?.roles) && caller.roles.includes('APP_ADMIN');
  const isOrgAdmin = Array.isArray(caller?.roles) && caller.roles.includes('ORG_ADMIN') && caller.organisationId === orgId;
  if (!isAppAdmin && !isOrgAdmin) throw new functions.https.HttpsError('permission-denied', 'ORG_ADMIN of org or APP_ADMIN required');

  const batch = db.batch();
  const basePath = `organizations/${orgId}/testTypes`;

  // Read existing
  const existingSnap = await db.collection(basePath).get();
  const existingIds = new Set(existingSnap.docs.map((d) => d.id));

  // Upserts
  for (const id of enabledIds) {
    const over = overrides[id] || null;
    const ref = db.collection(basePath).doc(id);
    batch.set(ref, { enabled: true, override: over || null, updatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedBy: context.auth.uid }, { merge: true });
    existingIds.delete(id);
  }

  // Deletes (disable)
  for (const id of existingIds) {
    const ref = db.collection(basePath).doc(id);
    batch.delete(ref);
  }

  await batch.commit();
  return { success: true };
});



// Cloud Function to handle post-password-reset cleanup and UUID update (fallback)
exports.updateUserAfterPasswordReset = functions.region('australia-southeast1').https.onCall(async (data, context) => {
  console.log('updateUserAfterPasswordReset called with data:', data);
  
  const { email } = data;
  
  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required');
  }
  
  try {
    // Find the temporary user document
    const usersQuery = await db.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
    
    if (usersQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'No user profile found for this email.');
    }
    
    const userDoc = usersQuery.docs[0];
    const userData = userDoc.data();
    
    // Get the real Firebase Auth user (should exist now after password reset)
    const userRecord = await admin.auth().getUserByEmail(email.toLowerCase());
    
    console.log('Found user profile:', userData);
    console.log('Real Firebase Auth UID:', userRecord.uid);
    
    // Update the Firestore document with the real UID
    await db.collection('users').doc(userRecord.uid).set({
      ...userData,
      userId: userRecord.uid,
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      mustChangePassword: false, // Clear the flag since they just set their password
    }, { merge: true });
    
    // Delete the temporary document
    await db.collection('users').doc(userDoc.id).delete();
    
    console.log('User profile updated successfully');
    
    return {
      success: true,
      message: 'User profile updated successfully.',
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Cloud Function to handle user signup and link to existing profile
exports.linkUserToProfile = functions.region('australia-southeast1').https.onCall(async (data, context) => {
  console.log('linkUserToProfile called with data:', data);
  
  const { email, password, name } = data;
  
  if (!email || !password || !name) {
    throw new functions.https.HttpsError('invalid-argument', 'Email, password, and name are required');
  }
  
  try {
    // Check if user profile exists in Firestore
    const usersQuery = await db.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
    
    if (usersQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'No user profile found for this email. Please contact your administrator.');
    }
    
    const userDoc = usersQuery.docs[0];
    const userData = userDoc.data();
    
    console.log('Found user profile:', userData);
    
    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email: email.toLowerCase(),
      password,
      displayName: name,
      disabled: false,
    });
    
    console.log('Created Firebase Auth user with UID:', userRecord.uid);
    
    // Update the Firestore document with the real UID
    await db.collection('users').doc(userRecord.uid).set({
      ...userData,
      userId: userRecord.uid,
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    // Delete the temporary document
    await db.collection('users').doc(userDoc.id).delete();
    
    console.log('User profile linked successfully');
    
    return {
      success: true,
      message: 'Account created successfully. You can now sign in.',
    };
  } catch (error) {
    console.error('Error linking user to profile:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Helpers for composite TCID
function toAcronym3(input, fallback = 'XXX') {
  const s = String(input || '').toUpperCase();
  const only = s.replace(/[^A-Z]/g, '');
  const out = (only || '').slice(0, 3).padEnd(3, 'X');
  return out || fallback;
}

function projectInitialsFromName(name, projectId) {
  const parts = String(name || '')
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z]/g, ''))
    .filter(Boolean);
  const letters = parts.slice(0, 3).map((w) => w[0].toUpperCase());
  if (letters.length > 0) return letters.join('');
  // Fallback to first 3 of projectId
  return toAcronym3(projectId || 'PRJ');
}

// Create a test case with project-scoped unique TCID using per-project index and sequence
exports.createTestCaseWithUniqueTcid = functions
  .region('australia-southeast1')
  .https.onCall(async (data, context) => {
    try {
      console.log('createTestCaseWithUniqueTcid called with data:', data);
      console.log('Context auth:', context.auth);
      
      if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
      }

      const { organizationId, projectId, payload } = data || {};
      console.log('Extracted:', { organizationId, projectId, payload });
      
      if (!organizationId || !projectId || !payload) {
        throw new functions.https.HttpsError('invalid-argument', 'organizationId, projectId and payload are required');
      }

    // Validate caller membership/privileges
    const callerUid = context.auth.uid;
    const callerDoc = await db.collection('users').doc(callerUid).get();
    let isAuthorized = false;
    if (callerDoc.exists) {
      const caller = callerDoc.data();
      const callerRoles = Array.isArray(caller.roles) ? caller.roles : [];
      const isAppAdmin = callerRoles.includes('APP_ADMIN');
      const isOrgAdmin = callerRoles.includes('ORG_ADMIN') && caller.organisationId === organizationId;
      const isMember = caller.organisationId === organizationId;
      isAuthorized = (isAppAdmin || isOrgAdmin || isMember);
    } else {
      // Fallback: allow if caller is a project admin for the target project
      const projRef = db.collection('organizations').doc(organizationId).collection('projects').doc(projectId);
      const projSnap = await projRef.get();
      if (projSnap.exists) {
        const p = projSnap.data() || {};
        const adminIds = Array.isArray(p.projectAdminIds) ? p.projectAdminIds : [];
        isAuthorized = adminIds.includes(callerUid);
      }
    }
    if (!isAuthorized) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to create test cases for this organization/project');
    }

    // Derive test type acronym
    const testTypeCode = String(payload.testTypeCode || '').trim();
    const testTypeName = String(payload.testTypeName || '').trim();
    const typeAcr = toAcronym3(testTypeCode || testTypeName || 'TYP');

    // Read project to derive initials
    const projectSnap = await db
      .collection('organizations').doc(organizationId)
      .collection('projects').doc(projectId)
      .get();
    if (!projectSnap.exists) {
      throw new functions.https.HttpsError('failed-precondition', 'Project does not exist');
    }
    const projectData = projectSnap.data() || {};
    const projInit = projectInitialsFromName(projectData.name || projectData.projectName || '', projectId);

    // Per-project counter for 5-digit sequence
    const counterRef = db
      .collection('organizations').doc(organizationId)
      .collection('projects').doc(projectId)
      .collection('counters').doc('testCase');

    // Per-project TCID index
    const indexRef = db
      .collection('organizations').doc(organizationId)
      .collection('projects').doc(projectId)
      .collection('tcidIndex');
    const tcColRef = db
      .collection('organizations')
      .doc(organizationId)
      .collection('projects')
      .doc(projectId)
      .collection('testCases');

    const folderId = payload.folderId || null;
    if (folderId) {
      const folderRef = db
        .collection('organizations')
        .doc(organizationId)
        .collection('projects')
        .doc(projectId)
        .collection('folders')
        .doc(folderId);
      const folderSnap = await folderRef.get();
      if (!folderSnap.exists) {
        throw new functions.https.HttpsError('failed-precondition', 'Folder does not exist');
      }
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const userId = context.auth.uid;

    const testCaseDocBase = {
      ...payload,
      organizationId,
      projectId,
      folderId,
      createdAt: now,
      createdBy: userId,
      uid: (typeof randomUUID === 'function') ? randomUUID() : Math.random().toString(36).slice(2),
    };

    console.log('About to run transaction with:', { counterRef: counterRef.path, indexRef: indexRef.path, tcColRef: tcColRef.path });
    
    await db.runTransaction(async (tx) => {
      console.log('Transaction started');
      
      // ALL READS FIRST
      const counterSnap = await tx.get(counterRef);
      const current = (counterSnap.exists && Number(counterSnap.data().seq)) || 0;
      const nextSeq = current + 1;
      console.log('Sequence:', { current, nextSeq });
      
      // Compose TCID
      const seqStr = String(nextSeq).padStart(5, '0');
      const tcid = `TCID-${projInit}-${typeAcr}-${seqStr}`;
      console.log('Generated TCID:', tcid);

      // Check TCID uniqueness (READ)
      const tcidIndexRef = indexRef.doc(tcid);
      const idx = await tx.get(tcidIndexRef);
      if (idx.exists) {
        throw new functions.https.HttpsError('already-exists', 'TCID already exists in project');
      }

      // ALL WRITES AFTER ALL READS
      tx.set(counterRef, { seq: nextSeq, updatedAt: now }, { merge: true });
      
      // Create test case doc
      const newTcRef = tcColRef.doc();
      console.log('Creating test case with ID:', newTcRef.id);
      
      tx.set(newTcRef, { ...testCaseDocBase, tcid }, { merge: true });
      tx.set(tcidIndexRef, {
        organizationId,
        projectId,
        testCaseId: newTcRef.id,
        tcid,
        createdAt: now,
        createdBy: userId,
      });
      
      console.log('Transaction completed successfully');
    });

      return { success: true };
    } catch (error) {
      console.error('Error in createTestCaseWithUniqueTcid:', error);
      throw new functions.https.HttpsError('internal', `Internal error: ${error.message}`);
    }
  });

// Upload editor asset via Cloud Functions to avoid browser CORS issues
exports.uploadEditorAsset = functions
  .region('australia-southeast1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const { base64, contentType, fileName } = data || {};
    if (!base64 || !contentType) {
      throw new functions.https.HttpsError('invalid-argument', 'base64 and contentType are required');
    }
    if (!/^image\//i.test(contentType)) {
      throw new functions.https.HttpsError('failed-precondition', 'Only image uploads are allowed');
    }
    const buffer = Buffer.from(base64, 'base64');
    const maxBytes = 4 * 1024 * 1024;
    if (buffer.length > maxBytes) {
      throw new functions.https.HttpsError('failed-precondition', 'Image exceeds 4 MB limit');
    }
    const y = new Date().getFullYear();
    const m = String(new Date().getMonth() + 1).padStart(2, '0');
    const safeName = String(fileName || 'image').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60) || 'image';
    const uid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    const ext = contentType.split('/')[1] || 'png';
    const path = `editor/${y}/${m}/${uid}-${safeName}.${ext}`;
    const bucket = storage.bucket();
    const file = bucket.file(path);
    const token = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    await file.save(buffer, {
      contentType,
      metadata: {
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
      resumable: false,
    });
    const encoded = encodeURIComponent(path);
    const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media&token=${token}`;
    return { downloadURL, path, contentType, size: buffer.length };
  });

// CORS-enabled HTTP endpoint with ID token check
exports.uploadEditorAssetHttp = functions
  .region('australia-southeast1')
  .https.onRequest(async (req, res) => {
    const allowOrigin = req.headers.origin || '*';
    res.set('Access-Control-Allow-Origin', allowOrigin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) return res.status(401).json({ error: 'Missing Authorization bearer token' });
      const decoded = await admin.auth().verifyIdToken(token);
      if (!decoded || !decoded.uid) return res.status(401).json({ error: 'Invalid token' });

      const { base64, contentType, fileName } = req.body || {};
      if (!base64 || !contentType) return res.status(400).json({ error: 'base64 and contentType required' });
      if (!/^image\//i.test(contentType)) return res.status(400).json({ error: 'Only image uploads allowed' });
      const buffer = Buffer.from(base64, 'base64');
      const maxBytes = 4 * 1024 * 1024;
      if (buffer.length > maxBytes) return res.status(400).json({ error: 'Image exceeds 4 MB' });

      const y = new Date().getFullYear();
      const m = String(new Date().getMonth() + 1).padStart(2, '0');
      const safeName = String(fileName || 'image').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60) || 'image';
      const uid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      const ext = (contentType.split('/')[1] || 'png').toLowerCase();
      const path = `editor/${y}/${m}/${uid}-${safeName}.${ext}`;
      const bucket = storage.bucket();
      const file = bucket.file(path);
      const dlToken = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      await file.save(buffer, {
        contentType,
        metadata: { metadata: { firebaseStorageDownloadTokens: dlToken } },
        resumable: false,
      });
      const encoded = encodeURIComponent(path);
      const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media&token=${dlToken}`;
      return res.status(200).json({ downloadURL, path, contentType, size: buffer.length });
    } catch (err) {
      console.error('uploadEditorAssetHttp failed', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  });

// Create defect with unique sequential key
exports.createDefectWithUniqueKey = functions
  .region('australia-southeast1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

          try {
        const { organizationId, projectId, payload } = data;
        
        // Validate required fields
        assert(organizationId, 'organizationId is required');
        assert(projectId, 'projectId is required');
        assert(payload, 'payload is required');
        assert(payload.title && payload.title.trim(), 'title is required');
        assert(payload.description && payload.description.trim(), 'description is required');
        assert(payload.severity && payload.severity.trim(), 'severity is required');
        assert(payload.priority && payload.priority.trim(), 'priority is required');

      // Get the next sequential defect number for this project
      const counterRef = db.collection('counters').doc(organizationId).collection('projects').doc(projectId);
      
      const result = await db.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let defectSeq = 1;
        
        if (counterDoc.exists) {
          defectSeq = (counterDoc.data().defectSeq || 0) + 1;
        }
        
        // Update the counter
        transaction.set(counterRef, { defectSeq }, { merge: true });
        
        // Create the defect document
        const defectData = {
          key: `DEF-${String(defectSeq).padStart(4, '0')}`,
          organizationId,
          projectId,
          title: payload.title.trim(),
          description: payload.description.trim(),
          severity: payload.severity,
          priority: payload.priority,
          status: payload.status || 'open',
          assignedTo: payload.assignedTo || null,
          raisedBy: payload.raisedBy || context.auth.uid,
          reporterId: context.auth.uid,
          folderId: payload.folderId || null,
          environment: payload.environment || null,
          browser: payload.browser || null,
          operatingSystem: payload.operatingSystem || null,
          stepsToReproduce: payload.stepsToReproduce || null,
          expectedBehavior: payload.expectedBehavior || null,
          actualBehavior: payload.actualBehavior || null,
          reproducibility: payload.reproducibility || null,
          resolution: payload.resolution || null,
          affectedVersion: payload.affectedVersion || null,
          foundInBuild: payload.foundInBuild || null,
          fixedInBuild: payload.fixedInBuild || null,
          attachments: payload.attachments || [],
          linkedTestCaseIds: payload.linkedTestCaseIds || [],
          linkedRunIds: payload.linkedRunIds || [],
          tags: payload.tags || [],
          watcherIds: [context.auth.uid], // Include reporter as watcher
          commentCount: 0,
          attachmentCount: payload.attachments ? payload.attachments.length : 0,
          lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: context.auth.uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: context.auth.uid
        };

        // Create searchable text for filtering
        defectData.searchText = [
          defectData.title.toLowerCase(),
          defectData.description.toLowerCase(),
          defectData.key.toLowerCase(),
          (defectData.tags || []).join(' ').toLowerCase()
        ].join(' ');

        // Normalize tags and update tag catalog
        if (defectData.tags && defectData.tags.length > 0) {
          const tagCatalogRef = db.collection('organizations', organizationId, 'tag_catalog');
          for (const tag of defectData.tags) {
            const normalizedTag = tag.toLowerCase().trim().replace(/\s+/g, '-');
            const tagDocRef = tagCatalogRef.doc(normalizedTag);
            transaction.set(tagDocRef, {
              tag: tag,
              slug: normalizedTag,
              useCount: admin.firestore.FieldValue.increment(1),
              lastUsed: admin.firestore.FieldValue.serverTimestamp(),
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          }
        }

        const defectRef = db.collection('organizations', organizationId, 'projects', projectId, 'defects');
        const newDefectRef = await transaction.create(defectRef.doc(), defectData);
        
        // Create initial history event
        const historyRef = newDefectRef.collection('history');
        transaction.create(historyRef.doc(), {
          type: 'created',
          field: 'status',
          old: null,
          new: defectData.status,
          at: admin.firestore.FieldValue.serverTimestamp(),
          by: context.auth.uid,
          description: 'Defect created'
        });
        
        return {
          id: newDefectRef.id,
          ...defectData
        };
      });

      return result;
    } catch (error) {
      console.error('Error in createDefectWithUniqueKey:', error);
      throw new functions.https.HttpsError('internal', `Internal error: ${error.message}`);
    }
  });

// Defect update trigger for change history and denormalized counters
exports.onDefectUpdate = functions
  .region('australia-southeast1')
  .firestore
  .document('organizations/{organizationId}/projects/{projectId}/defects/{defectId}')
  .onUpdate(async (change, context) => {
    const { organizationId, projectId, defectId } = context.params;
    const before = change.before.data();
    const after = change.after.data();
    
    try {
      const batch = writeBatch(db);
      
      // Track field changes for history
      const fieldsToTrack = ['status', 'severity', 'priority', 'assignedTo', 'resolution', 'folderId'];
      const changes = [];
      
      for (const field of fieldsToTrack) {
        if (before[field] !== after[field]) {
          changes.push({
            type: 'field_changed',
            field: field,
            old: before[field],
            new: after[field],
            at: admin.firestore.FieldValue.serverTimestamp(),
            by: after.updatedBy || 'system',
            description: `${field} changed from ${before[field]} to ${after[field]}`
          });
        }
      }
      
      // Add history events
      if (changes.length > 0) {
        const historyRef = change.after.ref.collection('history');
        for (const changeEvent of changes) {
          batch.create(historyRef.doc(), changeEvent);
        }
      }
      
      // Update search text if relevant fields changed
      const searchTextFields = ['title', 'description', 'tags'];
      let searchTextChanged = false;
      for (const field of searchTextFields) {
        if (before[field] !== after[field]) {
          searchTextChanged = true;
          break;
        }
      }
      
      if (searchTextChanged) {
        const newSearchText = [
          after.title.toLowerCase(),
          after.description.toLowerCase(),
          after.key.toLowerCase(),
          (after.tags || []).join(' ').toLowerCase()
        ].join(' ');
        
        batch.update(change.after.ref, { searchText: newSearchText });
      }
      
      // Update tag catalog if tags changed
      if (JSON.stringify(before.tags || []) !== JSON.stringify(after.tags || [])) {
        const tagCatalogRef = db.collection('organizations', organizationId, 'tag_catalog');
        
        // Remove old tags
        if (before.tags) {
          for (const tag of before.tags) {
            const normalizedTag = tag.toLowerCase().trim().replace(/\s+/g, '-');
            const tagDocRef = tagCatalogRef.doc(normalizedTag);
            batch.update(tagDocRef, {
              useCount: admin.firestore.FieldValue.increment(-1),
              lastUsed: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
        
        // Add new tags
        if (after.tags) {
          for (const tag of after.tags) {
            const normalizedTag = tag.toLowerCase().trim().replace(/\s+/g, '-');
            const tagDocRef = tagCatalogRef.doc(normalizedTag);
            batch.set(tagDocRef, {
              tag: tag,
              slug: normalizedTag,
              useCount: admin.firestore.FieldValue.increment(1),
              lastUsed: admin.firestore.FieldValue.serverTimestamp(),
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          }
        }
      }
      
      await batch.commit();
      console.log(`Defect ${defectId} updated with ${changes.length} changes tracked`);
      
    } catch (error) {
      console.error('Error in onDefectUpdate:', error);
    }
  });

// Initialize default reference values for defects
exports.initializeDefectReferenceValues = functions
  .region('australia-southeast1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
      const { organizationId } = data;
      assert(organizationId, 'organizationId is required');

      // Check if user has permission to initialize reference values
      const userDoc = await db.collection('users').doc(context.auth.uid).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'User not found');
      }

      const userData = userDoc.data();
      const isAppAdmin = userData.roles && userData.roles.includes('APP_ADMIN');
      const isOrgAdmin = userData.roles && userData.roles.includes('ORG_ADMIN') && userData.organisationId === organizationId;

      if (!isAppAdmin && !isOrgAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
      }

      const batch = writeBatch(db);
      const refValuesRef = db.collection('organizations', organizationId, 'ref_values');

      // Initialize each reference type
      for (const [refType, values] of Object.entries(DEFAULT_DEFECT_REFERENCE_VALUES)) {
        for (const value of values) {
          const docRef = refValuesRef.doc(refType).collection('values').doc(value.id);
          batch.set(docRef, {
            ...value,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: context.auth.uid
          });
        }
      }

      await batch.commit();
      return { success: true, message: 'Reference values initialized successfully' };
    } catch (error) {
      console.error('Error in initializeDefectReferenceValues:', error);
      throw new functions.https.HttpsError('internal', `Internal error: ${error.message}`);
    }
  });

// Comment management functions
exports.createDefectComment = functions
  .region('australia-southeast1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
      const { organizationId, projectId, defectId, comment } = data;
      assert(organizationId, 'organizationId is required');
      assert(projectId, 'projectId is required');
      assert(defectId, 'defectId is required');
      assert(comment && comment.trim(), 'comment is required');

      const commentData = {
        text: comment.trim(),
        createdBy: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const commentRef = db.collection('organizations', organizationId, 'projects', projectId, 'defects', defectId, 'comments');
      const newComment = await commentRef.add(commentData);

      // Update defect comment count and last activity
      const defectRef = db.collection('organizations', organizationId, 'projects', projectId, 'defects', defectId);
      await defectRef.update({
        commentCount: admin.firestore.FieldValue.increment(1),
        lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: context.auth.uid
      });

      // Add history event
      const historyRef = defectRef.collection('history');
      await historyRef.add({
        type: 'comment_added',
        field: 'commentCount',
        old: (commentData.commentCount || 0) - 1,
        new: commentData.commentCount || 0,
        at: admin.firestore.FieldValue.serverTimestamp(),
        by: context.auth.uid,
        description: 'Comment added',
        commentId: newComment.id
      });

      return { id: newComment.id, ...commentData };
    } catch (error) {
      console.error('Error in createDefectComment:', error);
      throw new functions.https.HttpsError('internal', `Internal error: ${error.message}`);
    }
  });

exports.updateDefectComment = functions
  .region('australia-southeast1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
      const { organizationId, projectId, defectId, commentId, comment } = data;
      assert(organizationId, 'organizationId is required');
      assert(projectId, 'projectId is required');
      assert(defectId, 'defectId is required');
      assert(commentId, 'commentId is required');
      assert(comment && comment.trim(), 'comment is required');

      const commentRef = db.collection('organizations', organizationId, 'projects', projectId, 'defects', defectId, 'comments', commentId);
      const commentDoc = await commentRef.get();

      if (!commentDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Comment not found');
      }

      const commentData = commentDoc.data();
      if (commentData.createdBy !== context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Can only edit own comments');
      }

      await commentRef.update({
        text: comment.trim(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error in updateDefectComment:', error);
      throw new functions.https.HttpsError('internal', `Internal error: ${error.message}`);
    }
  });

exports.deleteDefectComment = functions
  .region('australia-southeast1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
      const { organizationId, projectId, defectId, commentId } = data;
      assert(organizationId, 'organizationId is required');
      assert(projectId, 'projectId is required');
      assert(defectId, 'defectId is required');
      assert(commentId, 'commentId is required');

      const commentRef = db.collection('organizations', organizationId, 'projects', projectId, 'defects', defectId, 'comments', commentId);
      const commentDoc = await commentRef.get();

      if (!commentDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Comment not found');
      }

      const commentData = commentDoc.data();
      if (commentData.createdBy !== context.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Can only delete own comments');
      }

      await commentRef.delete();

      // Update defect comment count and last activity
      const defectRef = db.collection('organizations', organizationId, 'projects', projectId, 'defects', defectId);
      await defectRef.update({
        commentCount: admin.firestore.FieldValue.increment(-1),
        lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: context.auth.uid
      });

      // Add history event
      const historyRef = defectRef.collection('history');
      await historyRef.add({
        type: 'comment_deleted',
        field: 'commentCount',
        old: (commentData.commentCount || 0) + 1,
        new: commentData.commentCount || 0,
        at: admin.firestore.FieldValue.serverTimestamp(),
        by: context.auth.uid,
        description: 'Comment deleted',
        commentId: commentId
      });

      return { success: true };
    } catch (error) {
      console.error('Error in deleteDefectComment:', error);
      throw new functions.https.HttpsError('internal', `Internal error: ${error.message}`);
    }
  });

// Export defects function
exports.exportDefects = functions
  .region('australia-southeast1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
      const { organizationId, projectId, filters, format = 'csv' } = data;
      assert(organizationId, 'organizationId is required');

      // Build query based on filters
      let query = db.collectionGroup('defects').where('organizationId', '==', organizationId);
      
      if (projectId) {
        query = query.where('projectId', '==', projectId);
      }

      if (filters) {
        if (filters.status) query = query.where('status', '==', filters.status);
        if (filters.severity) query = query.where('severity', '==', filters.severity);
        if (filters.priority) query = query.where('priority', '==', filters.priority);
        if (filters.assignedTo) query = query.where('assignedTo', '==', filters.assignedTo);
      }

      const snapshot = await query.get();
      const defects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Convert to requested format
      let exportData;
      if (format === 'csv') {
        exportData = defects.map(defect => ({
          'Defect ID': defect.key,
          'Title': defect.title,
          'Status': defect.status,
          'Severity': defect.severity,
          'Priority': defect.priority,
          'Assigned To': defect.assignedTo,
          'Project': defect.projectId,
          'Module': defect.folderId,
          'Created': defect.createdAt?.toDate?.() || defect.createdAt,
          'Updated': defect.updatedAt?.toDate?.() || defect.updatedAt,
          'Tags': (defect.tags || []).join('|'),
          'Comments': defect.commentCount || 0,
          'Attachments': defect.attachmentCount || 0
        }));
      } else {
        exportData = defects;
      }

      return { 
        success: true, 
        data: exportData, 
        count: defects.length,
        format: format
      };
    } catch (error) {
      console.error('Error in exportDefects:', error);
      throw new functions.https.HttpsError('internal', `Internal error: ${error.message}`);
    }
  });

// Import defects function
exports.importDefects = functions
  .region('australia-southeast1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    try {
      const { organizationId, projectId, defects, dryRun = false } = data;
      assert(organizationId, 'organizationId is required');
      assert(projectId, 'projectId is required');
      assert(Array.isArray(defects), 'defects must be an array');

      const results = {
        created: 0,
        updated: 0,
        errors: [],
        dryRun: dryRun
      };

      if (dryRun) {
        // Validate without creating
        for (const defect of defects) {
          if (!defect.title || !defect.severity || !defect.priority) {
            results.errors.push(`Defect missing required fields: ${defect.title || 'No title'}`);
          }
        }
        return results;
      }

      // Process defects in batches
      const batch = writeBatch(db);
      let batchCount = 0;
      const maxBatchSize = 500;

      for (const defect of defects) {
        try {
          if (defect.key && defect.key.trim()) {
            // Update existing defect
            const defectQuery = await db.collectionGroup('defects')
              .where('key', '==', defect.key.trim())
              .where('projectId', '==', projectId)
              .limit(1)
              .get();

            if (!defectQuery.empty) {
              const defectDoc = defectQuery.docs[0];
              const updates = {
                title: defect.title || defectDoc.data().title,
                description: defect.description || defectDoc.data().description,
                severity: defect.severity || defectDoc.data().severity,
                priority: defect.priority || defectDoc.data().priority,
                status: defect.status || defectDoc.data().status,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: context.auth.uid
              };

              batch.update(defectDoc.ref, updates);
              results.updated++;
            } else {
              results.errors.push(`Defect with key ${defect.key} not found in project ${projectId}`);
            }
          } else {
            // Create new defect
            const defectData = {
              organizationId,
              projectId,
              title: defect.title,
              description: defect.description || '',
              severity: defect.severity,
              priority: defect.priority,
              status: defect.status || 'open',
              assignedTo: defect.assignedTo || null,
              raisedBy: context.auth.uid,
              reporterId: context.auth.uid,
              folderId: defect.folderId || null,
              tags: defect.tags || [],
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              createdBy: context.auth.uid,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedBy: context.auth.uid
            };

            const defectRef = db.collection('organizations', organizationId, 'projects', projectId, 'defects').doc();
            batch.set(defectRef, defectData);
            results.created++;
          }

          batchCount++;
          if (batchCount >= maxBatchSize) {
            await batch.commit();
            batchCount = 0;
          }
        } catch (error) {
          results.errors.push(`Error processing defect ${defect.title || defect.key}: ${error.message}`);
        }
      }

      // Commit remaining batch
      if (batchCount > 0) {
        await batch.commit();
      }

      return results;
    } catch (error) {
      console.error('Error in importDefects:', error);
      throw new functions.https.HttpsError('internal', `Internal error: ${error.message}`);
    }
  });

// Scheduled purge of archived defects
exports.purgeArchivedDefects = functions
  .region('australia-southeast1')
  .pubsub
  .schedule('0 2 * * *') // Daily at 2 AM
  .onRun(async (context) => {
    try {
      console.log('Starting scheduled purge of archived defects');
      
      // Get all organizations
      const orgsSnapshot = await db.collection('organizations').get();
      let totalPurged = 0;
      
      for (const orgDoc of orgsSnapshot.docs) {
        const organizationId = orgDoc.id;
        const orgData = orgDoc.data();
        
        // Check if org has retention policy
        const retentionDays = orgData.settings?.retention?.defects?.daysToPurge || 60;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        
        // Find archived defects older than retention period
        const archivedDefectsQuery = await db.collectionGroup('defects')
          .where('organizationId', '==', organizationId)
          .where('status', '==', 'archived')
          .where('archivedAt', '<', cutoffDate)
          .get();
        
        if (!archivedDefectsQuery.empty) {
          const batch = writeBatch(db);
          let batchCount = 0;
          const maxBatchSize = 500;
          
          for (const defectDoc of archivedDefectsQuery.docs) {
            const defectData = defectDoc.data();
            
            // Delete comments and history subcollections
            const commentsSnapshot = await defectDoc.ref.collection('comments').get();
            const historySnapshot = await defectDoc.ref.collection('history').get();
            
            commentsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
            historySnapshot.docs.forEach(doc => batch.delete(doc.ref));
            
            // Delete the defect document
            batch.delete(defectDoc.ref);
            
            batchCount++;
            if (batchCount >= maxBatchSize) {
              await batch.commit();
              batchCount = 0;
            }
          }
          
          // Commit remaining batch
          if (batchCount > 0) {
            await batch.commit();
          }
          
          totalPurged += archivedDefectsQuery.size;
          console.log(`Purged ${archivedDefectsQuery.size} archived defects from organization ${organizationId}`);
        }
      }
      
      console.log(`Scheduled purge completed. Total defects purged: ${totalPurged}`);
      return { success: true, totalPurged };
      
    } catch (error) {
      console.error('Error in scheduled purge:', error);
      return { success: false, error: error.message };
    }
  });

