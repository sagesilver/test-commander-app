# Security Setup Guide for Test Type Fix Scripts

## ⚠️ **IMPORTANT: Security Notice**

The test type fix scripts have been updated to remove hardcoded credentials and improve security. This guide explains how to set them up securely.

## 🔐 **Authentication Methods**

### **Option 1: Service Account Key (Recommended for Production)**

1. **Generate Service Account Key:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to **Project Settings** → **Service Accounts**
   - Click **"Generate New Private Key"**
   - Save the JSON file as `serviceAccountKey.json` in the project root

2. **Run the Script:**
   ```bash
   node fixTestTypeNamesSimple.js
   ```

### **Option 2: Environment Variable (Development)**

1. **Set Environment Variable:**
   ```bash
   # Windows
   set FIREBASE_REFRESH_TOKEN=your_refresh_token_here
   
   # macOS/Linux
   export FIREBASE_REFRESH_TOKEN=your_refresh_token_here
   ```

2. **Get Refresh Token:**
   ```bash
   firebase login:ci --no-localhost
   ```

3. **Run the Script:**
   ```bash
   node fixTestTypeNamesSimple.js
   ```

### **Option 3: Firebase CLI (Development)**

1. **Login to Firebase:**
   ```bash
   firebase login
   ```

2. **Run the CLI Script:**
   ```bash
   node fixTestTypeNamesCLI.js
   ```

## 🚫 **What NOT to Do**

- ❌ **Never hardcode credentials** in source code
- ❌ **Never commit** `serviceAccountKey.json` to version control
- ❌ **Never share** service account keys or refresh tokens
- ❌ **Never use** hardcoded refresh tokens

## 🔒 **Security Best Practices**

1. **Use Service Account Keys** for production/automated scripts
2. **Use Environment Variables** for development
3. **Rotate credentials** regularly
4. **Limit permissions** to minimum required access
5. **Monitor usage** and audit access logs

## 📁 **File Security**

The following files are automatically ignored by Git:
- `serviceAccountKey.json`
- `*-service-account*.json`
- `*-key*.json`
- `*.key`
- `.env` files

## 🚨 **If You Accidentally Commit Credentials**

1. **Immediately revoke** the exposed credentials
2. **Generate new credentials**
3. **Remove from Git history** using `git filter-branch` or BFG
4. **Force push** to remove from remote repository
5. **Notify team members** to update their local copies

## 📞 **Support**

If you encounter authentication issues:
1. Check that credentials are properly set up
2. Verify Firebase project permissions
3. Ensure service account has required roles
4. Check Firebase Console for any account restrictions

---

**Remember: Security is everyone's responsibility. Never compromise credentials for convenience.**
