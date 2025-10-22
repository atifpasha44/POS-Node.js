@echo off
echo ===================================
echo Starting POS Backend Server
echo ===================================
echo.
echo Checking port 3001...
netstat -ano | findstr :3001
if %ERRORLEVEL% EQU 0 (
    echo Port 3001 is already in use!
    echo Stopping existing processes...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /F /PID %%a 2>nul
    timeout /t 2 >nul
)

echo.
echo Starting backend server...
cd /d "d:\pos-notejs\POS-Node.js\backend"
echo Current directory: %CD%
echo.

:: Try to start the server
node index.js