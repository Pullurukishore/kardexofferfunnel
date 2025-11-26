import { Response } from 'express';
import { format } from 'date-fns';
import PDFDocument from 'pdfkit';

export interface ColumnDefinition {
  key: string;
  header: string;
  format?: (value: any, item?: any) => string;
  dataType?: 'text' | 'number' | 'date' | 'currency' | 'percentage';
  width?: number;
  align?: 'left' | 'center' | 'right';
}

function formatPdfValue(value: any, column: ColumnDefinition, item?: any): string {
  if (value === null || value === undefined) return '';
  
  if (column.format) {
    try {
      const formatted = column.format(value, item);
      if (Array.isArray(formatted)) {
        return formatted.join(', ');
      }
      return formatted === null || formatted === undefined ? '' : String(formatted);
    } catch (e) {
      return String(value);
    }
  }
  
  switch (column.dataType) {
    case 'number':
      const numValue = Number(value);
      return isNaN(numValue) ? String(value) : numValue.toLocaleString();
    case 'currency':
      const currValue = Number(value);
      return isNaN(currValue) ? String(value) : `₹${(currValue / 100000).toFixed(2)}L`;
    case 'percentage':
      const pctValue = Number(value);
      return isNaN(pctValue) ? String(value) : `${pctValue}%`;
    case 'date':
      if (value instanceof Date) return format(value, 'MMM dd, yyyy');
      if (typeof value === 'string' && !isNaN(Date.parse(value))) {
        return format(new Date(value), 'MMM dd, yyyy');
      }
      return String(value);
    default:
      if (Array.isArray(value)) {
        return value.join(', ');
      }
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

export const generatePdf = async (
  res: Response,
  data: any[],
  columns: ColumnDefinition[],
  title: string,
  filters: { [key: string]: any },
  summaryData?: any
): Promise<void> => {
  const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf"`);
  
  doc.pipe(res);
  
  // Header
  doc.fillColor('#1E293B')
     .fontSize(24)
     .font('Helvetica-Bold')
     .text(title.toUpperCase(), 50, 50);
  
  doc.fillColor('#64748B')
     .fontSize(10)
     .font('Helvetica')
     .text(`Generated: ${format(new Date(), 'MMMM dd, yyyy \'at\' HH:mm:ss')}`, 50, 80);
  
  let currentY = 120;
  
  // Filters
  if (filters.from && filters.to) {
    const fromDate = format(new Date(filters.from), 'MMM dd, yyyy');
    const toDate = format(new Date(filters.to), 'MMM dd, yyyy');
    doc.fillColor('#1E40AF')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(`Report Period: ${fromDate} to ${toDate}`, 50, currentY);
    currentY += 20;
  }
  
  // Summary
  if (summaryData && Object.keys(summaryData).length > 0) {
    currentY += 10;
    doc.fillColor('#0F172A')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Summary', 50, currentY);
    currentY += 15;
    
    Object.entries(summaryData).forEach(([key, value]) => {
      doc.fillColor('#475569')
         .fontSize(9)
         .font('Helvetica')
         .text(`${key}: ${value}`, 50, currentY);
      currentY += 12;
    });
    currentY += 10;
  }
  
  // Table headers
  const headerY = currentY;
  const colWidths = columns.map(col => col.width || 100);
  let xPos = 50;
  
  doc.fillColor('#FFFFFF')
     .rect(50, headerY - 5, 750, 20)
     .fill('#1E40AF');
  
  columns.forEach((column, index) => {
    doc.fillColor('#FFFFFF')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text(column.header, xPos + 5, headerY, {
         width: colWidths[index] - 10,
         align: column.align || 'left'
       });
    xPos += colWidths[index];
  });
  
  currentY = headerY + 25;
  
  // Table rows
  data.forEach((item, rowIndex) => {
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    }
    
    const bgColor = rowIndex % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
    doc.rect(50, currentY - 5, 750, 15)
       .fill(bgColor);
    
    xPos = 50;
    columns.forEach((column, index) => {
      const rawValue = getNestedValue(item, column.key);
      const formattedValue = formatPdfValue(rawValue, column, item);
      
      doc.fillColor('#1E293B')
         .fontSize(8)
         .font('Helvetica')
         .text(formattedValue, xPos + 5, currentY, {
           width: colWidths[index] - 10,
           align: column.align || 'left'
         });
      xPos += colWidths[index];
    });
    
    currentY += 18;
  });
  
  // Footer
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc.fillColor('#64748B')
       .fontSize(8)
       .font('Helvetica')
       .text(`Page ${i + 1} of ${pageCount}`, 50, 750, {
         align: 'center',
         width: 700
       });
  }
  
  doc.end();
};

// Helper function to get column definitions for offer reports
export const getPdfColumns = (reportType: string): ColumnDefinition[] => {
  if (reportType === 'offer-summary') {
    return [
      { key: 'offerReferenceNumber', header: 'Offer Ref', width: 120 },
      { key: 'company', header: 'Company', width: 120 },
      { key: 'contactPersonName', header: 'Contact', width: 100 },
      { key: 'productType', header: 'Product Type', width: 100 },
      { key: 'stage', header: 'Stage', width: 80 },
      { key: 'offerValue', header: 'Offer Value', width: 100, dataType: 'currency' },
      { key: 'zone.name', header: 'Zone', width: 80 },
      { key: 'createdBy.name', header: 'Created By', width: 100 },
      { key: 'poNumber', header: 'PO Number', width: 100 },
      { key: 'createdAt', header: 'Created', width: 90, dataType: 'date' },
    ];
  }
  return [];
};
