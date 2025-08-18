// Simple script to fix test type names using Firebase CLI token
// Run this locally with: node fixTestTypeNamesSimple.js

const admin = require('firebase-admin');

console.log('🔧 Fixing test type names - removing double-barreled names and trailing "Test" words...');

// Initialize Firebase Admin SDK using service account or CLI token
try {
  // Try to use service account key first (recommended for production)
  try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'test-commander-project'
    });
    console.log('✅ Firebase Admin SDK initialized using service account key');
  } catch (serviceAccountError) {
    // Fallback to CLI token (for development only)
    console.log('⚠️  Service account key not found, using CLI token (development only)');
    console.log('📋 To use service account key:');
    console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
    console.log('2. Click "Generate New Private Key"');
    console.log('3. Save as "serviceAccountKey.json" in this directory');
    
    // Use CLI token from environment variable (more secure)
    const refreshToken = process.env.FIREBASE_REFRESH_TOKEN;
    if (!refreshToken) {
      throw new Error('FIREBASE_REFRESH_TOKEN environment variable not set. Please set it or use service account key.');
    }
    
    admin.initializeApp({
      credential: admin.credential.refreshToken(refreshToken),
      projectId: 'test-commander-project'
    });
    console.log('✅ Firebase Admin SDK initialized using CLI token from environment');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  console.error('💡 Please ensure you have either:');
  console.error('   - serviceAccountKey.json file in this directory, OR');
  console.error('   - FIREBASE_REFRESH_TOKEN environment variable set');
  process.exit(1);
}

const db = admin.firestore();

// Define the name mappings for problematic test types
const nameMappings = {
  // Double-barreled names to single names
  'Localization/Internationalization': 'Internationalization',
  'Recovery/Failover Test': 'Recovery',
  'Install/Uninstall Test': 'Installation',
  'Hardware/Embedded Test': 'Hardware',
  'Retesting/Confirmation': 'Retesting',
  'Session-Based Testing': 'Session-Based',
  'Maintenance Testing': 'Maintenance',
  'Beta Testing': 'Beta',
  'Pilot Testing': 'Pilot',
  'Operational Readiness Test': 'Operational Readiness',
  'Business Process Test': 'Business Process',
  'CI/CD Pipeline Tests': 'CI/CD Pipeline',
  
  // Remove trailing "Test" words
  'Smoke Test': 'Smoke',
  'Sanity Test': 'Sanity',
  'Regression Test': 'Regression',
  'Integration Test': 'Integration',
  'System Test': 'System',
  'End-to-End Test': 'End-to-End',
  'Exploratory Test': 'Exploratory',
  'Performance Test': 'Performance',
  'Security Test': 'Security',
  'Accessibility Test': 'Accessibility',
  'API Test': 'API',
  'Database Test': 'Database',
  'Mobile Test': 'Mobile',
  'Cross-Browser Test': 'Cross-Browser',
  'User Acceptance Test': 'User Acceptance',
  'Load Test': 'Load',
  'Stress Test': 'Stress',
  'Scalability Test': 'Scalability',
  'Reliability Test': 'Reliability',
  'Compatibility Test': 'Compatibility',
  'Data Migration Test': 'Data Migration',
  'Configuration Test': 'Configuration',
  'Compliance Test': 'Compliance',
  'Ad-hoc Test': 'Ad-hoc'
};

// Function to update test type names in a collection
async function updateTestTypeNames(collectionPath, collectionName) {
  console.log(`\n📁 Processing ${collectionName} collection...`);
  
  try {
    const collectionRef = db.collection(collectionPath);
    const snapshot = await collectionRef.get();
    
    if (snapshot.empty) {
      console.log(`   No documents found in ${collectionName}`);
      return { updated: 0, skipped: 0 };
    }
    
    let updated = 0;
    let skipped = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const oldName = data.name;
      
      if (nameMappings[oldName]) {
        const newName = nameMappings[oldName];
        console.log(`   Updating: "${oldName}" → "${newName}"`);
        
        await doc.ref.update({
          name: newName,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updated++;
      } else {
        skipped++;
      }
    }
    
    console.log(`   ✅ ${updated} updated, ${skipped} skipped`);
    return { updated, skipped };
  } catch (error) {
    console.error(`   ❌ Error processing ${collectionName}:`, error);
    return { updated: 0, skipped: 0, error: error.message };
  }
}

// Main execution
async function fixAllTestTypeNames() {
  console.log('🚀 Starting test type name cleanup...\n');
  
  const results = {
    globalTestTypes: { updated: 0, skipped: 0 },
    orgTestTypes: { updated: 0, skipped: 0 }
  };
  
  // Update global test types
  const globalResult = await updateTestTypeNames('globalTestTypes', 'Global Test Types');
  results.globalTestTypes = globalResult;
  
  // Update organization test types (need to iterate through all organizations)
  console.log('\n📁 Processing organization test types...');
  
  try {
    const orgsSnapshot = await db.collection('organizations').get();
    
    for (const orgDoc of orgsSnapshot.docs) {
      const orgId = orgDoc.id;
      const orgName = orgDoc.data().name || orgId;
      
      console.log(`   Processing organization: ${orgName}`);
      
      const orgResult = await updateTestTypeNames(
        `organizations/${orgId}/testTypes`, 
        `${orgName} Test Types`
      );
      
      // Accumulate results
      results.orgTestTypes.updated += orgResult.updated || 0;
      results.orgTestTypes.skipped += orgResult.skipped || 0;
    }
    
  } catch (error) {
    console.error('   ❌ Error processing organization test types:', error);
  }
  
  // Summary
  console.log('\n📊 SUMMARY');
  console.log('==========');
  console.log(`Global Test Types: ${results.globalTestTypes.updated} updated, ${results.globalTestTypes.skipped} skipped`);
  console.log(`Organization Test Types: ${results.orgTestTypes.updated} updated, ${results.orgTestTypes.skipped} skipped`);
  console.log(`Total Updated: ${results.globalTestTypes.updated + results.orgTestTypes.updated}`);
  
  if (results.globalTestTypes.error) {
    console.log(`Global Test Types Error: ${results.globalTestTypes.error}`);
  }
  
  console.log('\n🎉 Test type name cleanup completed!');
  console.log('\n📝 Note: You may need to restart your application to see the changes.');
  console.log('📝 Note: Existing test cases will continue to work with the old names until updated.');
  
  // Close the connection
  process.exit(0);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

// Run the script
fixAllTestTypeNames();
