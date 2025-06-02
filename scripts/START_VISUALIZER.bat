@echo off
title Infrastructure Visualizer Startup
color 0A

echo.
echo ========================================
echo  🚀 Infrastructure Visualizer Startup
echo ========================================
echo.

REM Change to the project directory
cd /d "%~dp0"

echo 📁 Current directory: %CD%
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected: 
node --version

REM Check if npm packages are installed
if not exist "node_modules" (
    echo 📦 Installing npm packages...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install npm packages
        pause
        exit /b 1
    )
)

REM Ensure cloud-utils.js is copied to src directory
if not exist "src\cloud-utils.js" (
    echo 📋 Copying cloud-utils.js to src directory...
    copy "cloud-utils.js" "src\" >nul
)

echo.
echo 🔧 Starting backend server...
echo ⚡ This will open in a new window

REM Start backend server in a new window and capture API key
start "Backend Server" /min cmd /k "echo Backend Server Starting... && node backend-server.js"

REM Wait for backend to start and extract API key
timeout /t 5 /nobreak >nul

echo 🔑 Extracting API key from backend...
REM Use PowerShell to get the API key from the backend health endpoint
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/health' -Method GET; Write-Host 'Backend is ready' } catch { Write-Host 'Backend starting...' }"

timeout /t 2 /nobreak >nul

echo 🌐 Starting frontend server...
echo ⚡ This will open in a new window

REM Start frontend server in a new window
start "Frontend Server" /min cmd /k "echo Frontend Server Starting... && npm start"

REM Wait a moment for frontend to start
timeout /t 5 /nobreak >nul

echo.
echo ✅ Servers are starting up!
echo.
echo 📖 Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul

REM Open browser
start "" "http://127.0.0.1:8080"

echo.
echo ========================================
echo  🎉 Infrastructure Visualizer Started!
echo ========================================
echo.
echo 🌐 Frontend: http://127.0.0.1:8080
echo 🔧 Backend:  http://localhost:3001
echo.
echo 💡 Two new windows opened for the servers
echo 🔍 Check those windows if something isn't working
echo.
echo ⚠️  IF NODES DON'T APPEAR:
echo    Double-click FIX_API_KEY.bat to fix it!
echo.
echo Press any key to close this window...
pause >nul
