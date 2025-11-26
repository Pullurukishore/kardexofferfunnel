import { Response } from 'express';
import { format } from 'date-fns';
import ExcelJS from 'exceljs';

export interface ColumnDefinition {
  key: string;
  header: string;
  format?: (value: any, item?: any) => string | number;
  dataType?: 'text' | 'number' | 'date' | 'currency' | 'percentage';
  width?: number;
}

function formatExcelValue(value: any, column: ColumnDefinition, item?: any): any {
  if (value === null || value === undefined) return '';
  
  if (column.format) {
    try {
      return column.format(value, item);
    } catch (e) {
      return value;
    }
  }
  
  switch (column.dataType) {
    case 'number':
      const numValue = Number(value);
      return isNaN(numValue) ? value : numValue;
    case 'currency':
      const currValue = Number(value);
      return isNaN(currValue) ? value : currValue;
    case 'percentage':
      const pctValue = Number(value);
      return isNaN(pctValue) ? value : pctValue;
    case 'date':
      if (value instanceof Date) return value;
      if (typeof value === 'string' && !isNaN(Date.parse(value))) {
        return new Date(value);
      }
      return value;
    default:
      return String(value);
  }
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return current[key];
    }
    return '';
  }, obj);
}

export const generateExcel = async (
  res: Response,
  data: any[],
  columns: ColumnDefinition[],
  title: string,
  filters: { [key: string]: any },
  summaryData?: any
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Offer Report');
  
  let currentRow = 1;
  
  // Title
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = title.toUpperCase();
  titleCell.font = { size: 18, bold: true, color: { argb: '1E293B' } };
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
  currentRow += 2;
  
  // Generated date
  const dateCell = worksheet.getCell(`A${currentRow}`);
  dateCell.value = `Generated: ${format(new Date(), 'MMMM dd, yyyy \'at\' HH:mm:ss')}`;
  dateCell.font = { size: 10, color: { argb: '64748B' } };
  currentRow += 2;
  
  // Filters
  if (filters.from && filters.to) {
    const fromDate = format(new Date(filters.from), 'MMM dd, yyyy');
    const toDate = format(new Date(filters.to), 'MMM dd, yyyy');
    const rangeCell = worksheet.getCell(`A${currentRow}`);
    rangeCell.value = `Report Period: ${fromDate} to ${toDate}`;
    rangeCell.font = { size: 10, bold: true, color: { argb: '1E40AF' } };
    currentRow += 2;
  }
  
  // Summary
  if (summaryData && Object.keys(summaryData).length > 0) {
    const summaryTitle = worksheet.getCell(`A${currentRow}`);
    summaryTitle.value = 'Summary';
    summaryTitle.font = { size: 12, bold: true, color: { argb: '0F172A' } };
    currentRow++;
    
    Object.entries(summaryData).forEach(([key, value]) => {
      const summaryRow = worksheet.getRow(currentRow);
      summaryRow.getCell(1).value = key;
      summaryRow.getCell(2).value = String(value);
      summaryRow.getCell(1).font = { size: 10 };
      summaryRow.getCell(2).font = { size: 10, bold: true };
      currentRow++;
    });
    currentRow += 2;
  }
  
  // Headers
  const headerRow = worksheet.getRow(currentRow);
  columns.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column.header;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E40AF' }
    };
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    worksheet.getColumn(index + 1).width = column.width || 15;
  });
  currentRow++;
  
  // Data rows
  data.forEach((item) => {
    const dataRow = worksheet.getRow(currentRow);
    columns.forEach((column, colIndex) => {
      const cell = dataRow.getCell(colIndex + 1);
      const rawValue = getNestedValue(item, column.key);
      const formattedValue = formatExcelValue(rawValue, column, item);
      
      cell.value = formattedValue;
      
      switch (column.dataType) {
        case 'currency':
          cell.numFmt = '₹#,##0.00';
          break;
        case 'percentage':
          cell.numFmt = '0%';
          break;
        case 'date':
          cell.numFmt = 'yyyy-mm-dd';
          break;
        case 'number':
          cell.numFmt = '#,##0.00';
          break;
      }
      
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      cell.alignment = { 
        horizontal: colIndex === 0 ? 'left' : 'center', 
        vertical: 'middle' 
      };
    });
    currentRow++;
  });
  
  // Freeze header row
  worksheet.views = [{ state: 'frozen', ySplit: currentRow - data.length - 1 }];
  
  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.xlsx"`);
  
  await workbook.xlsx.write(res);
  res.end();
};

// Helper function to get column definitions for offer reports
export const getExcelColumns = (reportType: string): ColumnDefinition[] => {
  if (reportType === 'offer-summary') {
    return [
      { key: 'offerReferenceNumber', header: 'Offer Ref', width: 20 },
      { key: 'company', header: 'Company', width: 25 },
      { key: 'contactPersonName', header: 'Contact', width: 20 },
      { key: 'productType', header: 'Product Type', width: 15 },
      { key: 'stage', header: 'Stage', width: 15 },
      { key: 'offerValue', header: 'Offer Value', width: 15, dataType: 'currency' },
      { key: 'zone.name', header: 'Zone', width: 15 },
      { key: 'createdBy.name', header: 'Created By', width: 20 },
      { key: 'poNumber', header: 'PO Number', width: 20 },
      { key: 'createdAt', header: 'Created', width: 18, dataType: 'date' },
    ];
  }
  return [];
};
