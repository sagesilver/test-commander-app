# Test Type Names Cleanup

This script fixes all test type names in the database by:
1. Removing double-barreled names (e.g., "Localization/Internationalization" → "Internationalization")
2. Removing trailing "Test" words (e.g., "Security Test" → "Security")

## What Gets Updated

### Double-barreled Names → Single Names
- `Localization/Internationalization` → `Internationalization`
- `Recovery/Failover Test` → `Recovery`
- `Install/Uninstall Test` → `Installation`
- `Hardware/Embedded Test` → `Hardware`
- `Retesting/Confirmation` → `Retesting`
- `Session-Based Testing` → `Session-Based`
- `Maintenance Testing` → `Maintenance`
- `Beta Testing` → `Beta`
- `Pilot Testing` → `Pilot`
- `Operational Readiness Test` → `Operational Readiness`
- `Business Process Test` → `Business Process`
- `CI/CD Pipeline Tests` → `CI/CD Pipeline`

### Trailing "Test" Words Removed
- `Smoke Test` → `Smoke`
- `Sanity Test` → `Sanity`
- `Regression Test` → `Regression`
- `Integration Test` → `Integration`
- `System Test` → `System`
- `End-to-End Test` → `End-to-End`
- `Exploratory Test` → `Exploratory`
- `Performance Test` → `Performance`
- `Security Test` → `Security`
- `Accessibility Test` → `Accessibility`
- `API Test` → `API`
- `Database Test` → `Database`
- `Mobile Test` → `Mobile`
- `Cross-Browser Test` → `Cross-Browser`
- `User Acceptance Test` → `User Acceptance`
- `Load Test` → `Load`
- `Stress Test` → `Stress`
- `Scalability Test` → `Scalability`
- `Reliability Test` → `Reliability`
- `Compatibility Test` → `Compatibility`
- `Data Migration Test` → `Data Migration`
- `Configuration Test` → `Configuration`
- `Compliance Test` → `Compliance`
- `Ad-hoc Test` → `Ad-hoc`

## How to Run

### Prerequisites
1. **Node.js** installed on your machine
2. **Firebase service account key** (see setup below)

### Setup
1. **Get Firebase Service Account Key**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `serviceAccountKey.json` in this directory

2. **Update Project ID**
   - Open `fixTestTypeNames.js`
   - Replace `'https://your-project-id.firebaseio.com'` with your actual project ID
   - Example: `'https://test-commander-12345.firebaseio.com'`

3. **Install Dependencies**
   ```bash
   npm install
   ```

### Run the Script
```bash
npm run fix-test-types
```

Or run directly:
```bash
node fixTestTypeNames.js
```

## What Happens

- **Global Test Types**: All test types in the `globalTestTypes` collection are updated
- **Organization Test Types**: All test types in each organization's `testTypes` subcollection are updated
- **Existing Test Cases**: Continue to work with old names until updated (no retrofix needed)
- **New Test Cases**: Will use the new, cleaner names

## After Running

1. **Restart Application**: You may need to restart your app to see the changes
2. **Verify Changes**: Check that test type names appear correctly in the UI
3. **Test Import Utility**: Should now generate data with the new names

## Troubleshooting

### Common Issues
- **"Failed to initialize Firebase Admin SDK"**: Check that `serviceAccountKey.json` exists and has correct permissions
- **"Permission denied"**: Ensure your service account has Firestore read/write access
- **"Project not found"**: Verify the project ID in the script matches your Firebase project

### Security Notes
- Keep `serviceAccountKey.json` secure and never commit it to version control
- The service account key has full access to your database - use only on trusted machines
- Consider deleting the key after running the script if you don't need it for other purposes

## Notes

- Hyphenated names (e.g., "Ad-hoc", "Cross-Browser") are preserved as requested
- The script is safe and only updates names that match the mapping
- All changes are logged to the console for verification
- No test cases are affected - only the test type definitions are updated
- The script uses Firebase Admin SDK for secure, server-side database access
