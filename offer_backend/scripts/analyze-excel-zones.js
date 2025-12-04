const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeExcelZones() {
  try {
    const fs = require('fs');
    const path = require('path');
    const XLSX = require('xlsx');
    
    const excelPath = path.join(__dirname, '..', 'data', 'Repaired_2025_Zonewise_Open_Closed_Offer funnel_ on 04032025.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      console.log('Excel file not found:', excelPath);
      return;
    }
    
    const workbook = XLSX.readFile(excelPath);
    console.log('=== ANALYZING EXCEL ZONE DATA ===');
    
    // Check all sheets for zone information
    const allZoneInfo = {};
    
    workbook.SheetNames.forEach(sheetName => {
      if (sheetName === 'Customer' || sheetName === 'Summary') return;
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length > 0) {
        // Collect all zone values from this sheet
        const zonesInSheet = new Set();
        jsonData.forEach(row => {
          const zone = row['Zone'] || row['zone'];
          if (zone) zonesInSheet.add(zone);
        });
        
        if (zonesInSheet.size > 0) {
          allZoneInfo[sheetName] = Array.from(zonesInSheet);
        }
      }
    });
    
    console.log('Zone assignments found in Excel:');
    Object.entries(allZoneInfo).forEach(([sheetName, zones]) => {
      console.log(`${sheetName}: ${zones.join(', ')}`);
    });
    
    // Check if there's a summary sheet with zone mappings
    if (workbook.Sheets['Summary']) {
      console.log('\n=== CHECKING SUMMARY SHEET ===');
      const summaryWorksheet = workbook.Sheets['Summary'];
      const summaryData = XLSX.utils.sheet_to_json(summaryWorksheet);
      console.log('Summary data:', summaryData.slice(0, 5));
    }
    
    // Look for any zone mapping sheet
    const zoneMappingSheets = workbook.SheetNames.filter(name => 
      name.toLowerCase().includes('zone') || 
      name.toLowerCase().includes('mapping') ||
      name.toLowerCase().includes('user')
    );
    
    if (zoneMappingSheets.length > 0) {
      console.log('\n=== FOUND ZONE MAPPING SHEETS ===');
      zoneMappingSheets.forEach(sheetName => {
        console.log(`\nSheet: ${sheetName}`);
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        console.log('First 5 rows:', jsonData.slice(0, 5));
      });
    }
    
    // Check current zones in database
    console.log('\n=== CURRENT ZONES IN DATABASE ===');
    const zones = await prisma.serviceZone.findMany();
    zones.forEach(zone => {
      console.log(`Zone: ${zone.name} (${zone.id})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeExcelZones();
