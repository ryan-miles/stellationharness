# ⚙️ Utility Scripts

This folder contains automation scripts and utilities for the NewCo Infrastructure Visualizer.

## 🚀 Startup Scripts

### Windows Batch Files
- **`START_VISUALIZER.bat`** - Start the visualizer (Windows batch)
- **`STOP_VISUALIZER.bat`** - Stop the visualizer (Windows batch)
- **`FIX_API_KEY.bat`** - API key troubleshooting utility

### PowerShell Scripts
- **`Start-Visualizer.ps1`** - Start the visualizer (PowerShell)
- **`Create-Desktop-Shortcut.ps1`** - Creates desktop shortcut for easy access
- **`Update-ApiKey.ps1`** - Interactive API key update utility

## 🔧 Usage Instructions

### Quick Start (Windows)
```cmd
# Double-click or run from command line
scripts\START_VISUALIZER.bat
```

### PowerShell Usage
```powershell
# Run from project root
.\scripts\Start-Visualizer.ps1
.\scripts\Create-Desktop-Shortcut.ps1
```

### API Key Management
```cmd
# If having API key issues
scripts\FIX_API_KEY.bat

# Or use PowerShell version
scripts\Update-ApiKey.ps1
```

## 📋 Script Details

| Script | Purpose | Platform |
|--------|---------|----------|
| `START_VISUALIZER.bat` | Launch backend + frontend | Windows |
| `Start-Visualizer.ps1` | Launch with enhanced features | PowerShell |
| `STOP_VISUALIZER.bat` | Gracefully stop services | Windows |
| `Create-Desktop-Shortcut.ps1` | Desktop shortcut creation | PowerShell |
| `Update-ApiKey.ps1` | Interactive API key update | PowerShell |
| `FIX_API_KEY.bat` | API key troubleshooting | Windows |

## 📁 Navigation
- **[← Back to Main Project](../README.md)**
- **[View Documentation](../docs/)**
- **[View Tests](../tests/)**

---
*Automation scripts for easier project management*
