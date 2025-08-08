// Browser console function to reset a user's password
// Usage: window.resetUserPassword('admin@testinternals.com')

import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { db, auth } from '../services/firebase';

window.resetUserPassword = async (email) => {
  try {
    console.log(`Attempting to reset password for: ${email}`);
    
    // Find the user by email
    const usersQuery = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
    const usersSnapshot = await getDocs(usersQuery);
    
    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();
      
      // Update the user document to force password change
      await updateDoc(doc(db, 'users', userDoc.id), {
        mustChangePassword: true,
        updatedAt: new Date()
      });
      
      console.log(`✅ Firestore updated for user: ${userData.name} (${email})`);
      console.log(`📧 Email: ${email}`);
      console.log(`🆔 User ID: ${userDoc.id}`);
      console.log(`⚠️  Note: Firebase Auth password cannot be reset from browser console`);
      console.log(`🔑 The user should try logging in with TempPass123! or contact admin to reset Firebase Auth password`);
      
    } else {
      console.log('❌ No user found with that email');
    }
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  }
};

export default window.resetUserPassword;
