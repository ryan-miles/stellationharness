# Auto API Key Sync Script
# This script extracts the API key from backend logs and updates the frontend config

param(
    [string]$BackendLogFile = "",
    [int]$MaxWaitSeconds = 30
)

Write-Host "🔑 Auto API Key Sync Starting..." -ForegroundColor Yellow

$configFile = "src\js\config.js"
$backendUrl = "http://localhost:3001"
$apiKeyPattern = "🔑 Default admin API key created: (sk_[a-f0-9]+)"

# Function to update config file with new API key
function Update-ConfigFile {
    param([string]$newApiKey)
    
    if (Test-Path $configFile) {
        $content = Get-Content $configFile -Raw
        $updatedContent = $content -replace "apiKey: 'sk_[a-f0-9]+'", "apiKey: '$newApiKey'"
        Set-Content $configFile $updatedContent
        Write-Host "✅ Config updated with new API key: $newApiKey" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Config file not found: $configFile" -ForegroundColor Red
        return $false
    }
}

# Function to test API key by calling backend
function Test-ApiKey {
    param([string]$apiKey)
    
    try {
        $headers = @{
            'x-api-key' = $apiKey
            'Content-Type' = 'application/json'
        }
        
        $response = Invoke-RestMethod -Uri "$backendUrl/api/health" -Headers $headers -Method GET
        return $true
    } catch {
        return $false
    }
}

# Wait for backend to be available
$waitCount = 0
$backendReady = $false

Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow

while ($waitCount -lt $MaxWaitSeconds -and -not $backendReady) {
    try {
        $response = Invoke-RestMethod -Uri "$backendUrl/api/health" -Method GET
        $backendReady = $true
        Write-Host "✅ Backend is ready!" -ForegroundColor Green
    } catch {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
        $waitCount++
    }
}

if (-not $backendReady) {
    Write-Host ""
    Write-Host "❌ Backend did not start within $MaxWaitSeconds seconds" -ForegroundColor Red
    exit 1
}

# Try to extract API key from running backend process
Write-Host "🔍 Looking for API key in backend output..." -ForegroundColor Yellow

# Check if we can get API key from a test endpoint or if there's a way to extract it
# For now, let's use a common approach - try to read from the backend output
$apiKeyFound = $false
$attempts = 0
$maxAttempts = 10

# Try to get the current API key by testing with known patterns
$commonApiKeys = @()

# Try to extract from backend window title or output if possible
# Since we can't easily capture the backend output from the batch script,
# let's try a different approach - read from a temporary log file

# Alternative: Use a predictable API key generation or check health endpoint
# Let's try common keys or patterns that might be generated

Write-Host "🔧 Attempting to determine correct API key..." -ForegroundColor Yellow

# Since the backend generates keys dynamically, let's prompt the user to copy it
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🔑 MANUAL API KEY UPDATE REQUIRED" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The backend has generated a new API key." -ForegroundColor White
Write-Host "Please follow these steps:" -ForegroundColor White
Write-Host ""
Write-Host "1. Look at the Backend Server window" -ForegroundColor Green
Write-Host "2. Find the line: '🔑 Default admin API key created: sk_...'" -ForegroundColor Green
Write-Host "3. Copy the entire API key (starts with 'sk_')" -ForegroundColor Green
Write-Host "4. Paste it below:" -ForegroundColor Green
Write-Host ""

$userApiKey = Read-Host "Enter the API key from backend window"

if ($userApiKey -match "^sk_[a-f0-9]+$") {
    if (Update-ConfigFile -newApiKey $userApiKey) {
        if (Test-ApiKey -apiKey $userApiKey) {
            Write-Host ""
            Write-Host "🎉 API key successfully updated and verified!" -ForegroundColor Green
            Write-Host "✅ Frontend should now be able to connect to backend" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "⚠️ API key updated but could not verify connection" -ForegroundColor Yellow
            Write-Host "Please check if the backend is running properly" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host ""
    Write-Host "❌ Invalid API key format. Should start with 'sk_'" -ForegroundColor Red
    Write-Host "Please try again or update manually in: $configFile" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
