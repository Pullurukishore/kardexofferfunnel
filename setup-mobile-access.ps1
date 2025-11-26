# Setup Mobile Access for Offer Funnel
# Run this script as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Offer Funnel - Mobile Access Setup" -ForegroundColor Cyan
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

# Get laptop IP address
Write-Host "[1/4] Detecting your laptop IP address..." -ForegroundColor Yellow
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"}).IPAddress | Select-Object -First 1

if (-not $ip) {
    Write-Host "ERROR: Could not detect local network IP" -ForegroundColor Red
    Write-Host "Make sure you're connected to WiFi" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Your laptop IP: $ip" -ForegroundColor Green
Write-Host ""

# Add firewall rules
Write-Host "[2/4] Configuring Windows Firewall..." -ForegroundColor Yellow

# Remove existing rules if present
Remove-NetFirewallRule -DisplayName "Offer Funnel Backend" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Offer Funnel Frontend" -ErrorAction SilentlyContinue

# Add new rules
New-NetFirewallRule -DisplayName "Offer Funnel Backend" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 5002 `
    -Action Allow `
    -Profile Any `
    -Description "Allow access to Offer Funnel Backend API" | Out-Null

New-NetFirewallRule -DisplayName "Offer Funnel Frontend" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 3002 `
    -Action Allow `
    -Profile Any `
    -Description "Allow access to Offer Funnel Frontend Web App" | Out-Null

Write-Host "Firewall rules added" -ForegroundColor Green
Write-Host ""

# Update backend CORS
Write-Host "[3/4] Updating CORS settings..." -ForegroundColor Yellow
$envPath = "c:\offer funnel\offer_backend\.env"

if (Test-Path $envPath) {
    $content = Get-Content $envPath -Raw
    
    # Update CORS_ORIGIN to allow all
    if ($content -match 'CORS_ORIGIN=') {
        $content = $content -replace 'CORS_ORIGIN=.*', 'CORS_ORIGIN=*'
    } else {
        $content += "`nCORS_ORIGIN=*"
    }
    
    $content | Set-Content $envPath -NoNewline
    Write-Host "CORS updated to allow all origins" -ForegroundColor Green
} else {
    Write-Host "WARNING: .env file not found at $envPath" -ForegroundColor Yellow
}
Write-Host ""

# Restart services
Write-Host "[4/4] Restarting services..." -ForegroundColor Yellow
Restart-Service OfferFunnelBackend -ErrorAction SilentlyContinue
Restart-Service OfferFunnelFrontend -ErrorAction SilentlyContinue

Start-Sleep -Seconds 3

# Verify services
$backendStatus = (Get-Service OfferFunnelBackend).Status
$frontendStatus = (Get-Service OfferFunnelFrontend).Status

Write-Host "Backend: $backendStatus" -ForegroundColor $(if ($backendStatus -eq 'Running') { 'Green' } else { 'Red' })
Write-Host "Frontend: $frontendStatus" -ForegroundColor $(if ($frontendStatus -eq 'Running') { 'Green' } else { 'Red' })
Write-Host ""

# Display results
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access from your mobile device:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Frontend:  http://${ip}:3002" -ForegroundColor Cyan
Write-Host "  Backend:   http://${ip}:5002/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Important:" -ForegroundColor Yellow
Write-Host "  1. Make sure your mobile is on the SAME WiFi network" -ForegroundColor Gray
Write-Host "  2. Open the frontend URL in your mobile browser" -ForegroundColor Gray
Write-Host "  3. Login with: admin@offerfunnel.com / admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "Troubleshooting:" -ForegroundColor Yellow
Write-Host "  - If connection fails, check if laptop and mobile are on same network" -ForegroundColor Gray
Write-Host "  - Try disabling VPN if you have one running" -ForegroundColor Gray
Write-Host "  - See MOBILE_ACCESS_SETUP.md for detailed troubleshooting" -ForegroundColor Gray
Write-Host ""

# Test connectivity
Write-Host "Testing connectivity..." -ForegroundColor Yellow
try {
    $backendTest = Invoke-WebRequest -Uri "http://${ip}:5002/api" -Method GET -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "Backend accessible at http://${ip}:5002/api" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Could not reach backend at http://${ip}:5002/api" -ForegroundColor Red
}

try {
    $frontendTest = Invoke-WebRequest -Uri "http://${ip}:3002" -Method GET -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "Frontend accessible at http://${ip}:3002" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Could not reach frontend at http://${ip}:3002" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
