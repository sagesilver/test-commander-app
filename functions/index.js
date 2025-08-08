const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Admin SDK once
try {
  admin.app();
} catch (e) {
  admin.initializeApp();
}

const db = admin.firestore();

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
