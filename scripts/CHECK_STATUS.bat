@echo off
title Infrastructure Visualizer Status Check
color 0A

echo.
echo ========================================
echo  🔍 Infrastructure Visualizer Status
echo ========================================
echo.

echo 🔧 Checking Backend Server (port 3001)...
curl -f http://localhost:3001/api/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend Server: NOT RUNNING
    echo    Expected at: http://localhost:3001
) else (
    echo ✅ Backend Server: RUNNING
    echo    Health check: http://localhost:3001/api/health
)

echo.
echo 🌐 Checking Frontend Server (port 8080)...
curl -I http://127.0.0.1:8080 >nul 2>&1
if errorlevel 1 (
    echo ❌ Frontend Server: NOT RUNNING
    echo    Expected at: http://127.0.0.1:8080
) else (
    echo ✅ Frontend Server: RUNNING
    echo    Web interface: http://127.0.0.1:8080
)

echo.
echo ========================================
echo.
echo 💡 If servers are not running, use:
echo    START_VISUALIZER.bat to start them
echo.
echo 🌐 If servers are running, open:
echo    http://127.0.0.1:8080
echo.
pause
