const functions = require('firebase-functions');
const admin = require('firebase-admin');

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

// Normalize TCID for global uniqueness
function normalizeTcid(tcid) {
  return (tcid || '')
    .toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9\-]/g, '')
    .slice(0, 100);
}

// Create a test case with globally unique TCID using an index doc
exports.createTestCaseWithUniqueTcid = functions
  .region('australia-southeast1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { organizationId, projectId, payload } = data || {};
    if (!organizationId || !projectId || !payload) {
      throw new functions.https.HttpsError('invalid-argument', 'organizationId, projectId and payload are required');
    }

    // Validate caller membership/privileges
    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!callerDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'Caller has no user profile');
    }
    const caller = callerDoc.data();
    const callerRoles = Array.isArray(caller.roles) ? caller.roles : [];
    const isAppAdmin = callerRoles.includes('APP_ADMIN');
    const isOrgAdmin = callerRoles.includes('ORG_ADMIN') && caller.organisationId === organizationId;
    const isMember = caller.organisationId === organizationId;
    if (!(isAppAdmin || isOrgAdmin || isMember)) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to create test cases for this organization');
    }

    const tcid = normalizeTcid(payload.tcid);
    if (!tcid) {
      throw new functions.https.HttpsError('invalid-argument', 'Valid tcid is required');
    }

    const indexRef = db.collection('tcidIndex').doc(tcid);
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

    const testCaseDoc = {
      ...payload,
      tcid,
      organizationId,
      projectId,
      folderId,
      createdAt: now,
      createdBy: userId,
    };

    await db.runTransaction(async (tx) => {
      const idx = await tx.get(indexRef);
      if (idx.exists) {
        throw new functions.https.HttpsError('already-exists', 'TCID already exists');
      }

      const newTcRef = tcColRef.doc();
      tx.set(newTcRef, testCaseDoc, { merge: true });
      tx.set(indexRef, {
        organizationId,
        projectId,
        testCaseId: newTcRef.id,
        tcid,
        createdAt: now,
        createdBy: userId,
      });
    });

    return { success: true, tcid };
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

