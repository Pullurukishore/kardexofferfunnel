const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { normalizeProductType } = require('./product-type-mapper');
const { initializeCaches, findCustomerId, findUserId, findZoneId } = require('./customer-linker');

const prisma = new PrismaClient();

// Statistics tracking
const stats = {
  totalOffers: 0,
  importedOffers: 0,
  skippedOffers: 0,
  customersLinked: 0,
  usersLinked: 0,
  zonesLinked: 0,
  productTypesNormalized: 0,
  errors: []
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '[INFO]',
    success: '[SUCCESS]',
    warn: '[WARN]',
    error: '[ERROR]'
  }[type] || '[INFO]';
  
  console.log(`${timestamp} ${prefix} ${message}`);
}

async function createOfferWithRelationships(excelOffer) {
  try {
    // Find existing customer
    const customerId = findCustomerId(excelOffer.companyName);
    if (!customerId) {
      stats.skippedOffers++;
      stats.errors.push(`Offer ${excelOffer.id}: Customer not found - ${excelOffer.companyName}`);
      return null;
    }
    
    // Find user
    const userId = findUserId(excelOffer.assignedUser);
    if (!userId) {
      stats.skippedOffers++;
      stats.errors.push(`Offer ${excelOffer.id}: User not found - ${excelOffer.assignedUser}`);
      return null;
    }
    
    // Find zone
    const zoneId = findZoneId(excelOffer.zone);
    if (!zoneId) {
      stats.skippedOffers++;
      stats.errors.push(`Offer ${excelOffer.id}: Zone not found - ${excelOffer.zone}`);
      return null;
    }
    
    // Normalize product type
    const productType = normalizeProductType(excelOffer.productType);
    if (!productType) {
      stats.skippedOffers++;
      stats.errors.push(`Offer ${excelOffer.id}: Invalid product type - ${excelOffer.productType}`);
      return null;
    }
    
    // Create or find contact
    let contactId;
    if (excelOffer.contactPerson && excelOffer.contactNumber) {
      const existingContact = await prisma.contact.findFirst({
        where: {
          customerId: customerId,
          contactPersonName: excelOffer.contactPerson.trim(),
          isActive: true
        }
      });
      
      if (existingContact) {
        contactId = existingContact.id;
      } else {
        const newContact = await prisma.contact.create({
          data: {
            customerId: customerId,
            contactPersonName: excelOffer.contactPerson.trim(),
            contactNumber: excelOffer.contactNumber ? excelOffer.contactNumber.toString().trim() : null,
            email: excelOffer.email ? excelOffer.email.trim() : null,
            isPrimary: true,
            isActive: true
          }
        });
        contactId = newContact.id;
      }
    }
    
    // Create or find asset
    let assetId;
    if (excelOffer.machineSerialNumber) {
      const existingAsset = await prisma.asset.findFirst({
        where: {
          customerId: customerId,
          machineSerialNumber: excelOffer.machineSerialNumber.trim(),
          isActive: true
        }
      });
      
      if (existingAsset) {
        assetId = existingAsset.id;
      } else {
        const newAsset = await prisma.asset.create({
          data: {
            customerId: customerId,
            assetName: `Asset ${excelOffer.machineSerialNumber}`,
            machineSerialNumber: excelOffer.machineSerialNumber.trim(),
            model: excelOffer.department || 'Not Specified',
            isActive: true
          }
        });
        assetId = newAsset.id;
      }
    }
    
    // Create the offer
    const offerData = {
      // Excel direct matches
      offerReferenceNumber: excelOffer.offerReferenceNumber || `EXCEL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      company: excelOffer.companyName,
      location: excelOffer.location,
      department: excelOffer.department,
      contactPersonName: excelOffer.contactPerson,
      contactNumber: excelOffer.contactNumber ? excelOffer.contactNumber.toString() : null,
      email: excelOffer.email,
      machineSerialNumber: excelOffer.machineSerialNumber,
      productType: productType,
      offerValue: excelOffer.offerValue || 0,
      probability: excelOffer.probability || 0,
      orderValue: excelOffer.orderValue || 0,
      remarks: excelOffer.remarks || '',
      
      // Derived fields
      offerReferenceDate: new Date(),
      title: `${excelOffer.companyName} - ${productType}`,
      description: excelOffer.remarks || `Offer for ${productType}`,
      status: 'OPEN',
      stage: 'INITIAL',
      priority: 'MEDIUM',
      registrationDate: new Date(),
      
      // Month conversions
      offerMonth: convertMonthToYYYYMM(excelOffer.month),
      poExpectedMonth: convertMonthToYYYYMM(excelOffer.expectedMonth),
      expectedPoMonth: convertMonthToYYYYMM(excelOffer.expectedPoMonth),
      
      // Relationships
      customerId: customerId,
      contactId: contactId,
      userId: userId,
      zoneId: zoneId,
      assetId: assetId,
      
      // System fields
      createdById: userId,
      updatedById: userId
    };
    
    const offer = await prisma.offer.create({
      data: offerData
    });
    
    // Update statistics
    stats.importedOffers++;
    if (customerId) stats.customersLinked++;
    if (userId) stats.usersLinked++;
    if (zoneId) stats.zonesLinked++;
    if (productType !== excelOffer.productType) stats.productTypesNormalized++;
    
    log(`Imported offer: ${offer.offerReferenceNumber} (${excelOffer.companyName})`, 'success');
    return offer;
    
  } catch (error) {
    stats.errors.push(`Offer ${excelOffer.id}: ${error.message}`);
    log(`Failed to import offer ${excelOffer.id}: ${error.message}`, 'error');
    return null;
  }
}

function convertMonthToYYYYMM(monthName) {
  if (!monthName) return null;
  
  const monthMap = {
    'january': '2025-01', 'jan': '2025-01',
    'february': '2025-02', 'feb': '2025-02',
    'march': '2025-03', 'mar': '2025-03',
    'april': '2025-04', 'apr': '2025-04',
    'may': '2025-05',
    'june': '2025-06', 'jun': '2025-06',
    'july': '2025-07', 'jul': '2025-07',
    'august': '2025-08', 'aug': '2025-08',
    'september': '2025-09', 'sep': '2025-09', 'sept': '2025-09',
    'october': '2025-10', 'oct': '2025-10',
    'november': '2025-11', 'nov': '2025-11',
    'december': '2025-12', 'dec': '2025-12'
  };
  
  const normalized = monthName.toLowerCase().trim();
  return monthMap[normalized] || null;
}

async function integrateExcelOffers() {
  try {
    log('Starting Excel offers integration...');
    
    // Load Excel data
    const excelData = require('../data/processed/all-offers.json');
    stats.totalOffers = excelData.length;
    
    log(`Loaded ${stats.totalOffers} offers from Excel`);
    
    // Initialize caches
    await initializeCaches();
    
    // Process offers in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < excelData.length; i += batchSize) {
      const batch = excelData.slice(i, i + batchSize);
      log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(excelData.length/batchSize)} (${batch.length} offers)`);
      
      for (const excelOffer of batch) {
        await createOfferWithRelationships(excelOffer);
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Print final statistics
    log('\n=== INTEGRATION COMPLETE ===', 'success');
    log(`Total offers processed: ${stats.totalOffers}`);
    log(`Successfully imported: ${stats.importedOffers}`);
    log(`Skipped offers: ${stats.skippedOffers}`);
    log(`Customers linked: ${stats.customersLinked}`);
    log(`Users linked: ${stats.usersLinked}`);
    log(`Zones linked: ${stats.zonesLinked}`);
    log(`Product types normalized: ${stats.productTypesNormalized}`);
    
    if (stats.errors.length > 0) {
      log('\n=== ERRORS ===', 'error');
      stats.errors.slice(0, 10).forEach(error => log(error, 'error'));
      if (stats.errors.length > 10) {
        log(`... and ${stats.errors.length - 10} more errors`, 'warn');
      }
    }
    
    log(`\nSuccess rate: ${((stats.importedOffers / stats.totalOffers) * 100).toFixed(2)}%`, 'success');
    
  } catch (error) {
    log(`Integration failed: ${error.message}`, 'error');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the integration
if (require.main === module) {
  integrateExcelOffers()
    .then(() => {
      log('Excel integration completed successfully!', 'success');
      process.exit(0);
    })
    .catch((error) => {
      log('Excel integration failed!', 'error');
      console.error(error);
      process.exit(1);
    });
}

module.exports = { integrateExcelOffers };
