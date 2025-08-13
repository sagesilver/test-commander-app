@echo off
setlocal
REM Safe cleanup; ignore errors and always exit 0

REM 1) Kill common hung processes
taskkill /F /IM node.exe      /T >nul 2>&1
taskkill /F /IM npm.exe       /T >nul 2>&1
taskkill /F /IM firebase.exe  /T >nul 2>&1
taskkill /F /IM conhost.exe   /T >nul 2>&1

REM 2) Only uncomment this line if you need to fix broken npm installs:
REM rmdir /S /Q "%~dp0functions\node_modules" >nul 2>&1

endlocal
exit /b 0
