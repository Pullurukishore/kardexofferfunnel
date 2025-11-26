# Mobile Access Setup Guide

This guide shows how to access your Offer Funnel application from mobile devices on the same network.

## Quick Setup Steps

### 1. Find Your Laptop's IP Address

```powershell
# Run this command to get your IP
ipconfig | findstr IPv4
```

Example output: `192.168.1.100` (your IP will be different)

### 2. Update Backend CORS Settings

Edit `c:\offer funnel\offer_backend\.env` and change:

```env
# FROM:
CORS_ORIGIN=http://localhost:3002

# TO (allow all origins):
CORS_ORIGIN=*
```

**OR** specify your mobile's IP range:
```env
CORS_ORIGIN=http://192.168.1.*:3002
```

### 3. Configure Windows Firewall

**Option A: Quick Setup (Recommended)**

Run this PowerShell command as Administrator:

```powershell
# Allow Backend (Port 5002)
New-NetFirewallRule -DisplayName "Offer Funnel Backend" -Direction Inbound -Protocol TCP -LocalPort 5002 -Action Allow

# Allow Frontend (Port 3002)
New-NetFirewallRule -DisplayName "Offer Funnel Frontend" -Direction Inbound -Protocol TCP -LocalPort 3002 -Action Allow
```

**Option B: Manual Setup**

1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port: `5002`
6. Select "Allow the connection"
7. Check all profiles (Domain, Private, Public)
8. Name it "Offer Funnel Backend"
9. Repeat for port `3002` (Frontend)

### 4. Restart Services

```powershell
Restart-Service OfferFunnelBackend
Restart-Service OfferFunnelFrontend
```

### 5. Access from Mobile

On your mobile device (connected to same WiFi):

**Replace `192.168.1.100` with YOUR laptop's IP:**

- **Frontend**: http://192.168.1.100:3002
- **Backend API**: http://192.168.1.100:5002/api

## Testing Connection

### From Your Laptop

```powershell
# Get your IP
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}).IPAddress
Write-Host "Your IP: $ip"

# Test backend
Invoke-WebRequest -Uri "http://${ip}:5002/api" -UseBasicParsing

# Test frontend
Invoke-WebRequest -Uri "http://${ip}:3002" -UseBasicParsing
```

### From Mobile Browser

1. Open browser on mobile
2. Go to: `http://YOUR_LAPTOP_IP:3002`
3. You should see the login page

## Troubleshooting

### Issue: "Cannot connect" or "Connection refused"

**Check 1: Firewall Rules**
```powershell
Get-NetFirewallRule -DisplayName "*Offer Funnel*" | Select-Object DisplayName, Enabled, Direction
```

**Check 2: Services Running**
```powershell
Get-Service OfferFunnel* | Select-Object Name, Status
```

**Check 3: Ports Listening**
```powershell
netstat -ano | findstr :5002
netstat -ano | findstr :3002
```

**Check 4: Same Network**
- Ensure mobile and laptop are on same WiFi network
- Some guest networks block device-to-device communication

### Issue: "CORS Error" in Mobile Browser

Update backend `.env`:
```env
CORS_ORIGIN=*
```

Then restart backend:
```powershell
Restart-Service OfferFunnelBackend
```

### Issue: Frontend Loads but Can't Connect to Backend

The frontend needs to know your laptop's IP. 

**Option 1: Environment Variable (Recommended)**

Edit `c:\offer funnel\offer_frontend\.env.local`:

```env
# Replace with your laptop's IP
NEXT_PUBLIC_API_URL=http://192.168.1.100:5002/api
```

Rebuild and restart:
```powershell
Stop-Service OfferFunnelFrontend
cd "c:\offer funnel\offer_frontend"
npm run build
Start-Service OfferFunnelFrontend
```

**Option 2: Dynamic Detection**

The frontend should automatically detect the backend URL, but if it doesn't work, use Option 1.

### Issue: Works on Laptop but Not Mobile

**Check Network Type:**
```powershell
Get-NetConnectionProfile
```

If it shows "Public", Windows blocks incoming connections by default.

**Change to Private Network:**
```powershell
Set-NetConnectionProfile -NetworkCategory Private
```

## Security Considerations

### For Development (Current Setup)

✅ **CORS_ORIGIN=*** - Allows all origins (easy for testing)  
⚠️ **No HTTPS** - Data sent unencrypted on local network  
⚠️ **Firewall Open** - Ports accessible to anyone on network  

### For Production

If you want to make this more secure:

1. **Use specific CORS origins:**
   ```env
   CORS_ORIGIN=http://192.168.1.100:3002,http://192.168.1.101:3002
   ```

2. **Restrict firewall to local network:**
   ```powershell
   Set-NetFirewallRule -DisplayName "Offer Funnel Backend" -RemoteAddress LocalSubnet
   Set-NetFirewallRule -DisplayName "Offer Funnel Frontend" -RemoteAddress LocalSubnet
   ```

3. **Use HTTPS** (requires SSL certificate setup)

## Complete Setup Script

Save this as `setup-mobile-access.ps1` and run as Administrator:

```powershell
# Get laptop IP
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}).IPAddress

Write-Host "Setting up mobile access..." -ForegroundColor Cyan
Write-Host "Your laptop IP: $ip" -ForegroundColor Yellow
Write-Host ""

# Add firewall rules
Write-Host "Adding firewall rules..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "Offer Funnel Backend" -Direction Inbound -Protocol TCP -LocalPort 5002 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Offer Funnel Frontend" -Direction Inbound -Protocol TCP -LocalPort 3002 -Action Allow -ErrorAction SilentlyContinue

# Update backend CORS
Write-Host "Updating CORS settings..." -ForegroundColor Yellow
$envPath = "c:\offer funnel\offer_backend\.env"
$content = Get-Content $envPath
$content = $content -replace 'CORS_ORIGIN=.*', 'CORS_ORIGIN=*'
$content | Set-Content $envPath

# Restart services
Write-Host "Restarting services..." -ForegroundColor Yellow
Restart-Service OfferFunnelBackend
Restart-Service OfferFunnelFrontend

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Access from mobile:" -ForegroundColor Yellow
Write-Host "  Frontend: http://${ip}:3002" -ForegroundColor Cyan
Write-Host "  Backend:  http://${ip}:5002/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Make sure your mobile is on the same WiFi network!" -ForegroundColor Yellow
```

## Quick Reference

| What | Command |
|------|---------|
| Get your IP | `ipconfig \| findstr IPv4` |
| Test backend | `curl http://YOUR_IP:5002/api` |
| Test frontend | `curl http://YOUR_IP:3002` |
| Check firewall | `Get-NetFirewallRule -DisplayName "*Offer*"` |
| Restart services | `Restart-Service OfferFunnel*` |

## Mobile Browser Recommendations

- **Chrome** (Android) - Best compatibility
- **Safari** (iOS) - Works well
- **Firefox** - Good alternative

## Notes

- Your laptop IP may change if you reconnect to WiFi
- If IP changes, mobile users need to use the new IP
- Consider setting a static IP on your laptop for consistency
- Some corporate networks block device-to-device communication

---

**Need Help?** Check the troubleshooting section or review firewall/CORS settings.
