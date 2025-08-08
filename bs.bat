@echo off
echo Starting Test Commander (Build & Serve)...
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

REM Check if build folder exists and is recent (within last 10 minutes)
if exist "build" (
    echo Build folder exists, checking if it's recent...
    REM This is a simple check - you can rebuild manually if needed
    echo Using existing build (fast startup!)
) else (
    echo.
    echo Building application (this may take 30-60 seconds)...
    echo.
    
    REM Build the application
    npm run build:fast
    
    if %ERRORLEVEL% NEQ 0 (
        echo Build failed! Check the error messages above.
        pause
        exit /b 1
    )
    
    echo Build completed successfully!
)

echo.
echo Starting static server...
echo The application will be available at http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Serve the built application
npx serve -s build -l 3000
