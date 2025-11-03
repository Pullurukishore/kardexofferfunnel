const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Configuration
const EXCEL_FILE_PATH = process.argv[2] || './data/Data list.xlsx';
const ADMIN_USER_ID = 1; // Default admin user ID for createdBy/updatedBy fields

// Logging utility
const log = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  error: (message) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`),
  success: (message) => console.log(`[SUCCESS] ${new Date().toISOString()} - ${message}`),
  warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`)
};

// Statistics tracking
const stats = {
  zonesCreated: 0,
  zonesReused: 0,
  customersCreated: 0,
  customersSkipped: 0,
  contactsCreated: 0,
  assetsCreated: 0,
  errorsCount: 0,
  totalRows: 0
};

// Cache for created/found entities
const cache = {
  zones: new Map()
};

/**
 * Clean string value
 */
function cleanString(value) {
  if (!value) return null;
  const str = value.toString().trim();
  return str === '' || str === '-' || str.toLowerCase() === 'n/a' ? null : str;
}

/**
 * Parse date value
 */
function parseDate(value) {
  if (!value) return null;
  
  try {
    // Excel date (number of days since 1900-01-01)
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      return new Date(date.y, date.m - 1, date.d);
    }
    
    // String date
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch (error) {
    log.warn(`Failed to parse date: ${value}`);
    return null;
  }
}

/**
 * Upsert ServiceZone
 */
async function upsertZone(zoneName) {
  if (!zoneName) return null;
  
  // Check cache first
  if (cache.zones.has(zoneName)) {
    stats.zonesReused++;
    return cache.zones.get(zoneName);
  }
  
  try {
    // Try to find existing zone
    let zone = await prisma.serviceZone.findFirst({
      where: {
        name: {
          equals: zoneName,
          mode: 'insensitive'
        }
      }
    });
    
    if (zone) {
      log.info(`Reusing existing Zone: ${zoneName}`);
      cache.zones.set(zoneName, zone);
      stats.zonesReused++;
      return zone;
    }
    
    // Create new zone
    zone = await prisma.serviceZone.create({
      data: {
        name: zoneName,
        description: `Auto-created zone for ${zoneName}`,
        isActive: true
      }
    });
    
    log.success(`Created new Zone: ${zoneName}`);
    cache.zones.set(zoneName, zone);
    stats.zonesCreated++;
    return zone;
    
  } catch (error) {
    log.error(`Failed to upsert Zone '${zoneName}': ${error.message}`);
    throw error;
  }
}

/**
 * Process a single customer row
 */
async function processCustomerRow(row, rowIndex) {
  try {
    // Extract and clean data from Excel row
    const companyName = cleanString(row['Company Name'] || row['Name of the Customer'] || row['Customer Name'] || row['Company']);
    
    if (!companyName) {
      log.warn(`Row ${rowIndex}: Skipping - No company name found`);
      stats.customersSkipped++;
      return false;
    }
    
    const location = cleanString(row['Location'] || row['Place'] || row['City']);
    const department = cleanString(row['Department']);
    const industry = cleanString(row['Industry']);
    const website = cleanString(row['Website']);
    const address = cleanString(row['Address']);
    const city = cleanString(row['City'] || row['Place']);
    const state = cleanString(row['State']);
    const country = cleanString(row['Country']) || 'India';
    const pincode = cleanString(row['Pincode'] || row['PIN']);
    const zoneName = cleanString(row['Zone']);
    const registrationDate = parseDate(row['Registration Date'] || row['Reg Date']);
    
    // Contact information
    const contactPersonName = cleanString(row['Contact Person'] || row['Contact Name']);
    const contactNumber = cleanString(row['Contact Number'] || row['Phone'] || row['Mobile']);
    const email = cleanString(row['Email'] || row['Contact Email']);
    
    // Asset information
    const serialNumber = cleanString(row['Serial Number'] || row['Machine Serial']);
    const assetName = cleanString(row['Asset Name'] || row['Machine Name']);
    const model = cleanString(row['Model']);
    
    log.info(`Processing row ${rowIndex}: ${companyName}`);
    
    // Get or create zone
    let zoneId = null;
    if (zoneName) {
      const zone = await upsertZone(zoneName);
      zoneId = zone ? zone.id : null;
    }
    
    // Check if customer already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        companyName: {
          equals: companyName,
          mode: 'insensitive'
        }
      }
    });
    
    if (existingCustomer) {
      log.warn(`Customer '${companyName}' already exists. Skipping.`);
      stats.customersSkipped++;
      
      // Still try to add contact/asset if provided
      if (contactPersonName && existingCustomer.id) {
        await createContact(contactPersonName, contactNumber, email, existingCustomer.id);
      }
      
      if (serialNumber && existingCustomer.id) {
        await createAsset(assetName, serialNumber, model, existingCustomer.id);
      }
      
      return true;
    }
    
    // Create customer
    const customer = await prisma.customer.create({
      data: {
        companyName,
        location,
        department,
        registrationDate,
        industry,
        website,
        address,
        city,
        state,
        country,
        pincode,
        zoneId,
        isActive: true,
        createdById: ADMIN_USER_ID,
        updatedById: ADMIN_USER_ID
      }
    });
    
    log.success(`Created Customer: ${companyName} (ID: ${customer.id})`);
    stats.customersCreated++;
    
    // Create contact if provided
    if (contactPersonName) {
      await createContact(contactPersonName, contactNumber, email, customer.id);
    }
    
    // Create asset if provided
    if (serialNumber) {
      await createAsset(assetName, serialNumber, model, customer.id);
    }
    
    return true;
    
  } catch (error) {
    log.error(`Failed to process row ${rowIndex}: ${error.message}`);
    stats.errorsCount++;
    return false;
  }
}

