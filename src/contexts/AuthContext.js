import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserData, isAppAdmin, getOrganizationData } from '../services/authService';
import { getUserById, getAllUsers, getUsersByOrganization } from '../services/userService';
import { organizationService } from '../services/organizationService';
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
    // Load organizations directly from database
    if (currentUserData?.roles?.includes(USER_ROLES.APP_ADMIN)) {
      const orgs = await organizationService.getAllOrganizations();
      return orgs.filter(org => org.isActive !== false);
    } else if (currentUserData?.organisationId) {
      const orgs = await organizationService.getAllOrganizations();
      return orgs.filter(o => o.organisationId === currentUserData.organisationId && o.isActive !== false);
    }
    return [];
  };

  const getAllOrganizations = async () => {
    // Load all organizations directly from database
    if (currentUserData?.roles?.includes(USER_ROLES.APP_ADMIN)) {
      return await organizationService.getAllOrganizations();
    } else if (currentUserData?.organisationId) {
      const orgs = await organizationService.getAllOrganizations();
      return orgs.filter(o => o.organisationId === currentUserData.organisationId);
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

  const getProjects = (organizationId = null) => {
    if (currentUserData?.role === USER_ROLES.APP_ADMIN) {
      return organizationId 
        ? projects.filter(p => p.organisationId === organizationId)
        : projects;
    } else if (currentUserData?.roles?.includes(USER_ROLES.ORG_ADMIN)) {
      return projects.filter(p => p.organisationId === currentUserData.organisationId);
    }
    return [];
  };

  const createProject = (projectData) => {
    const newProject = {
      projectId: `proj${Date.now()}`,
      ...projectData,
      createdBy: currentUser.userId,
      createdAt: new Date().toISOString(),
      isActive: true,
      members: [
        { userId: currentUser.userId, roles: ['PROJECT_MANAGER'], addedAt: new Date().toISOString() }
      ],
      settings: {
        customFields: [],
        workflows: [],
        testModel: {}
      }
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    localStorage.setItem('testCommander_projects', JSON.stringify(updatedProjects));
    return newProject;
  };

  const updateProject = (projectId, updatedData) => {
    const updatedProjects = projects.map(project =>
      project.projectId === projectId ? { ...project, ...updatedData } : project
    );
    setProjects(updatedProjects);
    localStorage.setItem('testCommander_projects', JSON.stringify(updatedProjects));
  };

  const deleteProject = (projectId) => {
    const updatedProjects = projects.filter(project => project.projectId !== projectId);
    setProjects(updatedProjects);
    localStorage.setItem('testCommander_projects', JSON.stringify(updatedProjects));
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
