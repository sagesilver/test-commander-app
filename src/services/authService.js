import {
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { updateLastLogin } from "./userService";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";

// User roles
export const USER_ROLES = {
  APP_ADMIN: "APP_ADMIN",
  ORG_ADMIN: "ORG_ADMIN",
  ANALYST: "ANALYST",
  TEST_ENGINEER: "TEST_ENGINEER",
  DEFECT_COORDINATOR: "DEFECT_COORDINATOR",
};

// Authentication functions
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Check if user exists in Firestore
    const userData = await getUserData(user.uid);
    if (!userData) {
      throw new Error('User not found. Please contact your administrator.');
    }
    
    // Check if user is active
    if (!userData.isActive) {
      throw new Error('User account is inactive. Please contact your administrator.');
    }
    
    // Update last login time
    await updateLastLogin(user.uid);
    
    return { user: userCredential.user };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      throw new Error('User not found. Please contact your administrator.');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Invalid email or password.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed login attempts. Please try again later.');
    } else {
      throw new Error('Login failed. Please try again.');
    }
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// User data management
export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    throw error;
  }
};

// Create App Admin user (for Google OAuth users)
export const createAppAdminUser = async (email, name) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }
    
    const userDoc = {
      userId: currentUser.uid,
      email,
      name,
      roles: [USER_ROLES.APP_ADMIN],
      organisationId: null, // App admin has access to all organizations
      isActive: true,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      profile: {
        avatar: currentUser.photoURL || "",
        department: "System Administration",
        position: "App Administrator"
      }
    };
    
    // Store in users collection
    await setDoc(doc(db, "users", currentUser.uid), userDoc);
    
    return { userData: userDoc };
  } catch (error) {
    throw error;
  }
};

// Organization management
export const getOrganizationData = async (organizationId) => {
  try {
    const orgDoc = await getDoc(doc(db, "organizations", organizationId));
    if (orgDoc.exists()) {
      return { id: orgDoc.id, ...orgDoc.data() };
    }
    return null;
  } catch (error) {
    throw error;
  }
};

// Check if user is App Admin
export const isAppAdmin = async (userId) => {
  try {
    const userData = await getUserData(userId);
    return userData && userData.roles && userData.roles.includes(USER_ROLES.APP_ADMIN);
  } catch (error) {
    console.error('Error checking app admin status:', error);
    return false;
  }
};


