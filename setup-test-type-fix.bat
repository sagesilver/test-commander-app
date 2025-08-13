@echo off
echo ========================================
echo Test Commander - Test Type Names Fix
echo ========================================
echo.

echo This script will help you fix all test type names in your database.
echo.

echo Prerequisites:
echo 1. Node.js must be installed
echo 2. You need a Firebase service account key
echo.

echo Step 1: Check if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js is installed: 
node --version

echo.
echo Step 2: Check if Firebase Admin SDK is installed...
if not exist "node_modules\firebase-admin" (
    echo Installing Firebase Admin SDK...
    npm install firebase-admin
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Firebase Admin SDK
        pause
        exit /b 1
    )
    echo ✅ Firebase Admin SDK installed
) else (
    echo ✅ Firebase Admin SDK already installed
)

echo.
echo Step 3: Check for service account key...
if not exist "serviceAccountKey.json" (
    echo.
    echo ❌ serviceAccountKey.json not found!
    echo.
    echo To get this file:
    echo 1. Go to Firebase Console: https://console.firebase.google.com/
    echo 2. Select your project
    echo 3. Go to Project Settings ^> Service Accounts
    echo 4. Click "Generate New Private Key"
    echo 5. Save the file as "serviceAccountKey.json" in this directory
    echo.
    echo After you have the file, run this script again.
    pause
    exit /b 1
) else (
    echo ✅ serviceAccountKey.json found
)

echo.
echo Step 4: Check project ID in script...
findstr /C:"your-project-id" fixTestTypeNames.js >nul
if %errorlevel% equ 0 (
    echo.
    echo ⚠️  WARNING: You need to update the project ID in fixTestTypeNames.js
    echo.
    echo Open fixTestTypeNames.js and replace:
    echo 'https://your-project-id.firebaseio.com'
    echo with your actual project ID, e.g.:
    echo 'https://test-commander-12345.firebaseio.com'
    echo.
    echo After updating the project ID, run this script again.
    pause
    exit /b 1
) else (
    echo ✅ Project ID appears to be configured
)

echo.
echo ========================================
echo All checks passed! Ready to run script.
echo ========================================
echo.

echo To run the test type name fix script:
echo   npm run fix-test-types
echo.
echo Or run directly:
echo   node fixTestTypeNames.js
echo.

echo Press any key to run the script now, or close this window to run later...
pause >nul

echo.
echo Running test type name fix script...
echo.
npm run fix-test-types

echo.
echo Script completed. Press any key to exit...
pause >nul
