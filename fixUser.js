const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, serverTimestamp } = require('firebase/firestore');
require('dotenv').config();

// Validate required environment variables for Node scripts
const requiredEnv = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID'
];

const missing = requiredEnv.filter((k) => !process.env[k] && !process.env[`REACT_APP_${k}`]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Create a .env file based on .env.example and populate these values.');
  process.exit(1);
}

// Firebase configuration from environment variables (supports both FIREBASE_* and REACT_APP_FIREBASE_*)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID || process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixUser() {
  try {
    console.log('🔧 Fixing user document for sagesilver@live.com.au...');

    // Get the existing user document (created with email as ID)
    const emailDoc = await getDoc(doc(db, 'users', 'sagesilver@live.com.au'));

    if (!emailDoc.exists()) {
      console.log('❌ User document not found');
      return;
    }

    const userData = emailDoc.data();
    console.log('📄 Found user data:', userData);

    // Create the same document with Firebase Auth UID as ID (temporary UID)
    const fixedUserData = {
      ...userData,
      permissions: [
        'manage_organizations',
        'manage_users',
        'manage_projects',
        'manage_test_cases',
        'manage_defects',
        'view_reports',
        'system_settings'
      ],
      updatedAt: serverTimestamp()
    };

    // Create with a temporary UID that will be updated on login
    const tempUid = `temp_${Date.now()}`;
    await setDoc(doc(db, 'users', tempUid), fixedUserData);

    console.log('✅ Created backup document with temp UID:', tempUid);
    console.log('✅ User should now be able to login and access the system');
    console.log('📝 Note: The Cloud Function will create the proper UID document on next login');
  } catch (error) {
    console.error('❌ Error fixing user:', error);
  }
}

// Run the script
fixUser();
