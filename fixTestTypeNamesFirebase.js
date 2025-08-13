// Script to fix test type names using Firebase CLI commands
// Run this locally with: node fixTestTypeNamesFirebase.js

const { execSync } = require('child_process');

console.log('🔧 Fixing test type names using Firebase CLI...');

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

// Function to update test type names using Firebase CLI
async function updateTestTypeNames(collectionPath, collectionName) {
  console.log(`\n📁 Processing ${collectionName} collection...`);
  
  try {
    // Get all documents in the collection
    const output = execSync(`firebase firestore:get --project=test-commander-project ${collectionPath}`, { encoding: 'utf8' });
    
    if (output.includes('No documents found')) {
      console.log(`   No documents found in ${collectionName}`);
      return { updated: 0, skipped: 0 };
    }
    
    let updated = 0;
    let skipped = 0;
    
    // Parse the output and update each document
    // This is a simplified approach - in practice, we'd need to parse the JSON output
    console.log(`   Found documents in ${collectionName}, but CLI approach has limitations`);
    console.log(`   Consider using the service account key approach for full functionality`);
    
    return { updated, skipped };
  } catch (error) {
    console.error(`   ❌ Error processing ${collectionName}:`, error.message);
    return { updated: 0, skipped: 0, error: error.message };
  }
}

// Main execution
async function fixAllTestTypeNames() {
  console.log('🚀 Starting test type name cleanup...\n');
  
  console.log('⚠️  Firebase CLI approach has limitations for bulk updates');
  console.log('📋 Recommended approach: Use service account key');
  console.log('\nTo get service account key:');
  console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.log('2. Click "Generate New Private Key"');
  console.log('3. Save as "serviceAccountKey.json" in this directory');
  console.log('4. Run: npm run fix-test-types');
  
  console.log('\nAlternatively, you can manually update test type names in Firebase Console:');
  console.log('1. Go to Firestore Database');
  console.log('2. Navigate to globalTestTypes collection');
  console.log('3. Update each document manually with the new names');
  
  console.log('\nName mappings to apply:');
  Object.entries(nameMappings).forEach(([oldName, newName]) => {
    console.log(`   "${oldName}" → "${newName}"`);
  });
  
  process.exit(0);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

// Run the script
fixAllTestTypeNames();
