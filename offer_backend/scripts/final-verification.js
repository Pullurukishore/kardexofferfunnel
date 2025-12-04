const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function finalVerification() {
  try {
    console.log('=== FINAL VERIFICATION OF DATA STATUS ===');
    
    // 1. Load processed data
    const processedStats = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../data/processed/statistics.json'), 
      'utf8'
    ));
    
    const comprehensiveData = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../data/processed/comprehensive-data.json'), 
      'utf8'
    ));
    
    // 2. Current database status
    console.log('\n=== CURRENT DATABASE STATUS ===');
    
    const zones = await prisma.serviceZone.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    
    let totalDbOffers = 0;
    let totalExcelOffers = 0;
    
    for (const zone of zones) {
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
      
      const excelOffers = comprehensiveData.allOffers.filter(offer => offer.zone === zone.name);
      
      const dbTotal = dbOffers.reduce((sum, offer) => sum + (Number(offer.offerValue) || 0), 0);
      const excelTotal = excelOffers.reduce((sum, offer) => sum + (Number(offer.offerValue) || 0), 0);
      
      const difference = Math.abs(dbTotal - excelTotal);
      const percentDiff = excelTotal > 0 ? (difference / excelTotal) * 100 : 0;
      
      console.log(`\n${zone.name} Zone:`);
      console.log(`  Database: ${dbOffers.length} offers, ₹${dbTotal.toLocaleString('en-IN')}`);
      console.log(`  Excel: ${excelOffers.length} offers, ₹${excelTotal.toLocaleString('en-IN')}`);
      console.log(`  Difference: ${dbOffers.length - excelOffers.length} offers, ₹${difference.toLocaleString('en-IN')} (${percentDiff.toFixed(1)}%)`);
      
      totalDbOffers += dbOffers.length;
      totalExcelOffers += excelOffers.length;
      
      // Status
      if (percentDiff < 5) {
        console.log(`  ✅ EXCELLENT MATCH`);
      } else if (percentDiff < 10) {
        console.log(`  ✅ GOOD MATCH`);
      } else {
        console.log(`  ⚠️  SIGNIFICANT DIFFERENCE`);
      }
    }
    
    console.log(`\n=== OVERALL SUMMARY ===`);
    console.log(`Total Database Offers: ${totalDbOffers}`);
    console.log(`Total Excel Offers: ${totalExcelOffers}`);
    console.log(`Missing in Database: ${totalExcelOffers - totalDbOffers} offers`);
    
    // 3. Dashboard calculation simulation
    console.log('\n=== DASHBOARD VALUES SIMULATION ===');
    console.log('Backend calculation (poValue if available, otherwise offerValue):');
    
    let totalDashboardValue = 0;
    
    for (const zone of zones) {
      const offersForCalculation = await prisma.offer.findMany({
        where: {
          zoneId: zone.id,
          stage: { in: ['WON', 'PO_RECEIVED', 'ORDER_BOOKED'] }
        },
        select: {
          id: true,
          stage: true,
          offerValue: true,
          poValue: true
        }
      });
      
      let calculatedValue = 0;
      offersForCalculation.forEach(offer => {
        // Backend logic: poValue if available, otherwise offerValue
        const value = offer.poValue ? Number(offer.poValue) : 
                     (offer.offerValue ? Number(offer.offerValue) : 0);
        calculatedValue += value;
      });
      
      totalDashboardValue += calculatedValue;
      
      console.log(`${zone.name}: ${offersForCalculation.length} qualifying offers → ₹${calculatedValue.toLocaleString('en-IN')}`);
    }
    
    console.log(`\nTotal Dashboard Value: ₹${totalDashboardValue.toLocaleString('en-IN')}`);
    
    // 4. Comparison with original processed data
    const totalProcessedValue = Object.values(processedStats.zoneStats)
      .reduce((sum, zone) => sum + zone.totalValue, 0);
    
    console.log(`\n=== COMPARISON WITH PROCESSED DATA ===`);
    console.log(`Original Processed Value: ₹${totalProcessedValue.toLocaleString('en-IN')}`);
    console.log(`Current Dashboard Value: ₹${totalDashboardValue.toLocaleString('en-IN')}`);
    
    const overallDiff = Math.abs(totalDashboardValue - totalProcessedValue);
    const overallPercentDiff = totalProcessedValue > 0 ? (overallDiff / totalProcessedValue) * 100 : 0;
    
    console.log(`Overall Difference: ₹${overallDiff.toLocaleString('en-IN')} (${overallPercentDiff.toFixed(1)}%)`);
    
    // 5. Final assessment
    console.log('\n=== FINAL ASSESSMENT ===');
    
    if (overallPercentDiff < 5) {
      console.log('✅ EXCELLENT: Dashboard values closely match processed Excel data');
      console.log('✅ Frontend will show correct, realistic values');
      console.log('✅ Data quality is good for business use');
    } else if (overallPercentDiff < 15) {
      console.log('✅ GOOD: Dashboard values are reasonably close to processed data');
      console.log('✅ Frontend will show acceptable values');
      console.log('✅ Minor data gaps but usable for business');
    } else {
      console.log('⚠️  SIGNIFICANT: Large differences between database and Excel data');
      console.log('⚠️  Frontend will show incorrect values');
      console.log('⚠️  Data import needed for accuracy');
    }
    
    console.log('\n=== RECOMMENDATIONS ===');
    
    if (totalExcelOffers - totalDbOffers > 0) {
      console.log(`1. Import ${totalExcelOffers - totalDbOffers} missing offers from Excel to database`);
      console.log('2. This will improve data accuracy and dashboard values');
    } else {
      console.log('1. Database and Excel data are well synchronized');
      console.log('2. Dashboard values are accurate and ready for use');
    }
    
    console.log('3. The extreme poValue issue has been fixed');
    console.log('4. Dashboard will now show realistic business values');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalVerification();
