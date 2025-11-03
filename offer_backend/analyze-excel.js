const ExcelJS = require('exceljs');
const path = require('path');

async function analyzeExcel() {
  const workbook = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, 'data', '2025_Zonewise_Open_Closed_Offer funnel_ver_1.0.xlsx');
  
  try {
    await workbook.xlsx.readFile(filePath);
    
    console.log('=== EXCEL FILE ANALYSIS ===\n');
    console.log(`Total Worksheets: ${workbook.worksheets.length}\n`);
    
    workbook.worksheets.forEach((worksheet, index) => {
      console.log(`--- Worksheet ${index + 1}: "${worksheet.name}" ---`);
      console.log(`Row Count: ${worksheet.rowCount}`);
      console.log(`Column Count: ${worksheet.columnCount}\n`);
      
      // Get headers from first row
      const headerRow = worksheet.getRow(1);
      const headers = [];
      headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        headers.push({
          col: colNumber,
          name: cell.value
        });
      });
      
      console.log('Headers:');
      headers.forEach(h => {
        console.log(`  Column ${h.col}: ${h.name}`);
      });
      
      // Sample first 3 data rows
      console.log('\nSample Data (First 3 rows):');
      for (let i = 2; i <= Math.min(5, worksheet.rowCount); i++) {
        const row = worksheet.getRow(i);
        const rowData = {};
        headers.forEach(h => {
          const cell = row.getCell(h.col);
          rowData[h.name] = cell.value;
        });
        console.log(`  Row ${i}:`, JSON.stringify(rowData, null, 2));
      }
      
      console.log('\n' + '='.repeat(80) + '\n');
    });
    
  } catch (error) {
    console.error('Error reading Excel file:', error);
  }
}

analyzeExcel();
