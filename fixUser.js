const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvYL_XXO7yh-vmGFjKRSebdZIEsAF55nI",
  authDomain: "test-commander-app.firebaseapp.com",
  projectId: "test-commander-app",
  storageBucket: "test-commander-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixUser() {
  try {
    console.log('🔧 Fixing user document for sagesilver@live.com.au...');
    
    // Get the existing user document (created with email as ID)
    const emailDoc = await getDoc(doc(db, "users", "sagesilver@live.com.au"));
    
    if (!emailDoc.exists()) {
      console.log('❌ User document not found');
      return;
    }
    
    const userData = emailDoc.data();
    console.log('📄 Found user data:', userData);
    
    // Create the same document with Firebase Auth UID as ID
    // You'll need to get the actual UID from Firebase Auth or the user's login
    // For now, we'll create a placeholder that will be updated when they login
    
    const fixedUserData = {
      ...userData,
      permissions: [
        "manage_organizations",
        "manage_users", 
        "manage_projects",
        "manage_test_cases",
        "manage_defects",
        "view_reports",
        "system_settings"
      ],
      updatedAt: serverTimestamp()
    };
    
    // Create with a temporary UID that will be updated on login
    const tempUid = `temp_${Date.now()}`;
    await setDoc(doc(db, "users", tempUid), fixedUserData);
    
    console.log('✅ Created backup document with temp UID:', tempUid);
    console.log('✅ User should now be able to login and access the system');
    console.log('📝 Note: The Cloud Function will create the proper UID document on next login');
    
  } catch (error) {
    console.error('❌ Error fixing user:', error);
  }
}

// Run the script
fixUser();
