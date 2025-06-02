@echo off
title Fix API Key - Infrastructure Visualizer
color 0E

echo.
echo ========================================
echo  🔑 Fix API Key Mismatch
echo ========================================
echo.

echo 🔍 The nodes aren't showing because the API key is wrong.
echo 📋 Here's how to fix it:
echo.

echo 1. Look at your "Backend Server" window
echo 2. Find this line: "🔑 Default admin API key created: sk_..."
echo 3. Copy the ENTIRE key (it starts with 'sk_' and is very long)
echo 4. Press any key here to open the config file
echo.

pause

echo 📝 Opening config file...
notepad "src\js\config.js"

echo.
echo 🔧 Instructions for the config file:
echo.
echo 1. Find the line that says: apiKey: 'sk_...'
echo 2. Replace the old key with your new key from the backend
echo 3. Make sure it's inside the quotes: apiKey: 'sk_your_new_key_here'
echo 4. Save the file (Ctrl+S)
echo 5. Close Notepad
echo 6. Refresh your browser page
echo.

echo ✅ After you save the file, refresh the browser!
echo 🎉 Your nodes should now appear!
echo.

pause
