const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
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

async function setupUsersCollection() {
  try {
    console.log('🚀 Setting up users collection...');

    // Create the App Admin user
    const appAdminData = {
      userId: 'testinternals@gmail.com',
      email: 'testinternals@gmail.com',
      name: 'Test Commander Super User',
      roles: ['APP_ADMIN'],
      organisationId: null,
      isActive: true,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      profile: {
        avatar: '',
        department: 'System Administration',
        position: 'App Administrator'
      },
      permissions: [
        'manage_organizations',
        'manage_users',
        'manage_projects',
        'manage_test_cases',
        'manage_defects',
        'view_reports',
        'system_settings'
      ]
    };

    // Add App Admin to users collection
    await setDoc(doc(db, 'users', appAdminData.userId), appAdminData);

    console.log('✅ Users collection created successfully!');
    console.log('✅ App Admin user added:');
    console.log('   Email:', appAdminData.email);
    console.log('   Roles:', appAdminData.roles);
    console.log('   Document ID:', appAdminData.userId);
  } catch (error) {
    console.error('❌ Error setting up users collection:', error);
    console.error('Error details:', error.message);
  }
}

// Run the script
setupUsersCollection();

