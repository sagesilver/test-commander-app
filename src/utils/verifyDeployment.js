// Verification utility for Test Commander deployment
// This helps verify that the authentication and database setup is working correctly

import { auth, db } from "../services/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

export const verifyDeployment = async () => {
  const results = {
    authentication: false,
    firestore: false,
    appAdmin: false,
    collections: [],
    errors: []
  };

  try {
    console.log('🔍 Starting deployment verification...');

    // 1. Check Authentication
    console.log('1. Checking Firebase Authentication...');
    const currentUser = auth.currentUser;
    if (currentUser) {
      results.authentication = true;
      console.log('✅ Authentication: User is signed in as', currentUser.email);
    } else {
      console.log('❌ Authentication: No user signed in');
      results.errors.push('No authenticated user found');
    }

    // 2. Check Firestore Connection
    console.log('2. Checking Firestore connection...');
    try {
      // Try to read from a test document
      const testDoc = await getDoc(doc(db, 'test', 'connection'));
      results.firestore = true;
      console.log('✅ Firestore: Connection successful');
    } catch (error) {
      console.log('❌ Firestore: Connection failed', error.message);
      results.errors.push(`Firestore connection failed: ${error.message}`);
    }

    // 3. Check App Admin Record
    console.log('3. Checking app admin record...');
    if (currentUser) {
      try {
        // Check by userId
        let appAdminDoc = await getDoc(doc(db, "appAdmins", currentUser.uid));
        
        // If not found, check by email
        if (!appAdminDoc.exists()) {
          appAdminDoc = await getDoc(doc(db, "appAdmins", currentUser.email));
        }
        
        if (appAdminDoc.exists()) {
          results.appAdmin = true;
          console.log('✅ App Admin: Record found');
        } else {
          console.log('❌ App Admin: No record found');
          results.errors.push('App admin record not found');
        }
      } catch (error) {
        console.log('❌ App Admin: Error checking record', error.message);
        results.errors.push(`App admin check failed: ${error.message}`);
      }
    }

    // 4. List Available Collections
    console.log('4. Checking available collections...');
    try {
      const collections = await getDocs(collection(db, ''));
      const collectionNames = [];
      collections.forEach(doc => {
        collectionNames.push(doc.id);
      });
      results.collections = collectionNames;
      console.log('✅ Collections found:', collectionNames);
    } catch (error) {
      console.log('❌ Collections: Error listing collections', error.message);
      results.errors.push(`Collection listing failed: ${error.message}`);
    }

    // 5. Summary
    console.log('\n📊 Verification Summary:');
    console.log('Authentication:', results.authentication ? '✅' : '❌');
    console.log('Firestore:', results.firestore ? '✅' : '❌');
    console.log('App Admin:', results.appAdmin ? '✅' : '❌');
    console.log('Collections:', results.collections.length > 0 ? '✅' : '❌');
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors found:');
      results.errors.forEach(error => console.log('-', error));
    } else {
      console.log('\n🎉 All checks passed! Deployment is ready.');
    }

    return results;

  } catch (error) {
    console.error('💥 Verification failed:', error);
    results.errors.push(`Verification failed: ${error.message}`);
    return results;
  }
};

// Make it available globally for console access
if (typeof window !== 'undefined') {
  window.verifyTestCommanderDeployment = verifyDeployment;
  console.log('🔧 Verification function available as: window.verifyTestCommanderDeployment()');
}

export default verifyDeployment;
