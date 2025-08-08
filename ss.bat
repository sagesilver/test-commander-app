@echo off
echo Starting Test Commander Development Server...
echo.

REM Check if node_modules exists, only install if missing
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
) else (
    echo Dependencies already installed, skipping npm install...
    echo.
)

REM Kill any existing process on port 3000
echo Checking for existing processes on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo Killing process %%a on port 3000...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo Starting development server with optimized settings...
echo The application will be available at http://localhost:3000
echo.

REM Set environment variables for faster startup
set FAST_REFRESH=true
set CHOKIDAR_USEPOLLING=false
set GENERATE_SOURCEMAP=false

REM Start with optimized settings
npm start 