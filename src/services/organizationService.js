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
    // Users: count total and active from top-level users collection
    let totalUsers = 0;
    let activeUsers = 0;
    try {
      const usersQueryAll = query(
        collection(db, 'users'),
        where('organisationId', '==', orgId)
      );
      const usersSnap = await getDocs(usersQueryAll);
      totalUsers = usersSnap.size;
      usersSnap.forEach((docSnap) => {
        const data = docSnap.data() || {};
        if (data.isActive !== false) activeUsers += 1;
      });
    } catch (_ignored) {
      totalUsers = 0;
      activeUsers = 0;
    }

    // Projects: nested under organizations/{orgId}/projects
    let totalProjects = 0;
    let activeProjects = 0;
    try {
      const projCol = collection(db, 'organizations', orgId, 'projects');
      const projSnap = await getDocs(projCol);
      totalProjects = projSnap.size;
      projSnap.forEach((docSnap) => {
        const p = docSnap.data() || {};
        const status = String(p.status || 'ACTIVE').toUpperCase();
        const isActive = p.isActive !== false && status !== 'INACTIVE';
        if (isActive) activeProjects += 1;
      });
    } catch (_ignored) {
      totalProjects = 0;
      activeProjects = 0;
    }

    return {
      totalUsers,
      totalProjects,
      activeUsers,
      activeProjects,
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
