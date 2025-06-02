# Create Desktop Shortcut for Infrastructure Visualizer

$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ScriptPath = $PSScriptRoot
$ShortcutPath = Join-Path $DesktopPath "🚀 Infrastructure Visualizer.lnk"

# Create WScript Shell object
$WScriptShell = New-Object -ComObject WScript.Shell

# Create shortcut
$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = Join-Path $ScriptPath "START_VISUALIZER.bat"
$Shortcut.WorkingDirectory = $ScriptPath
$Shortcut.Description = "Infrastructure Visualizer - Double-click to start"
$Shortcut.IconLocation = "shell32.dll,137"  # Rocket-like icon
$Shortcut.Save()

Write-Host "✅ Desktop shortcut created: 🚀 Infrastructure Visualizer" -ForegroundColor Green
Write-Host "📍 Location: $ShortcutPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "Now you can double-click the desktop shortcut to start the visualizer!" -ForegroundColor Cyan

Read-Host "Press Enter to continue"
