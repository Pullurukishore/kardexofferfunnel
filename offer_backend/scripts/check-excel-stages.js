const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

async function checkExcelStages() {
  try {
    console.log('=== CHECKING STAGES IN EXCEL DATA ===');
    
    const excelPath = path.join(__dirname, '..', 'data', 'Repaired_2025_Zonewise_Open_Closed_Offer funnel_ on 04032025.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      console.log('❌ Excel file not found');
      return;
    }
    
    const workbook = XLSX.readFile(excelPath);
    const allStages = new Set();
    const stageCounts = {};
    
    workbook.SheetNames.forEach(sheetName => {
      if (sheetName === 'Customer' || sheetName === 'Summary') return;
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      jsonData.forEach(row => {
        // Check for stage field (could be named various ways)
        const stage = row['Stage'] || row['stage'] || row['Status'] || row['status'];
        
        if (stage && typeof stage === 'string') {
          const stageUpper = stage.toUpperCase().trim();
          allStages.add(stageUpper);
          stageCounts[stageUpper] = (stageCounts[stageUpper] || 0) + 1;
        }
      });
    });
    
    console.log('\n=== ALL STAGES FOUND IN EXCEL ===');
    Array.from(allStages).sort().forEach(stage => {
      console.log(`${stage}: ${stageCounts[stage]} offers`);
    });
    
    // Check specifically for WON stage
    console.log('\n=== WON STAGE ANALYSIS ===');
    const wonCount = stageCounts['WON'] || 0;
    console.log(`Total WON offers: ${wonCount}`);
    
    // Show sample WON offers
    if (wonCount > 0) {
      console.log('\nSample WON offers:');
      let sampleCount = 0;
      workbook.SheetNames.forEach(sheetName => {
        if (sheetName === 'Customer' || sheetName === 'Summary' || sampleCount >= 5) return;
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        jsonData.forEach(row => {
          if (sampleCount >= 5) return;
          
          const stage = (row['Stage'] || row['stage'] || row['Status'] || row['status'] || '').toString().toUpperCase().trim();
          
          if (stage === 'WON') {
            console.log(`  ${sheetName}: ${row['Offer Reference Number'] || row['offerReferenceNumber']} - Value: ${row['Offer Value'] || row['offerValue']}`);
            sampleCount++;
          }
        });
      });
    }
    
    // Check what other stages might map to ORDER_BOOKED
    console.log('\n=== STAGES THAT SHOULD MAP TO ORDER_BOOKED ===');
    const orderBookedStages = ['ORDER BOOKED', 'ORDER_BOOKED', 'CLOSED', 'WON', 'BOOKED', 'COMPLETED'];
    
    orderBookedStages.forEach(stage => {
      if (stageCounts[stage]) {
        console.log(`${stage}: ${stageCounts[stage]} offers`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkExcelStages();
