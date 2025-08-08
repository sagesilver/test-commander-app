@echo off
echo Rebuilding Test Commander...
echo.

REM Remove existing build folder
if exist "build" (
    echo Removing existing build folder...
    rmdir /s /q build
)

REM Build the application
echo Building application (this may take 30-60 seconds)...
npm run build:fast

if %ERRORLEVEL% NEQ 0 (
    echo Build failed! Check the error messages above.
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo You can now run bs.bat for fast startup.
echo.
