@echo off
echo === OFFER FUNNEL EXCEL INTEGRATION ===
echo.
echo This will integrate your Excel data with the existing database
echo without breaking any existing functionality.
echo.
echo Press Ctrl+C to cancel or any key to continue...
pause > nul
echo.
echo Step 1: Analyzing product types...
node scripts/analyze-product-types.js
echo.
echo Step 2: Integrating Excel offers...
node scripts/integrate-excel-offers.js
echo.
echo Step 3: Validating integration...
node scripts/validate-integration.js
echo.
echo === INTEGRATION COMPLETE ===
echo.
echo Your project now has real Excel data!
echo Check the dashboard to see live metrics.
echo.
pause
