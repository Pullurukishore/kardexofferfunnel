# Offer Funnel - NSSM Service Installation Script
# This script installs both frontend and backend as Windows services using NSSM
# Run this script as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Offer Funnel - NSSM Service Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

$projectRoot = "c:\offer funnel"
$backendPath = Join-Path $projectRoot "offer_backend"
$frontendPath = Join-Path $projectRoot "offer_frontend"
$nssmPath = Join-Path $projectRoot "nssm.exe"

# Step 1: Check/Download NSSM
Write-Host "[1/6] Checking for NSSM..." -ForegroundColor Yellow

if (-not (Test-Path $nssmPath)) {
    Write-Host "NSSM not found. Downloading..." -ForegroundColor Gray
    
    $nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
    $nssmZip = Join-Path $projectRoot "nssm.zip"
    
    try {
        Invoke-WebRequest -Uri $nssmUrl -OutFile $nssmZip -UseBasicParsing
        
        # Extract nssm.exe (64-bit version)
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $zip = [System.IO.Compression.ZipFile]::OpenRead($nssmZip)
        $entry = $zip.Entries | Where-Object { $_.FullName -like "*/win64/nssm.exe" } | Select-Object -First 1
        
        if ($entry) {
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $nssmPath, $true)
            Write-Host "NSSM downloaded successfully" -ForegroundColor Green
        } else {
            Write-Host "ERROR: Could not find nssm.exe in archive" -ForegroundColor Red
            exit 1
        }
        
        $zip.Dispose()
        Remove-Item $nssmZip -Force
    } catch {
        Write-Host "ERROR: Failed to download NSSM: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please download NSSM manually:" -ForegroundColor Yellow
        Write-Host "1. Visit: https://nssm.cc/download" -ForegroundColor Gray
        Write-Host "2. Download nssm-2.24.zip" -ForegroundColor Gray
        Write-Host "3. Extract win64\nssm.exe to: $projectRoot" -ForegroundColor Gray
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "NSSM found" -ForegroundColor Green
}
Write-Host ""

# Step 2: Build Backend
Write-Host "[2/6] Building Backend..." -ForegroundColor Yellow
Set-Location $backendPath

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Gray
    npm install
}

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Backend build failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Backend built successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Build Frontend
Write-Host "[3/6] Building Frontend..." -ForegroundColor Yellow
Set-Location $frontendPath

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Gray
    npm install
}

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend build failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Frontend built successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Install Backend Service
Write-Host "[4/6] Installing Backend Service..." -ForegroundColor Yellow

# Remove existing service if present
& $nssmPath stop OfferFunnelBackend 2>$null
& $nssmPath remove OfferFunnelBackend confirm 2>$null

# Get node.exe path
$nodePath = (Get-Command node).Source

# Install service
& $nssmPath install OfferFunnelBackend "$nodePath" "dist\server.js"
& $nssmPath set OfferFunnelBackend AppDirectory "$backendPath"
& $nssmPath set OfferFunnelBackend DisplayName "Offer Funnel Backend"
& $nssmPath set OfferFunnelBackend Description "Offer Funnel Backend API Service"
& $nssmPath set OfferFunnelBackend Start SERVICE_AUTO_START

# Set environment variables
& $nssmPath set OfferFunnelBackend AppEnvironmentExtra NODE_ENV=production

# Configure logging
$backendLogPath = Join-Path $backendPath "logs"
if (-not (Test-Path $backendLogPath)) {
    New-Item -ItemType Directory -Path $backendLogPath -Force | Out-Null
}
& $nssmPath set OfferFunnelBackend AppStdout "$backendLogPath\service-output.log"
& $nssmPath set OfferFunnelBackend AppStderr "$backendLogPath\service-error.log"
& $nssmPath set OfferFunnelBackend AppRotateFiles 1
& $nssmPath set OfferFunnelBackend AppRotateBytes 10485760

# Configure restart behavior
& $nssmPath set OfferFunnelBackend AppExit Default Restart
& $nssmPath set OfferFunnelBackend AppRestartDelay 5000

Write-Host "Backend service installed" -ForegroundColor Green
Write-Host ""

# Step 5: Install Frontend Service
Write-Host "[5/6] Installing Frontend Service..." -ForegroundColor Yellow

# Remove existing service if present
& $nssmPath stop OfferFunnelFrontend 2>$null
& $nssmPath remove OfferFunnelFrontend confirm 2>$null

