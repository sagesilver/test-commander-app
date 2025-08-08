# Test Commander - Google OAuth Authentication Setup Guide

## Overview
This guide will help you set up proper Google OAuth authentication for Test Commander using Firebase Authentication and FirebaseUI, following Google's official App Engine authentication procedure.

## Prerequisites
- Firebase project created and configured
- Google account: testinternals@gmail.com
- Node.js and npm installed

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: "test-commander"
4. Enable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Authentication
1. In Firebase Console, go to "Authentication" > "Sign-in method"
2. Click "Google" provider
3. Enable Google sign-in
4. Add your domain to "Authorized domains":
   - `localhost` (for local testing)
   - Your production domain
5. Click "Save"

### 1.3 Enable Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" (with security rules)
4. Select a location close to your users
5. Click "Done"

### 1.4 Get Firebase Configuration
1. Go to "Project settings" (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" > "Web"
4. Register app with name "Test Commander"
5. Copy the configuration object

## Step 2: Environment Configuration

### 2.1 Create Environment File
Create a `.env` file in the project root with your Firebase configuration:

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
REACT_APP_ENVIRONMENT=production
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Start the Application

```bash
npm start
```

## Step 5: Set Up App Admin Account

### 5.1 First Login
1. Open the application in your browser
2. Click "Sign in with Google"
3. Select the testinternals@gmail.com account
4. Complete the Google OAuth flow

### 5.2 Create App Admin Record
After successful login, open the browser console (F12) and run:

```javascript
window.setupTestCommanderAppAdmin()
```

This will:
- Create an app admin record in Firestore
- Set up the necessary permissions
- Reload the page to update authentication state

### 5.3 Verify Setup
1. You should be redirected to the Super Admin Dashboard
2. Check the browser console for success messages
3. Verify the app admin record was created in Firebase Console > Firestore

## Step 6: Configure Firestore Security Rules

### 6.1 Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 6.2 Login to Firebase
```bash
firebase login
```

### 6.3 Initialize Firebase
```bash
firebase init
```
- Select "Firestore" and "Hosting"
- Choose your project
- Use default settings

### 6.4 Deploy Security Rules
Since you're using production mode, deploy the security rules immediately:
```bash
firebase deploy --only firestore:rules
```

**Note**: The security rules in `firestore.rules` are already configured for production use with proper access controls.

## Step 7: Test the Complete Flow

### 7.1 Test App Admin Access
1. Sign out and sign back in with testinternals@gmail.com
2. Verify access to Super Admin Dashboard
3. Check that all admin functions are available

### 7.2 Test Regular User Flow
1. Sign out
2. Sign in with a different Google account
3. Verify the user gets appropriate access levels

## Troubleshooting

### Common Issues

1. **"No authenticated user found"**
   - Make sure you're signed in before running the setup function
   - Check that Firebase configuration is correct

2. **"Permission denied" errors**
   - Verify Firestore security rules are deployed
   - Check that the app admin record exists

3. **Google OAuth errors**
   - Verify the domain is authorized in Firebase Console
   - Check that Google provider is enabled

4. **Environment variables not loading**
   - Restart the development server after creating .env file
   - Ensure variable names start with `REACT_APP_`

### Debug Mode
Enable debug logging by checking browser console for:
- Authentication state changes
- Firestore query results
- Security rule evaluations

## Security Considerations

1. **Environment Variables**: Never commit .env files to version control
2. **Firestore Rules**: Always deploy proper security rules before production
3. **Domain Authorization**: Only authorize necessary domains in Firebase
4. **App Admin Access**: Limit app admin accounts to trusted users only

## Next Steps

After successful setup:
1. Create additional organizations
2. Set up organization-specific workflows
3. Configure custom fields and settings
4. Implement backup and monitoring
5. Plan for scaling and performance optimization

## Support

For issues or questions:
1. Check Firebase Console logs
2. Review browser console errors
3. Verify Firestore security rules
4. Test with different user roles

## Production Deployment

### 1. Build Application
```bash
npm run build
```

### 2. Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

### 3. Final Configuration
- Verify environment variables are set correctly
- Configure custom domain if needed
- Test authentication flow in production

### 4. Security Checklist
- [ ] Firestore security rules deployed
- [ ] Authentication providers configured
- [ ] Environment variables secured
- [ ] App admin account created
- [ ] Domain authorization updated
- [ ] Production database configured
