@echo off
title Stop Infrastructure Visualizer
color 0C

echo.
echo ========================================
echo  🛑 Stop Infrastructure Visualizer
echo ========================================
echo.

echo 🔍 Looking for running servers...

REM Kill processes on port 3001 (backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    echo 🔧 Stopping backend server (PID: %%a)
    taskkill /PID %%a /F >nul 2>&1
)

REM Kill processes on port 8080 (frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do (
    echo 🌐 Stopping frontend server (PID: %%a)
    taskkill /PID %%a /F >nul 2>&1
)

REM Kill any remaining node processes related to our project
tasklist /FI "IMAGENAME eq node.exe" /FO CSV | findstr "node.exe" >nul
if not errorlevel 1 (
    echo 🧹 Cleaning up any remaining Node.js processes...
    taskkill /IM node.exe /F >nul 2>&1
)

echo.
echo ✅ Infrastructure Visualizer stopped!
echo.
echo Press any key to close...
pause >nul
