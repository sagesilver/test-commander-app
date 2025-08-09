# Test Commander Authentication Design (Email/Password + Google)

## Overview
This document defines the production authentication approach for Test Commander, covering Google OAuth and non-Google email/password users. It describes architecture, data model, RBAC, onboarding flows, and reproducible setup steps.

## Providers
- Google Sign-In (Firebase Auth)
- Email/Password (Firebase Auth)

## High-level Architecture
- Client: React app using Firebase modular SDK for Auth, Firestore, Functions
- Server: Firebase Cloud Functions (Blaze) with Admin SDK
- Data: Firestore `users/{uid}` storing role/org and flags

## Key Collections
- `users/{uid}`
  - `userId` (uid), `email`, `name`
  - `roles` [APP_ADMIN, ORG_ADMIN, ANALYST, TEST_ENGINEER, DEFECT_COORDINATOR]
  - `organisationId` (nullable for APP_ADMIN)
  - `isActive` (bool)
  - `mustChangePassword` (bool)
  - `createdAt`, `lastLoginAt`, `createdBy`
  - `profile` (avatar, department, position, phone)

## Security Rules (Summary)
- Expect `users/{request.auth.uid}` to exist and hold roles
- `APP_ADMIN`: full access
- `ORG_ADMIN`: org-scoped access
- Users can read/update their own doc

## Onboarding Flows

### 1) Google (App Admin bootstrap)
- Enable Google provider in Firebase Auth
- Sign in as super user
- Run `window.setupTestCommanderAppAdmin()` to create `users/{uid}` with APP_ADMIN

### 2) Email/Password (Non-Google) - CORRECTED APPROACH
**CRITICAL: This approach prevents APP_ADMIN logout and UUID mismatch issues**

- Admin creates user via UI
- Client calls Callable Function `createUserAndInvite`
- Function (Admin SDK):
  1. Validates caller RBAC (APP_ADMIN or same-org ORG_ADMIN)
  2. **Creates Firebase Auth user FIRST** using `admin.auth().createUser()`
  3. **Creates Firestore `users/{realUid}` with real UID immediately**
  4. Returns user data (NO password reset link generation)
- **Client triggers password reset email** using `sendPasswordResetEmail()` from Firebase Auth
- User receives email and sets password via Firebase's built-in flow
- User logs in and AuthContext loads data from `users/{realUid}`

