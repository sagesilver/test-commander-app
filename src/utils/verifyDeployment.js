// Verification utility for Test Commander deployment
// This helps verify that the authentication and database setup is working correctly

import { auth, db } from "../services/firebase";
import { doc, getDoc, collection, getDocs, query, limit } from "firebase/firestore";

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

    // 2. Check Firestore Connection (via allowed read)
    console.log('2. Checking Firestore connection...');
    try {
      if (currentUser) {
        // Read own user doc; permitted by rules if auth is valid
        await getDoc(doc(db, 'users', currentUser.uid));
      } else {
        // Fallback: attempt a benign read (may be denied by rules when signed out)
        await getDoc(doc(db, '__healthcheck__', 'ping'));
      }
      results.firestore = true;
      console.log('✅ Firestore: Connection successful');
    } catch (error) {
      console.log('❌ Firestore: Connection failed', error.message);
      results.errors.push(`Firestore connection failed: ${error.message}`);
    }

    // 3. Check App Admin Role on user record
    console.log('3. Checking app admin record...');
    if (currentUser) {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const data = userDoc.exists() ? userDoc.data() : null;
        let isAdmin = false;
        if (data) {
          const roles = data.roles;
          if (Array.isArray(roles)) {
            isAdmin = roles.includes("APP_ADMIN");
          } else if (roles && typeof roles === 'object') {
            isAdmin = roles.APP_ADMIN === true || Object.prototype.hasOwnProperty.call(roles, 'APP_ADMIN');
          } else if (typeof roles === 'string') {
            isAdmin = roles === 'APP_ADMIN';
          }
        }
        if (isAdmin) {
          results.appAdmin = true;
          console.log('✅ App Admin: Role found on user');
        } else {
          console.log('ℹ️ App Admin: Role not found on user');
        }
      } catch (error) {
        console.log('❌ App Admin: Error checking user record', error.message);
        results.errors.push(`App admin check failed: ${error.message}`);
      }
    }

    // 4. Check accessible collections (sample reads)
    console.log('4. Checking accessible collections...');
    try {
      const accessible = [];
      if (currentUser) {
        // User doc was readable above; consider 'users' accessible
        accessible.push('users');
      }
      if (results.appAdmin) {
        // As app admin, attempt to read organizations
        await getDocs(query(collection(db, 'organizations'), limit(1)));
        accessible.push('organizations');
      }
      results.collections = accessible;
      console.log('✅ Collections accessible:', accessible);
    } catch (error) {
      console.log('ℹ️ Collections: Limited access', error.message);
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
