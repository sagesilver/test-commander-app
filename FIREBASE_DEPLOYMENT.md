# Firebase Deployment Guide for Test Commander

## Overview
This guide covers the deployment of Test Commander's authentication and data management system using Firebase Authentication and Firestore.

## Prerequisites
- Firebase project created and configured
- Firebase app added to the project
- Firestore database enabled
- Authentication enabled with Google provider
- Existing Google account: testinternals@gmail.com

## Environment Setup

### 1. Environment Variables
The application uses environment variables for Firebase configuration. Create a `.env` file in the root directory:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Application Configuration
REACT_APP_APP_NAME=Test Commander
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=development
```

### 2. Firebase Configuration
The Firebase configuration is automatically loaded from environment variables in `src/services/firebase.js`.

## Firestore Collections Structure

### Collections Overview
Based on the Test Commander Data Model, the following collections are implemented:

1. **appAdmins** - Super users with system-wide access
2. **organizations** - Top-level tenants
3. **users** - All users with organization context
4. **projects** - Work units within organizations
5. **releases** - Time-bound work cycles
6. **regressionSuites** - Test case groupings
7. **testCases** - Individual test cases
8. **testSteps** - Steps within test cases
9. **testRuns** - Test execution instances
10. **issues** - Defects and issues

### Document Structure Examples

#### App Admin Document
```json
{
  "appAdminId": "user_uid",
  "email": "testinternals@gmail.com",
  "name": "Test Commander Super User",
  "role": "APP_ADMIN",
  "createdAt": "timestamp",
  "lastLoginAt": "timestamp"
}
```

#### Organization Document
```json
{
  "organisationId": "org_123",
  "name": "Acme Corporation",
  "description": "Leading software development company",
  "contactInfo": {
    "address": "123 Business St, Tech City",
    "phone": "+1-555-0123",
    "website": "https://acme.com"
  },
  "orgAdminId": "user_uid",
  "createdBy": "app_admin_uid",
  "createdAt": "timestamp",
  "isActive": true,
  "settings": {
    "customFields": [],
    "workflows": [],
    "defaultUserRole": "ANALYST",
    "maxUsers": 100,
    "maxProjects": 50
  },
  "subscription": {
    "plan": "basic",
    "startDate": "date",
    "endDate": "date",
    "features": ["basic_testing", "defect_management"]
  }
}
```

#### User Document
```json
{
  "userId": "user_uid",
  "organisationId": "org_123",
  "email": "user@acme.com",
  "name": "John Doe",
  "roles": ["ORG_ADMIN"],
  "isActive": true,
  "createdAt": "timestamp",
  "lastLoginAt": "timestamp",
  "profile": {
    "avatar": "",
    "department": "IT",
    "position": "Organization Administrator",
    "phone": ""
  },
  "permissions": []
}
```

## Security Rules

### Firestore Security Rules
Deploy the security rules from `firestore.rules` to your Firebase project:

```bash
firebase deploy --only firestore:rules
```

### Key Security Features
- **App Admin Access**: Super users can access all data
- **Organization Isolation**: Users can only access their organization's data
- **Role-Based Access**: Different permissions based on user roles
- **Project-Level Security**: Project members can access project-specific data

## Super User Setup

### 1. Enable Google Authentication
1. Go to Firebase Console > Authentication > Sign-in method
2. Enable Google provider
3. Add your domain to authorized domains
4. Configure OAuth consent screen if needed
5. Firebase will automatically handle the OAuth client configuration

### 2. Create App Admin Record
The application includes a utility to create the app admin record for the existing Google account:

```javascript
// In browser console after app loads
window.setupTestCommanderAppAdmin()
```

### 3. Super User Access
- **Email**: testinternals@gmail.com
- **Method**: Google Sign-In
- **Role**: APP_ADMIN

### 4. Manual Creation (Alternative)
If the automated setup fails, manually create the app admin record:

1. Go to Firebase Console > Firestore
2. Create document in `appAdmins` collection with email as key:

```json
{
  "appAdminId": null,
  "email": "testinternals@gmail.com",
  "name": "Test Commander Super User",
  "role": "APP_ADMIN",
  "createdAt": "serverTimestamp()",
  "lastLoginAt": null
}
```

## Organization and User Management

### Creating Organizations
1. Login as super user
2. Navigate to Super Admin Dashboard
3. Click "Create Organization"
4. Fill in organization details and admin credentials
5. The system will:
   - Create the organization admin user
   - Create the organization document
   - Link the admin to the organization

### Creating Users
1. Login as super user or org admin
2. Navigate to User Management
3. Click "Create User"
4. Fill in user details and assign roles
5. The system will create the user in Firebase Auth and Firestore

## User Roles and Permissions

### Role Hierarchy
1. **APP_ADMIN** - System-wide access
2. **ORG_ADMIN** - Organization-level access
3. **ANALYST** - Test analysis and design
4. **TEST_ENGINEER** - Test execution and results
5. **DEFECT_COORDINATOR** - Defect management

### Permission Matrix
| Role | Organizations | Users | Projects | Test Cases | Defects |
|------|---------------|-------|----------|------------|---------|
| APP_ADMIN | All | All | All | All | All |
| ORG_ADMIN | Own | Own | Own | Own | Own |
| ANALYST | Own | Read | Assigned | Create/Edit | Read |
| TEST_ENGINEER | Own | Read | Assigned | Execute | Create |
| DEFECT_COORDINATOR | Own | Read | Assigned | Read | Manage |

## Testing the Deployment

### 1. Start the Application
```bash
npm start
```

### 2. Setup App Admin Record
Run in browser console:
```javascript
// Create app admin record for Google user
window.setupTestCommanderAppAdmin()
```

### 3. Login Test
- Navigate to login page
- Click "Sign in with Google"
- Select testinternals@gmail.com account
- Verify access to Super Admin Dashboard

### 4. Create Test Organization
- Use Super Admin Dashboard
- Create a test organization
- Verify organization admin can login

## Troubleshooting

### Common Issues

1. **Compilation Errors**
   - Install missing dependencies: `npm install @mui/icons-material`
   - Check for undefined imports in components
   - Restart development server after dependency changes

2. **Environment Variables Not Loading**
   - Ensure `.env` file is in root directory
   - Restart development server
   - Check variable names start with `REACT_APP_`

3. **Firebase Connection Issues**
   - Verify Firebase project configuration
   - Check API keys and project ID
   - Ensure Firestore is enabled

4. **Authentication Errors**
   - Verify Google provider is enabled
   - Check OAuth consent screen configuration
   - Verify domain is authorized in Firebase
   - Check app admin record exists in Firestore

5. **Permission Denied Errors**
   - Check Firestore security rules
   - Verify user roles and organization membership
   - Check document structure matches rules

### Debug Mode
Enable debug logging by checking browser console for:
- Authentication state changes
- Firestore query results
- Security rule evaluations

## Production Deployment

### 1. Build Application
```bash
npm run build
```

### 2. Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

### 3. Update Environment Variables
- Set production Firebase project
- Update environment variables for production
- Configure custom domain if needed

### 4. Security Checklist
- [ ] Firestore security rules deployed
- [ ] Authentication providers configured
- [ ] Environment variables secured
- [ ] Super user password changed
- [ ] Organization admins created
- [ ] Backup strategy implemented

## Support

For issues or questions:
1. Check Firebase Console logs
2. Review browser console errors
3. Verify Firestore security rules
4. Test with different user roles

## Next Steps

After successful deployment:
1. Create additional organizations
2. Set up organization-specific workflows
3. Configure custom fields and settings
4. Implement backup and monitoring
5. Plan for scaling and performance optimization

## Node Scripts Environment Usage

Utility scripts (`setupUsers.js`, `fixUser.js`) require Firebase config via environment variables. Do not hardcode keys.

1. Copy example env and fill values:
```cmd
copy .env.example .env
notepad .env
```
2. Install deps (includes dotenv):
```cmd
npm install
```
3. Run scripts:
```cmd
node setupUsers.js
node fixUser.js
```

If Google reports exposed keys (e.g., in a public repo URL), rotate the Web API key in Firebase Console and update `.env`.
