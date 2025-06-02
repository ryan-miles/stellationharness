# 🚀 Quick Start - Double-Click Scripts

## One-Click Startup Options

### Option 1: Batch File (Recommended)
**Double-click: `START_VISUALIZER.bat`**
- ✅ Works on all Windows systems
- ✅ No execution policy issues
- ✅ Automatic dependency checking
- ✅ Opens browser automatically

### Option 2: PowerShell Script (Advanced)
**Right-click `Start-Visualizer.ps1` → "Run with PowerShell"**
- ✅ Better error handling and colors
- ✅ More detailed status information
- ⚠️ May require execution policy changes

## To Stop Everything
**Double-click: `STOP_VISUALIZER.bat`**
- Cleanly stops all servers
- Kills processes on ports 3001 and 8080

## What the Scripts Do

1. **Check Node.js** is installed
2. **Install npm packages** (if needed)  
3. **Copy required files** to correct locations
4. **Start backend server** in new window (port 3001)
5. **Start frontend server** in new window (port 8080)
6. **Open browser** to http://127.0.0.1:8080

## Troubleshooting

### ⚠️ **If nodes don't appear (MOST COMMON ISSUE):**
**Double-click: `FIX_API_KEY.bat`**
- This happens because the backend generates a new API key each time
- The fix script walks you through updating the key
- Takes 30 seconds to fix

### If PowerShell script won't run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### If nodes don't appear:
1. Check the backend server window for the API key
2. Copy the new API key from the backend logs
3. Update `src/js/config.js` with the new key
4. Refresh the browser

### If ports are in use:
1. Run `STOP_VISUALIZER.bat` first
2. Then run the startup script again

## Files Created:
- `START_VISUALIZER.bat` - Main startup script
- `Start-Visualizer.ps1` - PowerShell version 
- `STOP_VISUALIZER.bat` - Cleanup script

That's it! Just double-click `START_VISUALIZER.bat` and you're ready to go! 🎉