/**
 * Create contact for customer
 */
async function createContact(contactPersonName, contactNumber, email, customerId) {
  try {
    // Check if contact already exists
    const existingContact = await prisma.contact.findFirst({
      where: {
        customerId,
        contactPersonName: {
          equals: contactPersonName,
          mode: 'insensitive'
        }
      }
    });
    
    if (existingContact) {
      log.info(`Contact '${contactPersonName}' already exists for customer ${customerId}`);
      return existingContact;
    }
    
    const contact = await prisma.contact.create({
      data: {
        customerId,
        contactPersonName,
        contactNumber,
        email,
        role: 'CONTACT',
        isPrimary: true,
        isActive: true
      }
    });
    
    log.success(`Created Contact: ${contactPersonName} for customer ${customerId}`);
    stats.contactsCreated++;
    return contact;
    
  } catch (error) {
    log.error(`Failed to create Contact '${contactPersonName}': ${error.message}`);
    return null;
  }
}

/**
 * Create asset for customer
 */
async function createAsset(assetName, serialNumber, model, customerId) {
  try {
    // Check if asset with serial number already exists
    const existingAsset = await prisma.asset.findFirst({
      where: {
        machineSerialNumber: serialNumber
      }
    });
    
    if (existingAsset) {
      log.warn(`Asset with serial '${serialNumber}' already exists. Skipping.`);
      return existingAsset;
    }
    
    const asset = await prisma.asset.create({
      data: {
        customerId,
        assetName: assetName || 'Asset',
        machineSerialNumber: serialNumber,
        model,
        isActive: true
      }
    });
    
    log.success(`Created Asset: ${serialNumber} for customer ${customerId}`);
    stats.assetsCreated++;
    return asset;
    
  } catch (error) {
    log.error(`Failed to create Asset '${serialNumber}': ${error.message}`);
    return null;
  }
}

/**
 * Main import function
 */
async function importCustomers() {
  try {
    log.info('Starting customer data import...');
    log.info(`Excel file: ${EXCEL_FILE_PATH}`);
    
    // Check if file exists
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
      throw new Error(`Excel file not found: ${EXCEL_FILE_PATH}`);
    }
    
    // Verify admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { id: ADMIN_USER_ID }
    });
    
    if (!adminUser) {
      throw new Error(`Admin user with ID ${ADMIN_USER_ID} not found. Please create an admin user first or update ADMIN_USER_ID in the script.`);
    }
    
    log.info(`Using admin user: ${adminUser.name || adminUser.email} (ID: ${ADMIN_USER_ID})`);
    
    // Read Excel file
    log.info('Reading Excel file...');
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    log.info(`Processing sheet: ${sheetName}`);
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    stats.totalRows = jsonData.length;
    
    log.info(`Found ${stats.totalRows} rows to process`);
    
    // Show available columns
    if (jsonData.length > 0) {
      const columns = Object.keys(jsonData[0]);
      log.info(`Available columns: ${columns.join(', ')}`);
    }
    
    // Process each row
    let successCount = 0;
    for (let i = 0; i < jsonData.length; i++) {
      const success = await processCustomerRow(jsonData[i], i + 2); // +2 for Excel row numbering
      if (success) {
        successCount++;
      }
      
      // Add delay every 10 rows
      if (i % 10 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Print summary
    log.success('Import completed!');
    console.log('\n==================== IMPORT SUMMARY ====================');
    console.log(`Total rows processed:     ${stats.totalRows}`);
    console.log(`Successful imports:       ${successCount}`);
    console.log(`Customers created:        ${stats.customersCreated}`);
    console.log(`Customers skipped:        ${stats.customersSkipped}`);
    console.log(`Contacts created:         ${stats.contactsCreated}`);
    console.log(`Assets created:           ${stats.assetsCreated}`);
    console.log(`Zones created:            ${stats.zonesCreated}`);
    console.log(`Zones reused:             ${stats.zonesReused}`);
    console.log(`Errors:                   ${stats.errorsCount}`);
    console.log('========================================================\n');
    
  } catch (error) {
    log.error(`Import failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  log.info('Received SIGINT, cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log.info('Received SIGTERM, cleaning up...');
  await prisma.$disconnect();
  process.exit(0);
});

// Run the import
if (require.main === module) {
  importCustomers().catch(console.error);
}

module.exports = { importCustomers };
