const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

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
        avatar: "",
        department: "System Administration",
        position: "App Administrator"
      },
      permissions: [
        "manage_organizations",
        "manage_users", 
        "manage_projects",
        "manage_test_cases",
        "manage_defects",
        "view_reports",
        "system_settings"
      ]
    };

    // Add App Admin to users collection
    await setDoc(doc(db, "users", appAdminData.userId), appAdminData);
    
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

