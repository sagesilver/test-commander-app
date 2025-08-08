// Browser console function to test user data
// Usage: window.testUser('admin@testinternals.com')

import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

window.testUser = async (email) => {
  try {
    console.log(`Testing user data for: ${email}`);
    console.log('Current auth user:', auth.currentUser);
    
    if (!auth.currentUser) {
      console.log('❌ No authenticated user. Please log in first.');
      return;
    }
    
    // Find the user by email
    const usersQuery = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
    const usersSnapshot = await getDocs(usersQuery);
    
    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();
      console.log('✅ User found:');
      console.log('📧 Email:', userData.email);
      console.log('👤 Name:', userData.name);
      console.log('🆔 User ID:', userDoc.id);
      console.log('🔑 mustChangePassword:', userData.mustChangePassword);
      console.log('🏢 Organisation ID:', userData.organisationId);
      console.log('📅 Created:', userData.createdAt);
      console.log('📅 Last Login:', userData.lastLoginAt);
      console.log('🎭 Roles:', userData.roles);
      console.log('📋 Full user data:', userData);
    } else {
      console.log('❌ No user found with that email');
    }
    
  } catch (error) {
    console.error('❌ Error testing user:', error);
  }
};

// Simple function to check current auth state
window.checkAuth = () => {
  console.log('Current auth user:', auth.currentUser);
  console.log('Auth state:', auth.currentUser ? 'Authenticated' : 'Not authenticated');
  if (auth.currentUser) {
    console.log('User email:', auth.currentUser.email);
    console.log('User UID:', auth.currentUser.uid);
  }
};

// Check current user's own data
window.checkMyData = async () => {
  try {
    if (!auth.currentUser) {
      console.log('❌ No authenticated user. Please log in first.');
      return;
    }
    
    console.log('Checking current user data for:', auth.currentUser.email);
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('✅ Current user data:');
      console.log('📧 Email:', userData.email);
      console.log('👤 Name:', userData.name);
      console.log('🎭 Roles:', userData.roles);
      console.log('🏢 Organisation ID:', userData.organisationId);
      console.log('📋 Full data:', userData);
    } else {
      console.log('❌ No user document found for current user');
    }
    
  } catch (error) {
    console.error('❌ Error checking current user data:', error);
  }
};
