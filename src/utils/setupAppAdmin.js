// Utility function to set up app admin record for Test Commander
// This should be run after the user has successfully authenticated with Google

import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";

export const setupTestCommanderAppAdmin = async () => {
  try {
    console.log('Setting up app admin...');
    
    // Wait for auth state to be ready
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe(); // Stop listening
        
        if (!user) {
          reject(new Error('No authenticated user found. Please sign in first.'));
          return;
        }

        try {
          console.log('Setting up app admin for:', user.email);

          // Create app admin record in users collection
          const userData = {
            userId: user.uid,
            email: user.email,
            name: user.displayName || "Test Commander Super User",
            roles: ["APP_ADMIN"],
            organisationId: null, // App admin has access to all organizations
            isActive: true,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            profile: {
              avatar: user.photoURL || "",
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

          // Store in users collection
          await setDoc(doc(db, "users", user.uid), userData);
          
          console.log('App admin record created successfully for:', user.email);
          
          // Reload the page to update authentication state
          window.location.reload();
          
          resolve({ success: true, data: userData });
        } catch (error) {
          console.error('Error creating app admin record:', error);
          reject(error);
        }
      });
    });
    
  } catch (error) {
    console.error('Error setting up app admin:', error);
    throw error;
  }
};

// Make it available globally for console access
if (typeof window !== 'undefined') {
  window.setupTestCommanderAppAdmin = setupTestCommanderAppAdmin;
}

export default setupTestCommanderAppAdmin;
