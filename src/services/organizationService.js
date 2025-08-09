import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export const organizationService = {
  // Create new organization
  async createOrganization(orgData, appAdminId) {
    const orgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const orgDoc = {
      organisationId: orgId,
      name: orgData.name,
      description: orgData.description,
      contactInfo: {
        address: orgData.contactInfo?.address || '',
        phone: orgData.contactInfo?.phone || '',
        website: orgData.contactInfo?.website || '',
        email: orgData.contactInfo?.email || ''
      },
      orgAdminId: orgData.orgAdminId || null,
      createdBy: appAdminId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: orgData.isActive !== false,
      settings: {
        defaultUserRole: 'TEST_ENGINEER',
        maxUsers: 100,
        maxProjects: 50,
        customFields: [],
        workflows: [],
        branding: {
          logo: '',
          primaryColor: '#3762c4',
          customCss: ''
        },
        ...orgData.settings
      },
      subscription: {
        plan: 'free',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        features: ['basic_testing', 'defect_management'],
        limits: {
          users: 10,
          projects: 5,
          storage: 1 // GB
        },
        ...orgData.subscription
      },
      metadata: {
        industry: orgData.metadata?.industry || '',
        size: orgData.metadata?.size || 'medium',
        region: orgData.metadata?.region || '',
        timezone: orgData.metadata?.timezone || 'UTC'
      }
    };
    
    await setDoc(doc(db, 'organizations', orgId), orgDoc);
    return orgDoc;
  },
  
  // Get organization by ID
  async getOrganization(orgId) {
    const docRef = doc(db, 'organizations', orgId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  },
  
  // Get all organizations (for App Admin)
  async getAllOrganizations() {
    const q = query(
      collection(db, 'organizations'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },
  
  // Get organizations by user (for Org Admin)
  async getOrganizationsByUser(userId) {
    const q = query(
      collection(db, 'organizations'),
      where('orgAdminId', '==', userId),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },
  
  // Update organization
  async updateOrganization(orgId, updatedData) {
    const docRef = doc(db, 'organizations', orgId);
    await updateDoc(docRef, {
      ...updatedData,
      updatedAt: serverTimestamp()
    });
  },
  
  // Delete organization (soft delete)
  async deleteOrganization(orgId) {
    const docRef = doc(db, 'organizations', orgId);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: serverTimestamp()
    });
  },
  
  // Get organization statistics
  async getOrganizationStats(orgId) {
    let usersCount = 0;
    let projectsCount = 0;

    // Try with active filter first; if index/permission issues occur, fall back safely
    try {
      try {
        const usersQueryActive = query(
          collection(db, 'users'),
          where('organisationId', '==', orgId),
          where('isActive', '==', true)
        );
        const usersSnapshotActive = await getDocs(usersQueryActive);
        usersCount = usersSnapshotActive.size;
      } catch (inner) {
        const usersQuery = query(
          collection(db, 'users'),
          where('organisationId', '==', orgId)
        );
        const usersSnapshot = await getDocs(usersQuery);
        usersCount = usersSnapshot.size;
      }
    } catch (_ignored) {
      usersCount = 0; // permission denied or other error
    }

    try {
      try {
        const projectsQueryActive = query(
          collection(db, 'projects'),
          where('organisationId', '==', orgId),
          where('isActive', '==', true)
        );
        const projectsSnapshotActive = await getDocs(projectsQueryActive);
        projectsCount = projectsSnapshotActive.size;
      } catch (inner) {
        const projectsQuery = query(
          collection(db, 'projects'),
          where('organisationId', '==', orgId)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        projectsCount = projectsSnapshot.size;
      }
    } catch (_ignored) {
      projectsCount = 0; // permission denied or other error; safe default
    }

    return {
      totalUsers: usersCount,
      totalProjects: projectsCount,
      activeUsers: usersCount,
      activeProjects: projectsCount,
    };
  },

  // Check if organization exists
  async organizationExists(orgId) {
    const docRef = doc(db, 'organizations', orgId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  },

  // Get organization by name (for validation)
  async getOrganizationByName(name) {
    const q = query(
      collection(db, 'organizations'),
      where('name', '==', name),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    }
    return null;
  }
};
