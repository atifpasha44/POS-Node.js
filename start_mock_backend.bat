@echo off
echo ===============================================
echo Starting Mock POS Backend Server for Testing
echo ===============================================
echo.
echo Checking if port 3001 is free...
netstat -ano | findstr :3001
if %ERRORLEVEL% EQU 0 (
    echo Port 3001 is in use, killing existing processes...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /F /PID %%a 2>nul
    timeout /t 2 >nul
)

echo.
echo Starting mock backend server...
cd /d "d:\pos-notejs\POS-Node.js"
node mock_backend.js

pause