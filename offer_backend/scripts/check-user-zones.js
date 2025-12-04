const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserZones() {
  try {
    const users = await prisma.user.findMany({
      include: {
        serviceZones: {
          include: {
            serviceZone: true
          }
        }
      }
    });
    
    console.log('=== USER ZONE MAPPINGS ===');
    users.forEach(user => {
      const zones = user.serviceZones.map(sz => sz.serviceZone.name).join(', ') || 'NO ZONE';
      console.log(`${user.name} (${user.email}) - Role: ${user.role} - Zones: ${zones}`);
    });
    
    console.log('\n=== ZONE SUMMARY ===');
    const zoneCounts = {};
    users.forEach(user => {
      user.serviceZones.forEach(sz => {
        const zoneName = sz.serviceZone.name;
        zoneCounts[zoneName] = (zoneCounts[zoneName] || 0) + 1;
      });
    });
    
    Object.entries(zoneCounts).forEach(([zone, count]) => {
      console.log(`${zone}: ${count} users`);
    });
    
    // Check Excel data to see expected zones
    console.log('\n=== CHECKING EXCEL DATA FOR ZONES ===');
    const fs = require('fs');
    const path = require('path');
    const XLSX = require('xlsx');
    
    const excelPath = path.join(__dirname, '..', 'data', 'Repaired_2025_Zonewise_Open_Closed_Offer funnel_ on 04032025.xlsx');
    
    if (fs.existsSync(excelPath)) {
      const workbook = XLSX.readFile(excelPath);
      const userSheets = ['Yogesh', 'Ashraf', 'Rahul', 'Minesh', 'Gajendra', 'Pradeep', 'Sasi', 'Vinay', 'Nitin', 'Pankaj'];
      
      const userZonesInExcel = {};
      userSheets.forEach(sheetName => {
        if (workbook.Sheets[sheetName]) {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          if (jsonData.length > 0) {
            const firstRow = jsonData[0];
            const zone = firstRow['Zone'] || firstRow['zone'] || 'WEST';
            userZonesInExcel[sheetName] = zone;
            console.log(`${sheetName} (Excel): ${zone}`);
          }
        }
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserZones();
