const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

async function analyzeExcelStructure() {
  try {
    console.log('=== ANALYZING EXCEL STRUCTURE FOR STAGE INFO ===');
    
    const excelPath = path.join(__dirname, '..', 'data', 'Repaired_2025_Zonewise_Open_Closed_Offer funnel_ on 04032025.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      console.log('❌ Excel file not found');
      return;
    }
    
    const workbook = XLSX.readFile(excelPath);
    
    // Check first few sheets to understand structure
    const sheetsToCheck = ['Yogesh', 'Ashraf', 'Rahul'];
    
    sheetsToCheck.forEach(sheetName => {
      if (!workbook.Sheets[sheetName]) {
        console.log(`Sheet ${sheetName} not found`);
        return;
      }
      
      console.log(`\n=== ANALYZING SHEET: ${sheetName} ===`);
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length > 0) {
        console.log('Column headers found:');
        Object.keys(jsonData[0]).forEach(key => {
          console.log(`  "${key}"`);
        });
        
        console.log('\nFirst 3 rows of data:');
        jsonData.slice(0, 3).forEach((row, index) => {
          console.log(`\nRow ${index + 1}:`);
          Object.entries(row).forEach(([key, value]) => {
            // Show only relevant fields
            if (key.toLowerCase().includes('stage') || 
                key.toLowerCase().includes('status') || 
                key.toLowerCase().includes('won') || 
                key.toLowerCase().includes('lost') ||
                key.toLowerCase().includes('po') ||
                key.toLowerCase().includes('order') ||
                key.toLowerCase().includes('closed')) {
              console.log(`  ${key}: ${value}`);
            }
          });
        });
        
        // Check for any boolean or status indicators
        console.log('\nChecking for status indicators:');
        const statusFields = ['Won', 'Lost', 'Closed', 'Booked', 'Order'];
        statusFields.forEach(field => {
          if (jsonData[0].hasOwnProperty(field)) {
            const values = jsonData.map(row => row[field]).filter(v => v !== undefined && v !== null && v !== '');
            const uniqueValues = [...new Set(values)];
            console.log(`  ${field}: ${uniqueValues.join(', ')}`);
          }
        });
      }
    });
    
    // Also check if there are any sheets that might contain stage information
    console.log('\n=== ALL SHEET NAMES ===');
    workbook.SheetNames.forEach(name => {
      console.log(`  ${name}`);
    });
    
    // Check if there's a sheet with stage mapping
    const possibleStageSheets = workbook.SheetNames.filter(name => 
      name.toLowerCase().includes('stage') ||
      name.toLowerCase().includes('status') ||
      name.toLowerCase().includes('mapping') ||
      name.toLowerCase().includes('legend')
    );
    
    if (possibleStageSheets.length > 0) {
      console.log('\n=== POSSIBLE STAGE MAPPING SHEETS ===');
      possibleStageSheets.forEach(sheetName => {
        console.log(`\nSheet: ${sheetName}`);
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        console.log('First 5 rows:', jsonData.slice(0, 5));
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

analyzeExcelStructure();
