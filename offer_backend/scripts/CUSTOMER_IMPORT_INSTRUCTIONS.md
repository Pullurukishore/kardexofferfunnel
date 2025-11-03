# Customer Data Import Instructions

## Overview
This script imports customer data from Excel into the database according to the Prisma schema.

## Prerequisites
1. **Admin user must exist in database** (ID: 1 by default)
2. Excel file: `./data/Data list.xlsx`
3. Node.js and dependencies installed

## Excel Column Mapping
The script automatically maps these columns (if present):

### Customer Fields:
- `Company Name` / `Name of the Customer` / `Customer Name` → **companyName** (required)
- `Location` / `Place` / `City` → **location**
- `Department` → **department**
- `Industry` → **industry**
- `Website` → **website**
- `Address` → **address**
- `City` / `Place` → **city**
- `State` → **state**
- `Country` → **country** (default: India)
- `Pincode` / `PIN` → **pincode**
- `Zone` → **zoneId** (auto-creates zone if doesn't exist)
- `Registration Date` / `Reg Date` → **registrationDate**

### Contact Fields (optional):
- `Contact Person` / `Contact Name` → **contactPersonName**
- `Contact Number` / `Phone` / `Mobile` → **contactNumber**
- `Email` / `Contact Email` → **email**

### Asset Fields (optional):
- `Serial Number` / `Machine Serial` → **machineSerialNumber**
- `Asset Name` / `Machine Name` → **assetName**
- `Model` → **model**

## How to Run

### Step 1: Ensure Admin User Exists
```bash
# Create admin user if it doesn't exist
cd backend
node scripts/create-admin.ts
```

### Step 2: Run the Import Script
```bash
# Default: reads from ./data/Data list.xlsx
node scripts/import-customers.js

# Or specify a different Excel file:
node scripts/import-customers.js "./data/YourFile.xlsx"
```

## Features
- ✅ **Smart zone handling**: Auto-creates zones if they don't exist
- ✅ **Duplicate prevention**: Skips customers that already exist (case-insensitive)
- ✅ **Contact creation**: Creates contacts if data provided
- ✅ **Asset creation**: Creates assets if serial number provided
- ✅ **Error handling**: Continues processing even if individual rows fail
- ✅ **Detailed logging**: Shows progress and errors for each row
- ✅ **Import summary**: Displays statistics at the end

## Expected Output
```
[INFO] Starting customer data import...
[INFO] Using admin user: Admin User (ID: 1)
[INFO] Found 50 rows to process
[INFO] Processing row 2: ABC Pvt Ltd
[SUCCESS] Created new Zone: North
[SUCCESS] Created Customer: ABC Pvt Ltd (ID: 1)
[SUCCESS] Created Contact: John Doe for customer 1
[SUCCESS] Created Asset: SN12345 for customer 1
...
==================== IMPORT SUMMARY ====================
Total rows processed:     50
Successful imports:       48
Customers created:        45
Customers skipped:        3
Contacts created:         40
Assets created:           35
Zones created:            4
Zones reused:             41
Errors:                   2
========================================================
```

## Troubleshooting

### Error: "Admin user with ID 1 not found"
**Solution**: Create an admin user first using `node scripts/create-admin.ts`

### Error: "Excel file not found"
**Solution**: Make sure the file path is correct. Default is `./data/Data list.xlsx`

### Error: "Column not found"
**Solution**: The script is flexible with column names. Check the log output to see which columns were detected.

### Duplicate customers
**Solution**: The script automatically skips existing customers (matched by company name, case-insensitive)

## Notes
- The script uses **transaction-safe** operations
- Existing customers are **not updated**, only skipped
- Zones are created automatically if they don't exist
- Empty/null values are handled gracefully
- Date parsing supports both Excel date numbers and string dates
