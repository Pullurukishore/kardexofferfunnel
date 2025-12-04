# 🚀 New Database Setup Guide

## 📋 Overview
This guide will help you set up a completely new database from scratch and import all your Excel data.

## 🎯 What This Does
✅ Creates fresh database schema  
✅ Imports all Excel data (495 real offers)  
✅ Sets up zones, users, customers  
✅ Creates all relationships  
✅ Validates data integrity  

---

## 📂 Prerequisites
1. **New database created** (PostgreSQL)
2. **Excel file present**: `data/Repaired_2025_Zonewise_Open_Closed_Offer funnel_ on 04032025.xlsx`
3. **Environment variables set** in `.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost/your_new_db"
   ```

---

## 🚀 Quick Setup (5 Minutes)

### Option 1: Automatic Setup (Recommended)
```bash
# Run the complete setup script
cd "c:\offer funnel\offer_backend"
scripts\COMPLETE-SETUP.bat
```

### Option 2: Manual Setup
```bash
# 1. Generate Prisma client
npx prisma generate

# 2. Create database migration
npx prisma migrate dev --name init

# 3. Import Excel data
npx prisma db seed

# 4. Validate import
npm run validate:data
```

---

## 📊 What Gets Imported

### **Zones (4)**
- WEST, SOUTH, NORTH, EAST

### **Users (11)**
- Yogesh, Ashraf, Rahul, Minesh, Gajendra
- Pradeep, Sasi, Vinay, Nitin, Pankaj, Admin

### **Customers (245+)**
- Extracted from Excel sheets
- Linked to zones

### **Offers (495)**
- All user sheets processed
- Product types normalized
- Relationships created

### **Product Types (15)**
- RELOCATION, CONTRACT, SPP
- MIDLIFE_UPGRADE, RETROFIT_KIT
- UPGRADE_KIT, BD_CHARGES, BD_SPARE
- Spelling corrections applied

---

## 🔧 Post-Setup Steps

### 1. Start Backend
```bash
npm run dev
```

### 2. Start Frontend
```bash
cd ../frontend
npm run dev
```

### 3. Verify Dashboard
- Open: http://localhost:3000
- Login as: admin@example.com / password123
- Check dashboard shows real metrics

---

## 📈 Expected Results

### **Dashboard Metrics**
- **Total Offers**: 495
- **Total Value**: ~₹191 Lakhs
- **Orders Won**: ~₹83 Lakhs
- **Achievement**: ~43%

### **Zone Distribution**
- WEST: ~193 offers
- SOUTH: ~196 offers
- NORTH: ~94 offers
- EAST: ~12 offers

### **User Performance**
- Pradeep: ~79 offers
- Nitin: ~73 offers
- Ashraf: ~48 offers
- Others: ~295 offers

---

## 🛠️ Troubleshooting

### **Error: Excel file not found**
```bash
# Ensure Excel file is in the correct location
ls data/Repaired_2025_Zonewise_Open_Closed_Offer funnel_ on 04032025.xlsx
```

### **Error: Database connection failed**
```bash
# Check your .env file
cat .env | grep DATABASE_URL
```

### **Error: Prisma client not generated**
```bash
# Regenerate Prisma client
npx prisma generate
```

### **Error: Migration failed**
```bash
# Reset and try again
npx prisma migrate reset --force
npx prisma migrate dev --name init
```

---

## 🎯 Validation Commands

### **Check Database Counts**
```bash
npm run validate:data
```

### **View Database in Studio**
```bash
npx prisma studio
```

### **Check Specific Tables**
```bash
# Count offers
npx prisma db execute --stdin
SELECT COUNT(*) as total_offers FROM "Offer" WHERE "isActive" = true;

# Count customers
SELECT COUNT(*) as total_customers FROM "Customer" WHERE "isActive" = true;

# Check product types
SELECT "productType", COUNT(*) as count FROM "Offer" WHERE "isActive" = true GROUP BY "productType";
```

---

## 🔄 Reset if Needed

### **Complete Reset**
```bash
# Reset database
npx prisma migrate reset --force

# Re-run setup
scripts\COMPLETE-SETUP.bat
```

### **Partial Reset**
```bash
# Clear only offers
npx prisma db execute --stdin
DELETE FROM "Offer";

# Re-import offers
node scripts/integrate-excel-offers.js
```

---

## ✅ Success Indicators

### **Setup Successful When:**
✅ Backend starts without errors  
✅ Frontend loads dashboard  
✅ Dashboard shows real metrics  
✅ Reports display actual data  
✅ Users can see their offers  
✅ Zone filtering works  
✅ Product type analysis works  

### **Data Validation:**
✅ 495 offers imported  
✅ 245+ customers created  
✅ 11 users assigned  
✅ 4 zones active  
✅ 15 product types normalized  
✅ No error messages in logs  

---

## 🎉 Next Steps

1. **Explore Dashboard**: Check all metrics and charts
2. **Test Reports**: Generate offer and performance reports
3. **Verify User Access**: Test zone manager and user logins
4. **Check Data Quality**: Validate offer details and relationships
5. **Customize**: Update user passwords, email settings, etc.

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the console logs for specific error messages
3. Verify all prerequisites are met
4. Ensure Excel file is not corrupted

**Your project will be 100% live with real Excel data!** 🚀
