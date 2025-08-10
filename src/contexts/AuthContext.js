import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserData, isAppAdmin, getOrganizationData } from '../services/authService';
import { getUserById, getAllUsers, getUsersByOrganization } from '../services/userService';
import { organizationService } from '../services/organizationService';
import { projectsService } from '../services/projectsService';
import { USER_ROLES } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('AuthContext: User auth state changed:', user ? user.email : 'null');
      
      if (user) {
        console.log('AuthContext: User signed in:', user.email);
        setCurrentUser(user);
        
        // Reset state to ensure clean start
        setCurrentUserData(null);
        setCurrentOrganization(null);
        setMustChangePassword(false);
        
        try {
          // Get user data from Firestore
          let userData = await getUserData(user.uid);
          console.log('AuthContext: Found user data:', userData);
          
          // If no user data found by UID, the user might not exist or UUID update is in progress
          if (!userData) {
            console.log('AuthContext: No user data found by UID for:', user.uid);
            console.log('This could be normal if the user profile is still being updated');
          }
          
          if (userData) {
            setCurrentUserData(userData);
            
            // Check if user must change password
            if (userData.mustChangePassword) {
              console.log('AuthContext: User must change password');
              setMustChangePassword(true);
            } else {
              setMustChangePassword(false);
            }

            // Set organization if user has one (not for App Admins)
            if (userData.organisationId && !userData.roles.includes(USER_ROLES.APP_ADMIN)) {
              const orgData = await getOrganizationData(userData.organisationId);
              if (orgData) {
                setCurrentOrganization(orgData);
              }
            }
          } else {
            console.log('AuthContext: No user data found, setting to null');
            setCurrentUserData(null);
            setMustChangePassword(false);
          }
        } catch (error) {
          console.error('AuthContext: Error getting user data:', error);
          setCurrentUserData(null);
          setMustChangePassword(false);
        }
      } else {
        console.log('AuthContext: User signed out');
        setCurrentUser(null);
        setCurrentUserData(null);
        setCurrentOrganization(null);
        setMustChangePassword(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      // Clear all state first
      setCurrentUser(null);
      setCurrentUserData(null);
      setCurrentOrganization(null);
      setMustChangePassword(false);
      
      // Then sign out
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Force clear all authentication state (for debugging corrupted states)
  const forceClearAuth = async () => {
    try {
      console.log('AuthContext: Force clearing all authentication state');
      setCurrentUser(null);
      setCurrentUserData(null);
      setCurrentOrganization(null);
      setMustChangePassword(false);
      setLoading(true);
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear any local storage or session data
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('AuthContext: All authentication state cleared');
    } catch (error) {
      console.error('Error force clearing auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = async (organizationId) => {
    if (currentUserData?.roles?.includes(USER_ROLES.ORG_ADMIN)) {
      const org = await organizationService.getOrganization(organizationId);
      setCurrentOrganization(org);
    }
  };

  const getOrganizations = async () => {
    // App Admin: can load all organizations
    if (currentUserData?.roles?.includes(USER_ROLES.APP_ADMIN)) {
      const orgs = await organizationService.getAllOrganizations();
      return orgs.filter(org => org.isActive !== false);
    }

    // Org Admin: restricted to their own organization only
    if (currentUserData?.roles?.includes(USER_ROLES.ORG_ADMIN) && currentUserData?.organisationId) {
      const org = await organizationService.getOrganization(currentUserData.organisationId);
      if (org && org.isActive !== false) {
        return [org];
      }
      return [];
    }

    return [];
  };

  const getAllOrganizations = async () => {
    // App Admin: load all organizations
    if (currentUserData?.roles?.includes(USER_ROLES.APP_ADMIN)) {
      return await organizationService.getAllOrganizations();
    }

    // Org Admin: only their own organization
    if (currentUserData?.roles?.includes(USER_ROLES.ORG_ADMIN) && currentUserData?.organisationId) {
      const org = await organizationService.getOrganization(currentUserData.organisationId);
      return org ? [org] : [];
    }

    return [];
  };

  const getUsers = async (organizationId = null) => {
    try {
      if (currentUserData?.roles?.includes(USER_ROLES.APP_ADMIN)) {
        // App Admin can see all users or filter by organization
        if (organizationId) {
          return await getUsersByOrganization(organizationId);
        } else {
          return await getAllUsers();
        }
      } else if (currentUserData?.roles?.includes(USER_ROLES.ORG_ADMIN)) {
        // Org Admin can only see users in their organization
        return await getUsersByOrganization(currentUserData.organisationId);
      }
      return [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  };

  // Organization management functions
  const createOrganization = async (orgData) => {
    try {
      const newOrg = await organizationService.createOrganization(orgData, currentUserData.userId);
      return newOrg;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  };

  const updateOrganization = async (orgId, updatedData) => {
    try {
      await organizationService.updateOrganization(orgId, updatedData);
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  };

  const deleteOrganization = async (orgId) => {
    try {
      console.log('Deleting organization with ID:', orgId);
      
      // Perform soft delete in Firestore database
      await organizationService.deleteOrganization(orgId);
      console.log('Organization soft deleted successfully in Firestore');
    } catch (error) {
      console.error('Error deleting organization:', error);
      throw error;
    }
  };

  const getProjects = async (organizationId = null, { includeInactive = false } = {}) => {
    try {
      return await projectsService.getProjectsForUser(currentUserData, { organizationId, includeInactive });
    } catch (error) {
      console.error('Error loading projects:', error);
      return [];
    }
  };

  const getAllProjects = async ({ includeInactive = false } = {}) => {
    try {
      return await projectsService.getAllProjectsForAdmin(currentUserData, { includeInactive });
    } catch (error) {
      console.error('Error loading all projects:', error);
      return [];
    }
  };

  const createProject = async (organizationId, projectData) => {
    try {
      return await projectsService.createProject(currentUserData, organizationId, projectData);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const updateProject = async (organizationId, projectId, updatedData) => {
    try {
      await projectsService.updateProject(currentUserData, organizationId, projectId, updatedData);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (organizationId, projectId) => {
    try {
      // Soft delete: set INACTIVE
      await projectsService.deactivateProject(currentUserData, organizationId, projectId);
    } catch (error) {
      console.error('Error deactivating project:', error);
      throw error;
    }
  };

  const createUser = async (userData) => {
    try {
      // This will be handled by the UserForm component using userService
      // For now, return a placeholder
      console.log('User creation handled by UserForm component');
      return { success: true };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const updateUserById = async (userId, updatedData) => {
    try {
      const { updateUser } = await import('../services/userService');
      return await updateUser(userId, updatedData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUserById = async (userId) => {
    try {
      const { deleteUserById } = await import('../services/userService');
      return await deleteUserById(userId);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    currentUserData,
    currentOrganization,
    loading,
    mustChangePassword,
    setMustChangePassword,
    logout,
    users,
    projects,
    switchOrganization,
    getOrganizations,
    getAllOrganizations,
    getUsers,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getProjects,
    getAllProjects,
    createProject,
    updateProject,
    deleteProject,
    createUser,
    updateUserById,
    deleteUserById,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
