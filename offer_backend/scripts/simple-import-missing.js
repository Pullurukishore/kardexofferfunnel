const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function simpleImportMissing() {
  try {
    console.log('=== SIMPLE IMPORT OF MISSING OFFERS ===');
    
    // 1. Load import-ready data (already structured for database)
    const importData = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../data/processed/import-ready-data.json'), 
      'utf8'
    ));
    
    // 2. Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true }
    });
    
    if (!adminUser) {
      throw new Error('Admin user not found');
    }
    
    console.log(`Using admin user ID: ${adminUser.id}`);
    
    // 3. Get existing offers to avoid duplicates
    const existingRefNumbers = new Set();
    const existingOffers = await prisma.offer.findMany({
      select: { offerReferenceNumber: true }
    });
    existingOffers.forEach(offer => existingRefNumbers.add(offer.offerReferenceNumber));
    
    console.log(`Found ${existingOffers.length} existing offers`);
    
    // 4. Import missing offers from import-ready data
    const allImportOffers = importData.offers;
    const missingOffers = allImportOffers.filter(offer => 
      !existingRefNumbers.has(offer.offerReferenceNumber)
    );
    
    console.log(`Found ${missingOffers.length} missing offers to import`);
    
    if (missingOffers.length === 0) {
      console.log('✅ No missing offers found!');
      return;
    }
    
    // 5. Import offers one by one
    let successCount = 0;
    let errorCount = 0;
    
    for (const offerData of missingOffers) {
      try {
        // Map zone name to ID
        const zone = await prisma.serviceZone.findFirst({
          where: { name: offerData.zone },
          select: { id: true }
        });
        
        if (!zone) {
          throw new Error(`Zone not found: ${offerData.zone}`);
        }
        
        // Find or create customer
        let customer = await prisma.customer.findFirst({
          where: { companyName: offerData.companyName }
        });
        
        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              companyName: offerData.companyName,
              location: offerData.location || '',
              isActive: true,
              createdById: adminUser.id,
              updatedById: adminUser.id
            }
          });
          console.log(`✅ Created customer: ${offerData.companyName}`);
        }
        
        // Create contact if needed
        let contact = await prisma.contact.findFirst({
          where: { email: offerData.email || '' }
        });
        
        if (!contact && offerData.email) {
          contact = await prisma.contact.create({
            data: {
              name: offerData.contactPersonName || '',
              email: offerData.email || '',
              phone: offerData.contactNumber || '',
              isActive: true,
              createdById: adminUser.id,
              updatedById: adminUser.id
            }
          });
        }
        
        // Create the offer
        const newOffer = await prisma.offer.create({
          data: {
            offerReferenceNumber: offerData.offerReferenceNumber,
            customerId: customer.id,
            contactId: contact?.id || adminUser.id,
            zoneId: zone.id,
            stage: offerData.stage || 'INITIAL',
            offerValue: offerData.offerValue || 0,
            poValue: offerData.offerValue || 0,
            probabilityPercentage: offerData.probabilityPercentage || 10,
            poExpectedMonth: offerData.poExpectedMonth || '',
            contactPersonName: offerData.contactPersonName || '',
            contactNumber: offerData.contactNumber || '',
            email: offerData.email || '',
            machineSerialNumber: offerData.machineSerialNumber || '',
            productType: offerData.productType || '',
            department: offerData.department || '',
            createdById: adminUser.id,
            updatedById: adminUser.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Imported: ${offerData.offerReferenceNumber} - ${offerData.companyName} (${offerData.zone})`);
        successCount++;
        
      } catch (error) {
        console.log(`❌ Failed to import ${offerData.offerReferenceNumber}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n=== IMPORT SUMMARY ===`);
    console.log(`✅ Successfully imported: ${successCount} offers`);
    console.log(`❌ Failed to import: ${errorCount} offers`);
    
    // 6. Verification
    console.log('\n=== FINAL VERIFICATION ===');
    
    const zones = await prisma.serviceZone.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    
    // Load processed stats for comparison
    const processedStats = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../data/processed/statistics.json'), 
      'utf8'
    ));
    
    for (const zone of zones) {
      const dbOffers = await prisma.offer.findMany({
        where: { zoneId: zone.id },
        select: { offerValue: true }
      });
      
      const excelOffers = importData.offers.filter(offer => offer.zone === zone.name);
      
      const dbTotal = dbOffers.reduce((sum, offer) => sum + (Number(offer.offerValue) || 0), 0);
      const excelTotal = excelOffers.reduce((sum, offer) => sum + (Number(offer.offerValue) || 0), 0);
      
      const difference = Math.abs(dbTotal - excelTotal);
      const percentDiff = excelTotal > 0 ? (difference / excelTotal) * 100 : 0;
      
      console.log(`${zone.name}:`);
      console.log(`  Excel: ₹${excelTotal.toLocaleString('en-IN')}`);
      console.log(`  Database: ₹${dbTotal.toLocaleString('en-IN')}`);
      console.log(`  Difference: ₹${difference.toLocaleString('en-IN')} (${percentDiff.toFixed(1)}%)`);
      
      if (percentDiff < 1) {
        console.log(`  ✅ PERFECT MATCH`);
      } else if (percentDiff < 5) {
        console.log(`  ✅ EXCELLENT MATCH`);
      } else if (percentDiff < 10) {
        console.log(`  ✅ GOOD MATCH`);
      } else {
        console.log(`  ⚠️  Still some difference`);
      }
    }
    
    console.log('\n✅ IMPORT COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleImportMissing();
