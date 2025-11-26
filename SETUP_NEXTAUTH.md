# NextAuth Setup Guide - Quick Start

## 🚀 Required Steps to Complete Setup

### 1. Add Environment Variables

You need to add these to your `.env` file in `offer_frontend`:

```bash
# Navigate to frontend directory
cd offer_frontend

# Generate a secure secret
openssl rand -base64 32

# Create/update .env file with:
NEXT_PUBLIC_API_URL=http://localhost:5002/api
NEXTAUTH_SECRET=<paste-generated-secret-here>
NEXTAUTH_URL=http://localhost:3000
```

**Windows users without openssl:**
```powershell
# Generate random string in PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### 2. Install Dependencies (Already Done)
```bash
npm install next-auth@latest
```

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd offer_backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd offer_frontend
npm run dev
```

### 4. Test Login

1. Open `http://localhost:3000/auth/login`
2. Enter your credentials
3. Should redirect to your dashboard based on role

## ✅ Verification Checklist

- [ ] `.env` file has `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
- [ ] Backend is running on port 5002
- [ ] Frontend is running on port 3000
- [ ] Login redirects to correct dashboard
- [ ] Logout works and redirects to login
- [ ] No errors in browser console
- [ ] Cookies show `next-auth.session-token` (httpOnly)

## 🔍 Troubleshooting

### Error: "NEXTAUTH_SECRET is not defined"
**Solution:** Add `NEXTAUTH_SECRET` to your `.env` file

### Error: "Cannot connect to backend"
**Solution:** Ensure backend is running and `NEXT_PUBLIC_API_URL` is correct

### Login doesn't work
**Solution:** 
1. Check backend logs for errors
2. Verify backend `/auth/login` endpoint is working
3. Check browser console for errors

### Session not persisting
**Solution:**
1. Clear browser cookies
2. Restart frontend dev server
3. Check `NEXTAUTH_URL` matches your frontend URL

## 📝 Key Files Created/Modified

### New Files:
- `src/lib/auth.ts` - NextAuth configuration
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- `src/app/providers.tsx` - SessionProvider wrapper

### Modified Files:
- `src/contexts/AuthContext.tsx` - Simplified to use NextAuth
- `src/app/layout.tsx` - Uses Providers component
- `.env.example` - Added NextAuth variables

## 🎯 What Changed

### Before:
- Complex cookie manipulation
- localStorage fallbacks
- 662 lines of auth code
- Manual session management

### After:
- NextAuth handles everything
- httpOnly cookies (secure)
- 140 lines of auth code
- Automatic session management

## 🔒 Security Notes

- Tokens are now in **httpOnly cookies** (cannot be accessed by JavaScript)
- No more localStorage tokens (more secure)
- CSRF protection enabled by default
- Industry-standard JWT handling

---

**You're all set!** 🎉

The authentication system now works exactly like the KardexCare project.
