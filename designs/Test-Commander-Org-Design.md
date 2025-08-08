# Test Commander: Organizations Design & Implementation Plan

## 1. Overview

This document outlines the complete design and implementation plan for Organizations support in Test Commander, covering both Firestore database schema and React application components. The plan follows the multi-tenant architecture defined in the PRD and Data Model.

---

## 2. Firestore Database Schema

### 2.1 Collections Structure
Firestore Root
├── appAdmins/ # App Admin users
├── organizations/ # Organization entities
├── users/ # All users (org-scoped)
├── projects/ # Projects (org-scoped)
├── testCases/ # Test cases (project-scoped)
├── defects/ # Defects/issues (project-scoped)
├── testSchedules/ # Test schedules (project-scoped)
├── releases/ # Releases/sprints (project-scoped)
├── auditLogs/ # System-wide audit trail
└── systemSettings/ # Global system configuration

### 2.2 Organization Collection Schema

```javascript
// Collection: organizations
{
  organisationId: string,          // Auto-generated unique ID
  name: string,                    // Organization name
  description: string,             // Organization description
  contactInfo: {
    address: string,
    phone: string,
    website: string,
    email: string
  },
  orgAdminId: string,              // Reference to org admin user
  createdBy: string,               // App Admin who created it
  createdAt: timestamp,
  updatedAt: timestamp,
  isActive: boolean,               // Soft delete flag
  settings: {
    defaultUserRole: string,       // Default role for new users
    maxUsers: number,              // User limit
    maxProjects: number,           // Project limit
    customFields: array,           // Custom field definitions
    workflows: array,              // Workflow templates
    branding: {
      logo: string,                // Logo URL
      primaryColor: string,        // Brand color
      customCss: string            // Custom styling
    }
  },
  subscription: {
    plan: string,                  // "free", "basic", "premium", "enterprise"
    startDate: timestamp,
    endDate: timestamp,
    features: array,               // Enabled features
    limits: {
      users: number,
      projects: number,
      storage: number              // GB limit
    }
  },
  metadata: {
    industry: string,
    size: string,                  // "small", "medium", "large"
    region: string,
    timezone: string
  }
}
```

### 2.3 User Collection Schema (Updated)

```javascript
// Collection: users
{
  userId: string,                  // Firebase Auth UID
  organisationId: string,          // FK to organization
  email: string,
  name: string,
  roles: array,                    // ["ORG_ADMIN", "ANALYST", etc.]
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp,
  lastLoginAt: timestamp,
  profile: {
    avatar: string,                // Profile image URL
    department: string,
    position: string,
    phone: string,
    bio: string
  },
  permissions: array,              // Granular permissions
  preferences: {
    theme: string,                 // "light", "dark", "auto"
    language: string,
    timezone: string,
    notifications: {
      email: boolean,
      push: boolean,
      inApp: boolean
    }
  }
}
```