**Key Benefits:**
- ✅ No APP_ADMIN logout (Auth user creation is server-side)
- ✅ No UUID mismatch (Firestore doc uses real UID from start)
- ✅ Proper email delivery (Firebase's intended flow)
- ✅ Clean user experience (no white screens)

## Client Components and Services
- `src/pages/Login.js`
  - Email/password sign-in via `signInWithEmailAndPassword`
  - If `mustChangePassword` flag is true, presents password change form
- `src/contexts/AuthContext.js`
  - Tracks `currentUser` and loads `users/{uid}`; sets `mustChangePassword`
- `src/services/userService.js`
  - `createUser`: calls `createUserAndInvite` function
  - **Triggers `sendPasswordResetEmail()` from client-side after successful user creation**
- `src/components/UserForm.js`
  - Creates user via service
  - Shows success message (no reset link display needed)

## Cloud Functions
- `functions/index.js`
  - `createUserAndInvite(data)`
    - Input: `{ email, name, roles[], organisationId, isActive?, profile?, createdBy? }`
    - Auth required; RBAC enforced
    - **Creates Auth user + Firestore doc with real UID**
    - **Output: `{ user, message }` (no reset link)**

## Reproducible Setup Steps

### 1. Firebase Console
- Create/choose project
- Enable Authentication providers: Google and Email/Password
- Add authorized domains (localhost and prod domain)
- Enable Firestore, deploy `firestore.rules`

### 2. Environment
- Create `.env` with `REACT_APP_FIREBASE_*` variables

### 3. Functions (Blaze plan)
- In project root:
  - Ensure `functions/` contains `package.json` and `index.js` from repo
  - `firebase deploy --only functions`

### 4. Hosting (optional)
- Build and deploy web app

### 5. Bootstrap App Admin (Google)
- Sign in with Google
- Run `window.setupTestCommanderAppAdmin()` once

### 6. Create Org Users (Email/Password)
- As APP_ADMIN or ORG_ADMIN, open User Management → Add User
- **Password reset email is sent automatically via Firebase**
- User receives email and sets password via Firebase's flow

## Operational Notes
- **CRITICAL: Do NOT use `createUserWithEmailAndPassword` from client (causes logout)**
- **CRITICAL: Do NOT generate password reset links server-side (use client-side `sendPasswordResetEmail`)**
- Always key `users` documents by Firebase UID
- **Prefer client-side email trigger for reliable onboarding**
- **No manual reset link sharing required - Firebase handles email delivery**

## Troubleshooting

### Common Issues
- `auth/too-many-requests`: Avoid repeated wrong-password attempts
- Permission denied: Ensure caller has roles and `users/{uid}` exists
- **APP_ADMIN logout during user creation**: Use corrected approach above
- **UUID mismatch between Auth and Firestore**: Use corrected approach above
- **White screen after user login**: Use corrected approach above

### Cloud Function Debugging
- Check logs: `firebase functions:log --only createUserAndInvite`
- Common errors:
  - `permission-denied`: Check caller's roles and organization permissions
  - `already-exists`: User email already exists in system
  - **`auth/user-not-found`**: Normal when creating new user

## Implementation Details

### Cloud Function: createUserAndInvite (CORRECTED)
```javascript
exports.createUserAndInvite = functions.region('australia-southeast1').https.onCall(async (data, context) => {
  // 1. Validate authentication and RBAC
  // 2. Create Firebase Auth user FIRST using admin.auth().createUser()
  // 3. Create Firestore user document with REAL UID immediately
  // 4. Return user data (NO password reset link generation)
});
```

### Client Integration (CORRECTED)
```javascript
// userService.js
const createUserAndInvite = httpsCallable(functions, 'createUserAndInvite');
const result = await createUserAndInvite(userData);

// Trigger password reset email from client-side
const actionCodeSettings = {
  url: 'https://your-app.web.app/',
  handleCodeInApp: true,
};
await sendPasswordResetEmail(auth, email, actionCodeSettings);

return {
  success: true,
  user: result.data.user,
  message: result.data.message
};
```

### UI Display (CORRECTED)
```javascript
// UserForm.js - Simplified success message
{message.type === 'success' && (
  <div className="p-3 rounded border border-green-200 bg-green-50">
    <p className="text-green-800">{message.text}</p>
  </div>
)}
```

## Future Enhancements
- Email delivery via transactional mail (e.g., SendGrid) from the function
- Custom continue URL and deep link to post-reset login
- Audit logs for user creation and invitations
- Multi-factor authentication support
- SSO integration options

## Security Considerations
- All user creation goes through Cloud Functions with Admin SDK
- RBAC enforced at function level
- Password reset emails sent via Firebase's built-in system
- User documents keyed by Firebase UID for consistency
- **No client-side user creation to prevent session conflicts**
- **No server-side password reset link generation**

## Testing Checklist
- [ ] APP_ADMIN can create users in any organization
- [ ] ORG_ADMIN can only create users in their organization
- [ ] ORG_ADMIN cannot create APP_ADMIN users
- [ ] **APP_ADMIN stays logged in during user creation**
- [ ] **Password reset email is sent automatically**
- [ ] **User can set password and sign in without white screen**
- [ ] **UUID matches between Auth and Firestore**
- [ ] `mustChangePassword` flag is cleared after password update
- [ ] Error handling for duplicate emails
- [ ] Error handling for invalid permissions

## Lessons Learned (3-Day Debugging Experience)
**CRITICAL ISSUES TO AVOID:**
1. **APP_ADMIN logout**: Caused by client-side Auth user creation
2. **UUID mismatch**: Caused by temporary UID + later update approach
3. **White screen**: Caused by Auth/Firestore data inconsistency
4. **Email delivery failure**: Caused by server-side password reset link generation

**CORRECTED APPROACH:**
1. **Server-side Auth user creation** (prevents logout)
2. **Real UID from start** (prevents UUID mismatch)
3. **Client-side email trigger** (ensures delivery)
4. **Immediate Firestore doc creation** (prevents white screen)

## Secrets and Environment (Node Scripts)

To prevent exposure of Firebase config in scripts, Node utilities (e.g., `setupUsers.js`, `fixUser.js`) must load configuration from environment variables via `dotenv`.

- Create `.env` from `.env.example`
- Prefer `FIREBASE_*` variables for Node scripts; frontend uses `REACT_APP_*`
- The scripts will exit with an error if required vars are missing
- Rotate keys in Firebase Console if a key was previously exposed; update `.env`

Required variables for Node scripts:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID` (optional)

Run examples (Windows CMD):
- `copy .env.example .env`
- `notepad .env` (fill values)
- `node setupUsers.js`
- `node fixUser.js`
