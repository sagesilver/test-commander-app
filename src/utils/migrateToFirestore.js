import { organizationService } from '../services/organizationService';

// Mock data from AuthContext for migration
export const mockData = {
  organizations: [
    {
      organisationId: 'org1',
      name: 'Acme Corporation',
      description: 'Leading software development company',
      orgAdminId: 'user2',
      contactInfo: {
        address: '123 Business St, Tech City',
        phone: '+1-555-0123',
        website: 'https://acme.com',
        email: 'contact@acme.com'
      },
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
        }
      },
      subscription: {
        plan: 'premium',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        features: ['basic_testing', 'defect_management', 'advanced_reporting'],
        limits: {
          users: 100,
          projects: 50,
          storage: 10
        }
      },
      metadata: {
        industry: 'Technology',
        size: 'large',
        region: 'North America',
        timezone: 'America/New_York'
      }
    },
    {
      organisationId: 'org2',
      name: 'Innovation Labs',
      description: 'Research and development organization',
      orgAdminId: 'user3',
      contactInfo: {
        address: '456 Innovation Ave, Research Park',
        phone: '+1-555-0456',
        website: 'https://innovationlabs.com',
        email: 'info@innovationlabs.com'
      },
      isActive: true,
      settings: {
        defaultUserRole: 'TEST_ENGINEER',
        maxUsers: 50,
        maxProjects: 25,
        customFields: [],
        workflows: [],
        branding: {
          logo: '',
          primaryColor: '#3762c4',
          customCss: ''
        }
      },
      subscription: {
        plan: 'basic',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        features: ['basic_testing', 'defect_management'],
        limits: {
          users: 25,
          projects: 25,
          storage: 5
        }
      },
      metadata: {
        industry: 'Research',
        size: 'medium',
        region: 'North America',
        timezone: 'America/Chicago'
      }
    },
    {
      organisationId: 'org3',
      name: 'ITC2',
      description: 'ITC2 Organization',
      orgAdminId: 'user6',
      contactInfo: {
        address: 'ITC2 Address',
        phone: '+1-555-0789',
        website: 'https://itc2.com',
        email: 'admin@itc2.com'
      },
      isActive: true,
      settings: {
        defaultUserRole: 'TEST_ENGINEER',
        maxUsers: 75,
        maxProjects: 30,
        customFields: [],
        workflows: [],
        branding: {
          logo: '',
          primaryColor: '#3762c4',
          customCss: ''
        }
      },
      subscription: {
        plan: 'enterprise',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        features: ['basic_testing', 'defect_management', 'advanced_reporting', 'custom_integrations'],
        limits: {
          users: 1000,
          projects: 200,
          storage: 100
        }
      },
      metadata: {
        industry: 'Technology',
        size: 'enterprise',
        region: 'Australia',
        timezone: 'Australia/Sydney'
      }
    }
  ]
};

// Migrate organizations to Firestore
export const migrateToFirestore = async (appAdminId) => {
  try {
    console.log('Starting migration to Firestore...');
    
    const results = [];
    for (const org of mockData.organizations) {
      try {
        // Check if organization already exists
        const existingOrg = await organizationService.getOrganizationByName(org.name);
        if (existingOrg) {
          console.log(`Organization "${org.name}" already exists, skipping...`);
          results.push({ name: org.name, status: 'skipped', reason: 'already exists' });
          continue;
        }
        
        // Create organization in Firestore
        const newOrg = await organizationService.createOrganization(org, appAdminId);
        console.log(`Organization "${org.name}" migrated successfully`);
        results.push({ name: org.name, status: 'success', id: newOrg.organisationId });
      } catch (error) {
        console.error(`Error migrating organization "${org.name}":`, error);
        results.push({ name: org.name, status: 'error', error: error.message });
      }
    }
    
    console.log('Migration completed:', results);
    return results;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Check if Firestore has data
export const checkFirestoreData = async () => {
  try {
    const orgs = await organizationService.getAllOrganizations();
    return {
      hasData: orgs.length > 0,
      count: orgs.length,
      organizations: orgs
    };
  } catch (error) {
    console.error('Error checking Firestore data:', error);
    return {
      hasData: false,
      count: 0,
      error: error.message
    };
  }
};

// Clear localStorage data (use with caution)
export const clearLocalStorage = () => {
  try {
    localStorage.removeItem('testCommander_organizations');
    localStorage.removeItem('testCommander_users');
    localStorage.removeItem('testCommander_projects');
    console.log('LocalStorage cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};
