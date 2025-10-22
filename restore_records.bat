@echo off
echo.
echo ========================================
echo  Property Records Restoration Tool
echo ========================================
echo.

echo Checking if backend server is running...
curl -s http://localhost:3001/api/property-codes > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend server is not running!
    echo.
    echo Please start the backend server first:
    echo    1. Open a new terminal
    echo    2. Run: cd backend
    echo    3. Run: node index.js
    echo.
    echo Then run this script again.
    pause
    exit /b 1
)

echo ✅ Backend server is running
echo.
echo 🔄 Starting property records restoration...
node restore_records.js

echo.
echo Press any key to exit...
pause > nul