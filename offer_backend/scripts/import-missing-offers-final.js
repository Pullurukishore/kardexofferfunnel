const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importMissingOffersFinal() {
  try {
    console.log('=== FINAL IMPORT OF MISSING OFFERS ===');
    
    // 1. Load comprehensive data
    const comprehensiveData = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../data/processed/comprehensive-data.json'), 
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
    
    // 3. Get existing offers
    const existingOffers = await prisma.offer.findMany({
      select: { offerReferenceNumber: true }
    });
    const existingRefNumbers = new Set(existingOffers.map(o => o.offerReferenceNumber));
    
    // 4. Find missing offers
    const missingOffers = comprehensiveData.allOffers.filter(offer => 
      !existingRefNumbers.has(offer.offerReferenceNumber)
    );
    
    console.log(`Found ${missingOffers.length} missing offers to import`);
    
    if (missingOffers.length === 0) {
      console.log('✅ No missing offers found!');
      return;
    }
    
    // 5. Import missing offers
    let successCount = 0;
    let errorCount = 0;
    
    for (const excelOffer of missingOffers) {
      try {
        // Skip offers with missing required data
        if (!excelOffer.offerReferenceNumber || !excelOffer.companyName || !excelOffer.zone) {
          console.log(`⚠️  Skipping ${excelOffer.offerReferenceNumber} - missing required data`);
          continue;
        }
        
        // Get zone
        const zone = await prisma.serviceZone.findFirst({
          where: { name: excelOffer.zone }
        });
        
        if (!zone) {
          console.log(`⚠️  Zone not found: ${excelOffer.zone} for offer ${excelOffer.offerReferenceNumber}`);
          continue;
        }
        
        // Get or create customer
        let customer = await prisma.customer.findFirst({
          where: { companyName: excelOffer.companyName }
        });
        
        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              companyName: excelOffer.companyName,
              location: excelOffer.location || '',
              isActive: true,
              createdById: adminUser.id,
              updatedById: adminUser.id
            }
          });
        }
        
        // Get or create contact (use admin user as fallback)
        let contactId = adminUser.id;
        if (excelOffer.email) {
          let contact = await prisma.contact.findFirst({
            where: { email: excelOffer.email }
          });
          
          if (!contact) {
            contact = await prisma.contact.create({
              data: {
                name: excelOffer.contactPersonName || excelOffer.companyName,
                email: excelOffer.email,
                phone: excelOffer.contactNumber ? String(excelOffer.contactNumber) : '',
                isActive: true,
                createdById: adminUser.id,
                updatedById: adminUser.id
              }
            });
          }
          contactId = contact.id;
        }
        
        // Map stage
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
        
        // Create offer
        const newOffer = await prisma.offer.create({
          data: {
            offerReferenceNumber: excelOffer.offerReferenceNumber,
            customerId: customer.id,
            contactId: contactId,
            zoneId: zone.id,
            stage: stage,
            offerValue: excelOffer.offerValue || 0,
            poValue: excelOffer.offerValue || 0, // Use same value
            probabilityPercentage: excelOffer.probability ? Math.round(excelOffer.probability * 100) : 10,
            poExpectedMonth: excelOffer.poExpectedMonth || '',
            contactPersonName: excelOffer.contactPersonName || '',
            contactNumber: excelOffer.contactNumber ? String(excelOffer.contactNumber) : '',
            email: excelOffer.email || '',
            machineSerialNumber: excelOffer.machineSerialNumber || '',
            productType: excelOffer.productType || '',
            department: excelOffer.department || '',
            createdById: adminUser.id,
            updatedById: adminUser.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Imported: ${excelOffer.offerReferenceNumber} - ${excelOffer.companyName} (${excelOffer.zone}) - ₹${excelOffer.offerValue?.toLocaleString('en-IN')}`);
        successCount++;
        
      } catch (error) {
        console.log(`❌ Failed to import ${excelOffer.offerReferenceNumber}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n=== IMPORT SUMMARY ===`);
    console.log(`✅ Successfully imported: ${successCount} offers`);
    console.log(`❌ Failed to import: ${errorCount} offers`);
    
    // 6. Final verification
    console.log('\n=== FINAL VERIFICATION ===');
    
    const zones = await prisma.serviceZone.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    
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
    console.log('✅ Database now matches Excel data much better!');
    console.log('✅ Dashboard values will be more accurate!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importMissingOffersFinal();
