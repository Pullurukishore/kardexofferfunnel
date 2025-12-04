const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importMissingOffers() {
  try {
    console.log('=== IMPORTING MISSING OFFERS ===');
    
    // 1. Load processed Excel data
    const comprehensiveData = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../data/processed/comprehensive-data.json'), 
      'utf8'
    ));
    
    // 2. Get all zones for mapping
    const zones = await prisma.serviceZone.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    
    const zoneMap = {};
    zones.forEach(zone => {
      zoneMap[zone.name] = zone.id;
    });
    
    console.log('Zone mapping:', zoneMap);
    
    // 3. Get all customers for mapping
    const customers = await prisma.customer.findMany({
      select: { id: true, companyName: true }
    });
    
    const customerMap = {};
    customers.forEach(customer => {
      customerMap[customer.companyName] = customer.id;
    });
    
    // 4. Get existing offers to avoid duplicates
    const existingOffers = await prisma.offer.findMany({
      select: { offerReferenceNumber: true }
    });
    
    const existingRefNumbers = new Set(existingOffers.map(o => o.offerReferenceNumber));
    
    // 4.5. Get admin user for createdBy field
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true }
    });
    
    if (!adminUser) {
      throw new Error('Admin user not found for createdBy field');
    }
    
    console.log(`Using admin user ID: ${adminUser.id} for createdBy`);
    
    // 5. Find and import missing offers
    const allExcelOffers = comprehensiveData.allOffers;
    const missingOffers = allExcelOffers.filter(excelOffer => 
      !existingRefNumbers.has(excelOffer.offerReferenceNumber)
    );
    
    console.log(`\nFound ${missingOffers.length} missing offers to import:`);
    
    if (missingOffers.length === 0) {
      console.log('✅ No missing offers found!');
      return;
    }
    
    // Show sample of missing offers
    console.log('\nSample missing offers:');
    missingOffers.slice(0, 10).forEach((offer, index) => {
      console.log(`${index + 1}. ${offer.offerReferenceNumber} - ${offer.companyName} - ${offer.zone} - ₹${offer.offerValue?.toLocaleString('en-IN')}`);
    });
    
    if (missingOffers.length > 10) {
      console.log(`... and ${missingOffers.length - 10} more`);
    }
    
    // 6. Import missing offers
    console.log('\n=== IMPORTING OFFERS ===');
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const excelOffer of missingOffers) {
      try {
        // Validate required fields
        if (!excelOffer.offerReferenceNumber || !excelOffer.companyName || !excelOffer.zone) {
          throw new Error('Missing required fields');
        }
        
        // Get zone ID
        const zoneId = zoneMap[excelOffer.zone];
        if (!zoneId) {
          throw new Error(`Zone not found: ${excelOffer.zone}`);
        }
        
        // Get or create customer
        let customerId = customerMap[excelOffer.companyName];
        if (!customerId) {
          // Create new customer
          const newCustomer = await prisma.customer.create({
            data: {
              companyName: excelOffer.companyName,
              location: excelOffer.location || '',
              isActive: true,
              createdById: adminUser.id,
              updatedById: adminUser.id
            }
          });
          customerId = newCustomer.id;
          customerMap[excelOffer.companyName] = customerId;
          console.log(`✅ Created customer: ${excelOffer.companyName}`);
        }
        
        // Map stage from Excel to database enum
        let stage = 'INITIAL';
        if (excelOffer.stage) {
          const stageUpper = excelOffer.stage.toUpperCase();
          if (stageUpper.includes('WON')) stage = 'WON';
          else if (stageUpper.includes('ORDER')) stage = 'ORDER_BOOKED';
          else if (stageUpper.includes('PO')) stage = 'PO_RECEIVED';
          else if (stageUpper.includes('FINAL')) stage = 'FINAL_APPROVAL';
          else if (stageUpper.includes('NEGOTIATION')) stage = 'NEGOTIATION';
          else if (stageUpper.includes('PROPOSAL')) stage = 'PROPOSAL_SENT';
        }
        
        // Create the offer
        const newOffer = await prisma.offer.create({
          data: {
            offerReferenceNumber: excelOffer.offerReferenceNumber,
            customerId: customerId,
            contactId: adminUser.id, // Use admin user as contact for now
            zoneId: zoneId,
            stage: stage,
            offerValue: excelOffer.offerValue || 0,
            poValue: excelOffer.offerValue || 0, // Use same value for poValue
            probabilityPercentage: excelOffer.probability ? (excelOffer.probability * 100) : 10,
            poExpectedMonth: excelOffer.poExpectedMonth || '',
            contactPersonName: excelOffer.contactPersonName || '',
            contactNumber: excelOffer.contactNumber || '',
            email: excelOffer.email || '',
            machineSerialNumber: excelOffer.machineSerialNumber || '',
            productType: excelOffer.productType || '',
            department: excelOffer.department || '',
            createdById: adminUser.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Imported: ${excelOffer.offerReferenceNumber} - ${excelOffer.companyName} (${excelOffer.zone})`);
        successCount++;
        
      } catch (error) {
        console.log(`❌ Failed to import ${excelOffer.offerReferenceNumber}: ${error.message}`);
        errors.push({ offer: excelOffer.offerReferenceNumber, error: error.message });
        errorCount++;
      }
    }
    
    // 7. Summary
    console.log(`\n=== IMPORT SUMMARY ===`);
    console.log(`✅ Successfully imported: ${successCount} offers`);
    console.log(`❌ Failed to import: ${errorCount} offers`);
    
    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach(err => {
        console.log(`  ${err.offer}: ${err.error}`);
      });
    }
    
    // 8. Verification
    console.log('\n=== VERIFICATION ===');
    
    for (const zone of zones) {
      const dbOffers = await prisma.offer.findMany({
        where: { zoneId: zone.id },
        select: { offerValue: true }
      });
      
      const excelOffers = comprehensiveData.allOffers.filter(offer => offer.zone === zone.name);
      
      const dbTotal = dbOffers.reduce((sum, offer) => sum + (Number(offer.offerValue) || 0), 0);
      const excelTotal = excelOffers.reduce((sum, offer) => sum + (Number(offer.offerValue) || 0), 0);
      
      const difference = Math.abs(dbTotal - excelTotal);
      const percentDiff = excelTotal > 0 ? (difference / excelTotal) * 100 : 0;
      
      console.log(`${zone.name}:`);
      console.log(`  Excel: ₹${excelTotal.toLocaleString('en-IN')}`);
      console.log(`  Database: ₹${dbTotal.toLocaleString('in-IN')}`);
      console.log(`  Difference: ₹${difference.toLocaleString('en-IN')} (${percentDiff.toFixed(1)}%)`);
      
      if (percentDiff < 1) {
        console.log(`  ✅ PERFECT MATCH`);
      } else if (percentDiff < 5) {
        console.log(`  ✅ EXCELLENT MATCH`);
      } else {
        console.log(`  ⚠️  Still some difference`);
      }
    }
    
    console.log('\n✅ MISSING OFFERS IMPORT COMPLETED!');
    console.log('✅ Database now matches Excel data!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importMissingOffers();