### 2.4 Security Rules Structure

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // App Admin can access everything
    function isAppAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/appAdmins/$(request.auth.uid));
    }
    
    // User belongs to organization
    function belongsToOrg(orgId) {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organisationId == orgId;
    }
    
    // User is org admin
    function isOrgAdmin(orgId) {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organisationId == orgId &&
             "ORG_ADMIN" in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles;
    }
    
    // Organization rules
    match /organizations/{orgId} {
      allow read: if isAppAdmin() || belongsToOrg(orgId);
      allow write: if isAppAdmin() || isOrgAdmin(orgId);
    }
    
    // User rules
    match /users/{userId} {
      allow read: if isAppAdmin() || request.auth.uid == userId || 
                    belongsToOrg(resource.data.organisationId);
      allow write: if isAppAdmin() || isOrgAdmin(resource.data.organisationId);
    }
    
    // Project rules (org-scoped)
    match /projects/{projectId} {
      allow read, write: if isAppAdmin() || 
                           belongsToOrg(resource.data.organisationId);
    }
    
    // Other collections follow similar pattern...
  }
}
```

---

## 3. React Application Architecture

### 3.1 Context Structure

```javascript
// src/contexts/AuthContext.js (Updated)
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Organization management
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // Methods for organization management
  const createOrganization = async (orgData) => { /* ... */ };
  const updateOrganization = async (orgId, updatedData) => { /* ... */ };
  const deleteOrganization = async (orgId) => { /* ... */ };
  const getOrganizations = () => { /* ... */ };
  const getUsers = (organizationId = null) => { /* ... */ };
  
  return (
    <AuthContext.Provider value={{
      currentUser,
      currentUserData,
      currentOrganization,
      loading,
      organizations,
      users,
      projects,
      createOrganization,
      updateOrganization,
      deleteOrganization,
      getOrganizations,
      getUsers,
      // ... other methods
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 3.2 Service Layer

```javascript
// src/services/organizationService.js
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
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

export const organizationService = {
  // Create new organization
  async createOrganization(orgData, appAdminId) {
    const orgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const orgDoc = {
      organisationId: orgId,
      ...orgData,
      createdBy: appAdminId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
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
  
  // Update organization
  async updateOrganization(orgId, updatedData) {
    const docRef = doc(db, 'organizations', orgId);
    await updateDoc(docRef, {
      ...updatedData,
      updatedAt: new Date()
    });
  },
  
  // Delete organization (soft delete)
  async deleteOrganization(orgId) {
    const docRef = doc(db, 'organizations', orgId);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: new Date()
    });
  },
  
  // Get organization statistics
  async getOrganizationStats(orgId) {
    const usersQuery = query(
      collection(db, 'users'),
      where('organisationId', '==', orgId),
      where('isActive', '==', true)
    );
    const projectsQuery = query(
      collection(db, 'projects'),
      where('organisationId', '==', orgId),
      where('isActive', '==', true)
    );
    
    const [usersSnapshot, projectsSnapshot] = await Promise.all([
      getDocs(usersQuery),
      getDocs(projectsQuery)
    ]);
    
    return {
      totalUsers: usersSnapshot.size,
      totalProjects: projectsSnapshot.size,
      activeUsers: usersSnapshot.size,
      activeProjects: projectsSnapshot.size
    };
  }
};
```

### 3.3 Component Architecture

```javascript
// src/components/organizations/OrganizationList.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { organizationService } from '../../services/organizationService';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Chip, IconButton } from '@mui/material';
import { Edit, Delete, Visibility, Add } from '@mui/icons-material';

const OrganizationList = () => {
  const { currentUserData, organizations, getOrganizations } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  
  useEffect(() => {
    loadOrganizations();
  }, []);
  
  const loadOrganizations = async () => {
    try {
      setLoading(true);
      // Load organizations and stats
      const orgs = getOrganizations();
      const statsPromises = orgs.map(org => 
        organizationService.getOrganizationStats(org.organisationId)
      );
      const orgStats = await Promise.all(statsPromises);
      
      const statsMap = {};
      orgs.forEach((org, index) => {
        statsMap[org.organisationId] = orgStats[index];
      });
      
      setStats(statsMap);
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const columns = [
    { field: 'name', headerName: 'Organization', width: 200 },
    { field: 'description', headerName: 'Description', width: 300 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.row.isActive ? 'Active' : 'Inactive'}
          color={params.row.isActive ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'users',
      headerName: 'Users',
      width: 100,
      renderCell: (params) => {
        const orgStats = stats[params.row.organisationId];
        return orgStats ? `${orgStats.activeUsers}/${orgStats.totalUsers}` : '0/0';
      }
    },
    {
      field: 'projects',
      headerName: 'Projects',
      width: 100,
      renderCell: (params) => {
        const orgStats = stats[params.row.organisationId];
        return orgStats ? `${orgStats.activeProjects}/${orgStats.totalProjects}` : '0/0';
      }
    },
    {
      field: 'subscription',
      headerName: 'Plan',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.row.subscription?.plan || 'Free'}
          variant="outlined"
          size="small"
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <div>
          <IconButton size="small" onClick={() => handleView(params.row)}>
            <Visibility />
          </IconButton>
          <IconButton size="small" onClick={() => handleEdit(params.row)}>
            <Edit />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(params.row)}>
            <Delete />
          </IconButton>
        </div>
      )
    }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Organizations</h1>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {/* Open create modal */}}
        >
          Create Organization
        </Button>
      </div>
      
      <DataGrid
        rows={organizations}
        columns={columns}
        loading={loading}
        pageSize={10}
        rowsPerPageOptions={[10, 25, 50]}
        disableSelectionOnClick
        getRowId={(row) => row.organisationId}
      />
    </div>
  );
};

export default OrganizationList;
```

### 3.4 Organization Creation Form

```javascript
// src/components/organizations/OrganizationForm.js
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { organizationService } from '../../services/organizationService';

const schema = yup.object().shape({
  name: yup.string().required('Organization name is required'),
  description: yup.string().required('Description is required'),
  contactInfo: yup.object().shape({
    email: yup.string().email('Valid email required'),
    phone: yup.string(),
    website: yup.string().url('Valid URL required'),
    address: yup.string()
  }),
  subscription: yup.object().shape({
    plan: yup.string().required('Plan is required'),
    limits: yup.object().shape({
      users: yup.number().min(1, 'At least 1 user'),
      projects: yup.number().min(1, 'At least 1 project'),
      storage: yup.number().min(1, 'At least 1GB storage')
    })
  })
});

const OrganizationForm = ({ open, onClose, organization = null }) => {
  const { currentUserData, createOrganization, updateOrganization } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: organization || {
      name: '',
      description: '',
      contactInfo: {
        email: '',
        phone: '',
        website: '',
        address: ''
      },
      subscription: {
        plan: 'free',
        limits: {
          users: 10,
          projects: 5,
          storage: 1
        }
      },
      isActive: true
    }
  });
  
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      if (organization) {
        await updateOrganization(organization.organisationId, data);
      } else {
        await createOrganization(data, currentUserData.userId);
      }
      
      onClose();
      reset();
    } catch (error) {
      console.error('Error saving organization:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {organization ? 'Edit Organization' : 'Create Organization'}
      </DialogTitle>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Organization Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="contactInfo.email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Contact Email"
                    fullWidth
                    error={!!errors.contactInfo?.email}
                    helperText={errors.contactInfo?.email?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="contactInfo.phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone"
                    fullWidth
                    error={!!errors.contactInfo?.phone}
                    helperText={errors.contactInfo?.phone?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="subscription.plan"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Subscription Plan</InputLabel>
                    <Select {...field} label="Subscription Plan">
                      <MenuItem value="free">Free</MenuItem>
                      <MenuItem value="basic">Basic</MenuItem>
                      <MenuItem value="premium">Premium</MenuItem>
                      <MenuItem value="enterprise">Enterprise</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                }
                label="Active Organization"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Saving...' : (organization ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default OrganizationForm;
```

---

## 4. Implementation Phases

### Phase 1: Database Setup & Migration
1. **Firestore Collections Creation**
   - Create organizations collection
   - Update users collection schema
   - Set up security rules
   - Create indexes for queries

2. **Data Migration**
   - Migrate existing mock data to Firestore
   - Set up initial app admin record
   - Create sample organizations

### Phase 2: Core Organization Management
1. **Service Layer Implementation**
   - organizationService.js
   - Updated authService.js
   - Security rules implementation

2. **Basic UI Components**
   - OrganizationList component
   - OrganizationForm component
   - Organization detail view

### Phase 3: Advanced Features
1. **Organization Settings**
   - Custom branding
   - Workflow templates
   - Custom field definitions

2. **User Management**
   - Organization-scoped user management
   - Role assignment
   - Bulk operations

### Phase 4: Integration & Testing
1. **Integration Testing**
   - End-to-end organization workflows
   - Security rule testing
   - Performance testing

2. **Documentation & Deployment**
   - User documentation
   - Admin guides
   - Production deployment

---

## 5. Security Considerations

### 5.1 Data Isolation
- All data queries must include organizationId filter
- Users can only access data within their organization
- App Admin can access all organizations

### 5.2 Role-Based Access Control
- Granular permissions per role
- Organization-level admin capabilities
- Project-level access control

### 5.3 Audit Trail
- All organization changes logged
- User activity tracking
- Data access monitoring

---

## 6. Performance Considerations

### 6.1 Database Optimization
- Composite indexes for common queries
- Pagination for large datasets
- Efficient data structure design

### 6.2 Caching Strategy
- Client-side caching of organization data
- Real-time updates via Firestore listeners
- Optimistic updates for better UX

---

## 7. Testing Strategy

### 7.1 Unit Tests
- Service layer functions
- Component rendering
- Form validation

### 7.2 Integration Tests
- End-to-end organization workflows
- Security rule validation
- Data consistency checks

### 7.3 Performance Tests
- Large organization handling
- Concurrent user scenarios
- Database query optimization

---

## 8. Success Metrics

### 8.1 Technical Metrics
- Organization creation time < 5 seconds
- Data query response time < 2 seconds
- 99.9% uptime for organization operations

### 8.2 User Experience Metrics
- User adoption rate
- Organization management usage
- Support ticket reduction

---

## 9. Future Enhancements

### 9.1 Advanced Features
- Multi-organization user accounts
- Organization templates
- Advanced analytics and reporting
- API access for integrations

### 9.2 Scalability Improvements
- Database sharding strategies
- Advanced caching layers
- Microservices architecture

---

This plan provides a comprehensive roadmap for implementing Organizations support in Test Commander, ensuring scalability, security, and maintainability while following the established architecture patterns.