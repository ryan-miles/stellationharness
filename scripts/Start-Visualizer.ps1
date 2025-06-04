# Infrastructure Visualizer Startup Script
# PowerShell version with better error handling

param(
    [switch]$Verbose
)

# Set console properties
$Host.UI.RawUI.WindowTitle = "Infrastructure Visualizer Startup"
Clear-Host

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 🚀 Infrastructure Visualizer Startup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to project root directory (one level up from scripts)
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectPath = Split-Path -Parent $ScriptPath
Set-Location $ProjectPath

Write-Host "📁 Project directory: $ProjectPath" -ForegroundColor Yellow
Write-Host ""

# Check Node.js installation
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Node.js detected: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm packages are installed
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing npm packages..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install npm packages" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "✅ npm packages installed successfully" -ForegroundColor Green
}

# Ensure cloud-utils.js is in src directory
if (!(Test-Path "src\cloud-utils.js")) {
    Write-Host "📋 Copying cloud-utils.js to src directory..." -ForegroundColor Yellow
    Copy-Item "cloud-utils.js" "src\" -ErrorAction SilentlyContinue
    if (Test-Path "src\cloud-utils.js") {
        Write-Host "✅ cloud-utils.js copied successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Warning: Could not copy cloud-utils.js" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🔧 Starting backend server..." -ForegroundColor Cyan

# Start backend server in new PowerShell window
$backendScript = @"
Set-Location '$ScriptPath'
`$Host.UI.RawUI.WindowTitle = 'Backend Server (Port 3001)'
Write-Host 'Starting Backend Server...' -ForegroundColor Green
node backend-server.js
Read-Host 'Backend server stopped. Press Enter to close'
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

# Wait for backend to start
Write-Host "⏳ Waiting 3 seconds for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Auto-sync API key
Write-Host "🔑 Checking API key synchronization..." -ForegroundColor Cyan
try {
    $testResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method GET -ErrorAction Stop
    Write-Host "✅ Backend health check passed" -ForegroundColor Green
    
    # Test if current API key works
    $configContent = Get-Content "src\js\config.js" -Raw
    $currentApiKey = ($configContent | Select-String "apiKey: '(sk_[a-f0-9]+)'" | ForEach-Object { $_.Matches[0].Groups[1].Value })
    
    if ($currentApiKey) {
        $headers = @{
            'x-api-key' = $currentApiKey
            'Content-Type' = 'application/json'
        }
        
        try {
            $authTest = Invoke-RestMethod -Uri "http://localhost:3001/api/all-instances" -Headers $headers -Method GET -ErrorAction Stop
            Write-Host "✅ API key is working correctly" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ API key mismatch detected - manual update needed" -ForegroundColor Yellow
            Write-Host "Look for the API key in the Backend Server window and update src/js/config.js" -ForegroundColor Yellow
            Read-Host "Press Enter when you've updated the API key"
        }
    } else {
        Write-Host "⚠️ Could not find API key in config file" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Could not verify backend connection" -ForegroundColor Yellow
}

Write-Host "🌐 Starting frontend server..." -ForegroundColor Cyan

# Start frontend server in new PowerShell window  
$frontendScript = @"
Set-Location '$ScriptPath'
`$Host.UI.RawUI.WindowTitle = 'Frontend Server (Port 8080)'
Write-Host 'Starting Frontend Server...' -ForegroundColor Green
npm start
Read-Host 'Frontend server stopped. Press Enter to close'
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript

# Wait for frontend to start
Write-Host "⏳ Waiting 5 seconds for frontend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "📖 Opening browser..." -ForegroundColor Cyan
Start-Process "http://127.0.0.1:8080"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 🎉 Infrastructure Visualizer Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Frontend: " -NoNewline -ForegroundColor White
Write-Host "http://127.0.0.1:8080" -ForegroundColor Blue
Write-Host "🔧 Backend:  " -NoNewline -ForegroundColor White  
Write-Host "http://localhost:3001" -ForegroundColor Blue
Write-Host ""
Write-Host "💡 Two PowerShell windows opened for the servers" -ForegroundColor Yellow
Write-Host "🔍 Check those windows if something isn't working" -ForegroundColor Yellow
Write-Host "🛑 Close those windows to stop the servers" -ForegroundColor Yellow
Write-Host ""

if ($Verbose) {
    Write-Host "🔧 Troubleshooting Tips:" -ForegroundColor Magenta
    Write-Host "• If no nodes appear, check the backend window for API key" -ForegroundColor Gray
    Write-Host "• Update src/js/config.js with the new API key if needed" -ForegroundColor Gray
    Write-Host "• Backend should show: 'Enhanced Multi-Cloud Backend API running'" -ForegroundColor Gray
    Write-Host "• Frontend should show: 'Serving src at http://127.0.0.1:8080'" -ForegroundColor Gray
    Write-Host ""
}

Read-Host "Press Enter to close this startup window"
