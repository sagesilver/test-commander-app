import { fetchSignInMethodsForEmail, sendPasswordResetEmail } from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, functions } from "./firebase";
import { httpsCallable } from "firebase/functions";
import { USER_ROLES } from "./authService";

// User creation with Firebase Auth and Firestore
export const createUser = async (userData, createdBy) => {
  try {
    console.log('createUser called with:', { userData, createdBy });
    
    const {
      email,
      name,
      roles,
      organisationId,
      profile = {},
      isActive = true,
    } = userData;

    // Validate required fields
    if (!email || !name || !roles || !organisationId) {
      throw new Error("Missing required fields: email, name, roles, organisationId");
    }

    // Validate roles
    const validRoles = Object.values(USER_ROLES);
    const invalidRoles = roles.filter(role => !validRoles.includes(role));
    if (invalidRoles.length > 0) {
      throw new Error(`Invalid roles: ${invalidRoles.join(", ")}`);
    }

    console.log('Checking if user exists in Firebase Auth for:', email);

    // Optional pre-check for clearer error before server call
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    if (signInMethods.length > 0) {
      // Ensure not already present in our Firestore as well
      const existingUsersQuery = query(
        collection(db, "users"),
        where("email", "==", email.toLowerCase())
      );
      const existingUsersSnapshot = await getDocs(existingUsersQuery);
      if (!existingUsersSnapshot.empty) {
        throw new Error("A user with this email already exists in the system.");
      }
    }

    // Call secure Cloud Function to create the user
    const createUserAndInvite = httpsCallable(functions, 'createUserAndInvite');
    console.log('Calling Cloud Function with data:', {
      email: email.toLowerCase(),
      name,
      roles,
      organisationId,
      isActive,
      profile,
      createdBy,
    });
    
    const result = await createUserAndInvite({
      email: email.toLowerCase(),
      name,
      roles,
      organisationId,
      isActive,
      profile,
      createdBy,
    });
    
    console.log('Cloud Function response:', result);
    console.log('Cloud Function data:', result.data);
    
    if (!result.data) {
      throw new Error('Cloud Function returned no data');
    }
    
    const { data } = result;

    // Trigger password reset email from client-side (Firebase's intended flow)
    try {
      const actionCodeSettings = {
        url: 'https://test-commander-project.web.app/',
        handleCodeInApp: true,
      };
      
      await sendPasswordResetEmail(auth, email.toLowerCase(), actionCodeSettings);
      console.log('Password reset email sent successfully');
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // Don't fail the entire operation if email fails
      // The user can still be created and email can be sent manually later
    }

    const response = {
      success: true,
      user: data.user,
      message: data.message || 'User profile created successfully. Password reset email sent.',
    };
    console.log('Returning response to client:', response);
    return response;
  } catch (error) {
    console.error("Error creating user:", error);
    
    if (error.code === "auth/email-already-in-use") {
      throw new Error("A user with this email already exists in the system. Please use a different email for this organization or contact support to link organizations.");
    } else if (error.code === "auth/weak-password") {
      throw new Error("Password is too weak. Please use at least 6 characters");
    } else if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email address");
    } else {
      throw new Error(`Failed to create user: ${error.message || error}`);
    }
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
};

// Get users by organization
export const getUsersByOrganization = async (organisationId) => {
  try {
    const usersQuery = query(
      collection(db, "users"),
      where("organisationId", "==", organisationId)
    );
    
    const querySnapshot = await getDocs(usersQuery);
    const users = [];
    
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    return users;
  } catch (error) {
    console.error("Error getting users by organization:", error);
    throw error;
  }
};

// Get all users (for App Admin)
export const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = [];
    
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    return users;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
};

// Update user
export const updateUser = async (userId, updateData) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Delete user
export const deleteUserById = async (userId) => {
  try {
    // Delete from Firestore
    await deleteDoc(doc(db, "users", userId));
    
    // Note: Firebase Auth user deletion requires re-authentication
    // This should be handled separately if needed
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

// Force password change
export const forcePasswordChange = async (userId, newPassword) => {
  try {
    // This would typically be done by the user themselves
    // For admin-initiated password changes, we'd need a different approach
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      mustChangePassword: false,
      updatedAt: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating password change flag:", error);
    throw error;
  }
};

// Check if user must change password
export const checkPasswordChangeRequired = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data().mustChangePassword || false;
    }
    return false;
  } catch (error) {
    console.error("Error checking password change requirement:", error);
    return false;
  }
};

// Update last login time
export const updateLastLogin = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating last login:", error);
    // Don't throw error for this as it's not critical
  }
};

// Validate user permissions for creating other users
export const validateUserCreationPermissions = (currentUserRoles, targetUserRoles, currentUserOrgId, targetUserOrgId) => {
  // App Admin can create any user in any organization
  if (currentUserRoles.includes(USER_ROLES.APP_ADMIN)) {
    return true;
  }
  
  // Org Admin can only create users in their own organization
  if (currentUserRoles.includes(USER_ROLES.ORG_ADMIN)) {
    if (currentUserOrgId !== targetUserOrgId) {
      return false;
    }
    
    // Org Admin cannot create App Admins
    if (targetUserRoles.includes(USER_ROLES.APP_ADMIN)) {
      return false;
    }
    
    return true;
  }
  
  return false;
};

// Get available roles based on current user permissions
export const getAvailableRoles = (currentUserRoles) => {
  const allRoles = [
    { value: USER_ROLES.APP_ADMIN, label: "App Administrator", description: "System-wide access" },
    { value: USER_ROLES.ORG_ADMIN, label: "Organization Administrator", description: "Organization-level access" },
    { value: USER_ROLES.ANALYST, label: "Analyst", description: "Test analysis and design" },
    { value: USER_ROLES.TEST_ENGINEER, label: "Test Engineer", description: "Test execution and results" },
    { value: USER_ROLES.DEFECT_COORDINATOR, label: "Defect Coordinator", description: "Defect management" },
  ];
  
  // App Admin can assign any role
  if (currentUserRoles.includes(USER_ROLES.APP_ADMIN)) {
    return allRoles;
  }
  
  // Org Admin can assign all roles except App Admin
  if (currentUserRoles.includes(USER_ROLES.ORG_ADMIN)) {
    return allRoles.filter(role => role.value !== USER_ROLES.APP_ADMIN);
  }
  
  return [];
};
