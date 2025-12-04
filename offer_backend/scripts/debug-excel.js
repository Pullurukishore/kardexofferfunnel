const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '..', 'data', 'Repaired_2025_Zonewise_Open_Closed_Offer funnel_ on 04032025.xlsx');
const workbook = XLSX.readFile(excelPath);

// Check Ashraf sheet structure
const ashrafSheet = workbook.Sheets['Ashraf'];
const ashrafData = XLSX.utils.sheet_to_json(ashrafSheet);

console.log('=== ASHRAF SHEET STRUCTURE ===');
console.log('Total rows:', ashrafData.length);

if (ashrafData.length > 0) {
  console.log('\nColumn headers:');
  console.log(Object.keys(ashrafData[0]));
  
  console.log('\nFirst row sample:');
  console.log(JSON.stringify(ashrafData[0], null, 2));
  
  console.log('\nSecond row sample:');
  if (ashrafData.length > 1) {
    console.log(JSON.stringify(ashrafData[1], null, 2));
  }
}

// Check Customer sheet structure
const customerSheet = workbook.Sheets['Customer'];
const customerData = XLSX.utils.sheet_to_json(customerSheet);

console.log('\n=== CUSTOMER SHEET STRUCTURE ===');
console.log('Total rows:', customerData.length);

if (customerData.length > 0) {
  console.log('\nColumn headers:');
  console.log(Object.keys(customerData[0]));
  
  console.log('\nFirst row sample:');
  console.log(JSON.stringify(customerData[0], null, 2));
}
