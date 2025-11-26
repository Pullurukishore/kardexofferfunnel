# Windows Services - Installation Complete ✅

## Service Status

Both services are **successfully installed and running**!

| Service | Status | Port | Auto-Start |
|---------|--------|------|------------|
| **OfferFunnelBackend** | ✅ Running | 5002 | Yes |
| **OfferFunnelFrontend** | ✅ Running | 3002 | Yes |

## Access Your Application

- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:5002/api

## What Happens Now

✅ **Automatic Startup**: Both services will start automatically when Windows boots  
✅ **Auto-Recovery**: Services restart automatically if they crash  
✅ **Background Running**: No need to keep terminal windows open  
✅ **Production Mode**: Running with NODE_ENV=production  

## Service Management

### View Status
```powershell
Get-Service OfferFunnel*
```

### Stop Services
```powershell
Stop-Service OfferFunnelBackend
Stop-Service OfferFunnelFrontend
```

### Start Services
```powershell
Start-Service OfferFunnelBackend
Start-Service OfferFunnelFrontend
```

### Restart Services
```powershell
Restart-Service OfferFunnelBackend
Restart-Service OfferFunnelFrontend
```

### Open Windows Services Manager
```powershell
services.msc
```

## Log Files

Logs are automatically rotated at 10MB:

- **Backend Logs**: `c:\offer funnel\offer_backend\logs\`
  - `service-output.log` - Standard output
  - `service-error.log` - Error messages

- **Frontend Logs**: `c:\offer funnel\offer_frontend\logs\`
  - `service-output.log` - Standard output
  - `service-error.log` - Error messages

### View Recent Logs
```powershell
# Backend logs
Get-Content "c:\offer funnel\offer_backend\logs\service-output.log" -Tail 50

# Frontend logs
Get-Content "c:\offer funnel\offer_frontend\logs\service-output.log" -Tail 50
```

## Updating Your Code

When you make changes:

1. **Stop services**:
   ```powershell
   Stop-Service OfferFunnelBackend
   Stop-Service OfferFunnelFrontend
   ```

2. **Rebuild**:
   ```powershell
   # Backend
   cd "c:\offer funnel\offer_backend"
   npm run build
   
   # Frontend
   cd "c:\offer funnel\offer_frontend"
   npm run build
   ```

3. **Start services**:
   ```powershell
   Start-Service OfferFunnelBackend
   Start-Service OfferFunnelFrontend
   ```

## Uninstalling Services

To remove the services:

```powershell
cd "c:\offer funnel"
.\uninstall-services-nssm.ps1
```

## Testing After Reboot

To verify everything works after a restart:

1. Restart your laptop
2. Wait 30 seconds for services to start
3. Open browser to http://localhost:3002
4. You should see the login page

## Port Configuration

- **Backend**: Port 5002 (configured in `offer_backend\.env`)
- **Frontend**: Port 3002 (configured in service)

If you need to change ports, update the `.env` files and restart services.

## Troubleshooting

### Services Won't Start

Check Event Viewer:
```powershell
eventvwr.msc
```
Navigate to: Windows Logs → Application

### Check if Ports are in Use
```powershell
netstat -ano | findstr :5002
netstat -ano | findstr :3002
```

### Manually Test Backend
```powershell
cd "c:\offer funnel\offer_backend"
node dist\server.js
```

### Manually Test Frontend
```powershell
cd "c:\offer funnel\offer_frontend"
npm start
```

## NSSM Commands

```powershell
# View service configuration
.\nssm.exe dump OfferFunnelBackend

# Edit service (opens GUI)
.\nssm.exe edit OfferFunnelBackend

# Check service status
.\nssm.exe status OfferFunnelBackend

# Restart service
.\nssm.exe restart OfferFunnelBackend
```

## Success! 🎉

Your Offer Funnel application is now running as Windows services. No need to start it manually every day - it will be ready whenever your laptop boots!

---

**Installation Date**: 2025-11-09  
**NSSM Version**: 2.24  
**Setup Method**: Automated installation script
