# Quick Start: Fix Test Type Names

## 🚀 Fast Setup (Windows)

1. **Double-click** `setup-test-type-fix.bat`
2. **Follow the prompts** - it will check everything for you
3. **Get your Firebase service account key** when prompted
4. **Update your project ID** in the script when prompted
5. **Run the script** - it will execute automatically

## 📋 Manual Setup

### 1. Get Firebase Service Account Key
- Go to [Firebase Console](https://console.firebase.google.com/)
- Select your project
- Go to **Project Settings** > **Service Accounts**
- Click **"Generate New Private Key"**
- Save as `serviceAccountKey.json` in this directory

### 2. Update Project ID
- Open `fixTestTypeNames.js`
- Replace `'https://your-project-id.firebaseio.com'` with your actual project ID
- Example: `'https://test-commander-12345.firebaseio.com'`

### 3. Run the Script
```bash
npm run fix-test-types
```

## ✅ What It Does

- **Removes double-barreled names**: `Localization/Internationalization` → `Internationalization`
- **Removes trailing "Test"**: `Security Test` → `Security`
- **Updates all test types** in your database (global + organization)
- **Preserves hyphenated names**: `Ad-hoc`, `Cross-Browser`, `End-to-End`

## 🔒 Security Note

The service account key has full database access. Keep it secure and consider deleting it after use.

## 📞 Need Help?

- Check the detailed `README_TEST_TYPE_NAMES.md`
- Run `setup-test-type-fix.bat` for guided setup
- Ensure Node.js is installed on your machine
