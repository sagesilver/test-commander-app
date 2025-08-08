@echo off
echo Starting Test Commander (Fast Mode)...
echo.

REM Kill any existing process on port 3000
echo Checking for existing processes on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo Killing process %%a on port 3000...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo Starting server (instant startup)...
echo The application will be available at http://localhost:3000
echo.

REM Open browser after a short delay
start "" http://localhost:3000

REM Just serve the existing build - no rebuilding
npx serve -s build -l 3000