# Install service (use direct path to next.js, not .cmd wrapper)
& $nssmPath install OfferFunnelFrontend "$nodePath" "node_modules\next\dist\bin\next" "start" "-p" "3002"
& $nssmPath set OfferFunnelFrontend AppDirectory "$frontendPath"
& $nssmPath set OfferFunnelFrontend DisplayName "Offer Funnel Frontend"
& $nssmPath set OfferFunnelFrontend Description "Offer Funnel Frontend Web Application"
& $nssmPath set OfferFunnelFrontend Start SERVICE_AUTO_START

# Set environment variables
& $nssmPath set OfferFunnelFrontend AppEnvironmentExtra NODE_ENV=production

# Configure logging
$frontendLogPath = Join-Path $frontendPath "logs"
if (-not (Test-Path $frontendLogPath)) {
    New-Item -ItemType Directory -Path $frontendLogPath -Force | Out-Null
}
& $nssmPath set OfferFunnelFrontend AppStdout "$frontendLogPath\service-output.log"
& $nssmPath set OfferFunnelFrontend AppStderr "$frontendLogPath\service-error.log"
& $nssmPath set OfferFunnelFrontend AppRotateFiles 1
& $nssmPath set OfferFunnelFrontend AppRotateBytes 10485760

# Configure restart behavior
& $nssmPath set OfferFunnelFrontend AppExit Default Restart
& $nssmPath set OfferFunnelFrontend AppRestartDelay 5000

Write-Host "Frontend service installed" -ForegroundColor Green
Write-Host ""

# Step 6: Start Services
Write-Host "[6/6] Starting Services..." -ForegroundColor Yellow

& $nssmPath start OfferFunnelBackend
Start-Sleep -Seconds 3

& $nssmPath start OfferFunnelFrontend
Start-Sleep -Seconds 3

Write-Host "Services started" -ForegroundColor Green
Write-Host ""

# Verify services
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verifying Services..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendService = Get-Service -Name "OfferFunnelBackend" -ErrorAction SilentlyContinue
$frontendService = Get-Service -Name "OfferFunnelFrontend" -ErrorAction SilentlyContinue

if ($backendService) {
    Write-Host "Backend Service:" -ForegroundColor Yellow
    Write-Host "  Name: $($backendService.Name)" -ForegroundColor Gray
    Write-Host "  Status: $($backendService.Status)" -ForegroundColor $(if ($backendService.Status -eq 'Running') { 'Green' } else { 'Red' })
    Write-Host "  Startup: $($backendService.StartType)" -ForegroundColor Gray
    Write-Host "  Logs: $backendLogPath" -ForegroundColor Gray
    Write-Host ""
}

if ($frontendService) {
    Write-Host "Frontend Service:" -ForegroundColor Yellow
    Write-Host "  Name: $($frontendService.Name)" -ForegroundColor Gray
    Write-Host "  Status: $($frontendService.Status)" -ForegroundColor $(if ($frontendService.Status -eq 'Running') { 'Green' } else { 'Red' })
    Write-Host "  Startup: $($frontendService.StartType)" -ForegroundColor Gray
    Write-Host "  Logs: $frontendLogPath" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your applications are now running as Windows services!" -ForegroundColor Green
Write-Host "They will start automatically when your laptop boots." -ForegroundColor Green
Write-Host ""
Write-Host "Access your application:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:3002" -ForegroundColor Cyan
Write-Host "  Backend API: http://localhost:5001/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Manage services:" -ForegroundColor Yellow
Write-Host "  View status: Get-Service OfferFunnel*" -ForegroundColor Gray
Write-Host "  Stop: Stop-Service OfferFunnelBackend" -ForegroundColor Gray
Write-Host "  Start: Start-Service OfferFunnelBackend" -ForegroundColor Gray
Write-Host "  Services Manager: services.msc" -ForegroundColor Gray
Write-Host ""
Write-Host "View logs:" -ForegroundColor Yellow
Write-Host "  Backend: $backendLogPath" -ForegroundColor Gray
Write-Host "  Frontend: $frontendLogPath" -ForegroundColor Gray
Write-Host ""
Write-Host "To uninstall: .\uninstall-services-nssm.ps1" -ForegroundColor Yellow
Write-Host ""

Read-Host "Press Enter to exit"
