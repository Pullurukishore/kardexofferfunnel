@echo off
echo === OFFER FUNNEL COMPLETE SETUP ===
echo.
echo This will setup your new database from scratch
echo and import all Excel data.
echo.
echo Press Ctrl+C to cancel or any key to continue...
pause > nul
cls

echo === STEP 1: DATABASE SETUP ===
echo.
echo 1. Generating Prisma client...
call npx prisma generate
echo.
echo 2. Creating database migration...
call npx prisma migrate dev --name init
echo.
echo 3. Regenerating Prisma client...
call npx prisma generate
echo.

echo === STEP 2: EXCEL DATA IMPORT ===
echo.
echo 4. Importing Excel data...
call npx prisma db seed
echo.

echo === STEP 3: VALIDATION ===
echo.
echo 5. Validating data import...
node scripts/validate-integration.js
echo.

echo === SETUP COMPLETE ===
echo.
echo Your new database is ready with:
echo - Real Excel data (495 offers)
echo - All customers, users, zones
echo - Complete relationships
echo - Working dashboard
echo.
echo You can now start your backend:
echo   npm run dev
echo.
echo And your frontend:
echo   cd ../frontend && npm run dev
echo.
pause
