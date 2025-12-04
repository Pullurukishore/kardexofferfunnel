const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function analyzeDataDifferences() {
  try {
    console.log('=== ANALYZING DATA DIFFERENCES ===');
    
    // 1. Load processed Excel data
    const processedStats = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../data/processed/statistics.json'), 
      'utf8'
    ));
    
    // 2. Load comprehensive processed data for detailed comparison
    const comprehensiveData = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../data/processed/comprehensive-data.json'), 
      'utf8'
    ));
    
    console.log('\n=== DETAILED ZONE ANALYSIS ===');
    
    const zones = await prisma.serviceZone.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    
    for (const zone of zones) {
      console.log(`\n=== ${zone.name} ZONE ANALYSIS ===`);
      
      // Get current database offers
      const dbOffers = await prisma.offer.findMany({
        where: { zoneId: zone.id },
        select: {
          id: true,
          offerReferenceNumber: true,
          stage: true,
          offerValue: true,
          poValue: true,
          customer: {
            select: { companyName: true }
          }
        }
      });
      
      // Get processed Excel offers for this zone
      const excelOffers = comprehensiveData.allOffers.filter(offer => offer.zone === zone.name);
      
      console.log(`Database offers: ${dbOffers.length}`);
      console.log(`Excel offers: ${excelOffers.length}`);
      
      // Calculate totals
      const dbTotal = dbOffers.reduce((sum, offer) => sum + (Number(offer.offerValue) || 0), 0);
      const excelTotal = excelOffers.reduce((sum, offer) => sum + (Number(offer.offerValue) || 0), 0);
      
      console.log(`Database total: ₹${dbTotal.toLocaleString('en-IN')}`);
      console.log(`Excel total: ₹${excelTotal.toLocaleString('en-IN')}`);
      console.log(`Difference: ₹${Math.abs(dbTotal - excelTotal).toLocaleString('en-IN')}`);
      
      // Check for missing offers
      const dbRefNumbers = new Set(dbOffers.map(o => o.offerReferenceNumber));
      const excelRefNumbers = new Set(excelOffers.map(o => o.offerReferenceNumber));
      
      const missingInDB = excelOffers.filter(o => !dbRefNumbers.has(o.offerReferenceNumber));
      const extraInDB = dbOffers.filter(o => !excelRefNumbers.has(o.offerReferenceNumber));
      
      if (missingInDB.length > 0) {
        console.log(`\n❌ Missing in database (${missingInDB.length}):`);
        missingInDB.slice(0, 5).forEach(offer => {
          console.log(`   ${offer.offerReferenceNumber} - ${offer.companyName} - ₹${offer.offerValue?.toLocaleString('en-IN')}`);
        });
        if (missingInDB.length > 5) {
          console.log(`   ... and ${missingInDB.length - 5} more`);
        }
      }
      
      if (extraInDB.length > 0) {
        console.log(`\n➕ Extra in database (${extraInDB.length}):`);
        extraInDB.slice(0, 5).forEach(offer => {
          console.log(`   ${offer.offerReferenceNumber} - ${offer.customer?.companyName} - ₹${offer.offerValue?.toLocaleString('en-IN')}`);
        });
        if (extraInDB.length > 5) {
          console.log(`   ... and ${extraInDB.length - 5} more`);
        }
      }
      
      // Check for value differences in common offers
      const commonOffers = dbOffers.filter(dbOffer => 
        excelRefNumbers.has(dbOffer.offerReferenceNumber)
      );
      
      let valueDifferenceCount = 0;
      let totalValueDiff = 0;
      
      commonOffers.forEach(dbOffer => {
        const excelOffer = excelOffers.find(e => e.offerReferenceNumber === dbOffer.offerReferenceNumber);
        if (excelOffer) {
          const dbVal = Number(dbOffer.offerValue) || 0;
          const excelVal = Number(excelOffer.offerValue) || 0;
          if (dbVal !== excelVal) {
            valueDifferenceCount++;
            totalValueDiff += Math.abs(dbVal - excelVal);
            if (valueDifferenceCount <= 5) {
              console.log(`   Value diff: ${dbOffer.offerReferenceNumber} - DB: ₹${dbVal}, Excel: ₹${excelVal}`);
            }
          }
        }
      });
      
      if (valueDifferenceCount > 5) {
        console.log(`   ... and ${valueDifferenceCount - 5} more offers with value differences`);
      }
      
      if (valueDifferenceCount > 0) {
        console.log(`Total value difference: ₹${totalValueDiff.toLocaleString('en-IN')} across ${valueDifferenceCount} offers`);
      }
      
      // Summary for this zone
      console.log(`\n📊 ${zone.name} Summary:`);
      console.log(`   Match Status: ${missingInDB.length === 0 && extraInDB.length === 0 ? '✅ Perfect Match' : '⚠️ Data Mismatch'}`);
      console.log(`   Missing Offers: ${missingInDB.length}`);
      console.log(`   Extra Offers: ${extraInDB.length}`);
      console.log(`   Value Differences: ${valueDifferenceCount}`);
    }
    
    // 3. Overall summary
    console.log('\n=== OVERALL DATA INTEGRITY SUMMARY ===');
    
    let totalMissingInDB = 0;
    let totalExtraInDB = 0;
    let totalValueDifferences = 0;
    
    for (const zone of zones) {
      const dbOffers = await prisma.offer.findMany({
        where: { zoneId: zone.id },
        select: { offerReferenceNumber: true, offerValue: true }
      });
      
      const excelOffers = comprehensiveData.allOffers.filter(offer => offer.zone === zone.name);
      
      const dbRefNumbers = new Set(dbOffers.map(o => o.offerReferenceNumber));
      const excelRefNumbers = new Set(excelOffers.map(o => o.offerReferenceNumber));
      
      totalMissingInDB += excelOffers.filter(o => !dbRefNumbers.has(o.offerReferenceNumber)).length;
      totalExtraInDB += dbOffers.filter(o => !excelRefNumbers.has(o.offerReferenceNumber)).length;
    }
    
    console.log(`Total Missing in Database: ${totalMissingInDB}`);
    console.log(`Total Extra in Database: ${totalExtraInDB}`);
    
    if (totalMissingInDB === 0 && totalExtraInDB === 0) {
      console.log('✅ Database and Excel data are perfectly synchronized!');
    } else {
      console.log('⚠️ Data synchronization issues found');
      console.log('\nRecommended Actions:');
      if (totalMissingInDB > 0) {
        console.log(`1. Import ${totalMissingInDB} missing offers from Excel to database`);
      }
      if (totalExtraInDB > 0) {
        console.log(`2. Review ${totalExtraInDB} extra offers in database`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDataDifferences();
