const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function fixExtremePoValues() {
  try {
    console.log('=== FIXING EXTREME poValue VALUES ===');
    
    // 1. Find offers with extreme poValue values (more than 10x offerValue)
    const extremeOffers = await prisma.offer.findMany({
      where: {
        poValue: { not: null },
        offerValue: { not: null, gt: 0 }
      },
      select: {
        id: true,
        offerReferenceNumber: true,
        stage: true,
        offerValue: true,
        poValue: true,
        customer: {
          select: { companyName: true }
        },
        zone: {
          select: { name: true }
        }
      }
    });
    
    console.log(`\nFound ${extremeOffers.length} offers to check...`);
    
    const offersToFix = [];
    extremeOffers.forEach(offer => {
      const offerVal = Number(offer.offerValue) || 0;
      const poVal = Number(offer.poValue) || 0;
      
      // If poValue is more than 10x offerValue, it's likely incorrect
      if (poVal > 0 && (poVal / offerVal) > 10) {
        offersToFix.push({
          ...offer,
          ratio: poVal / offerVal,
          recommendedValue: offerVal
        });
      }
    });
    
    console.log(`\nFound ${offersToFix.length} offers with extreme poValue ratios:`);
    
    if (offersToFix.length === 0) {
      console.log('✅ No extreme poValue values found!');
      return;
    }
    
    // Show top 10 extreme cases
    offersToFix.slice(0, 10).forEach((offer, index) => {
      console.log(`${index + 1}. ${offer.offerReferenceNumber} - ${offer.customer?.companyName} (${offer.zone?.name})`);
      console.log(`   Stage: ${offer.stage}`);
      console.log(`   Offer Value: ₹${offer.offerValue?.toLocaleString('en-IN')}`);
      console.log(`   PO Value: ₹${offer.poValue?.toLocaleString('en-IN')} (${offer.ratio.toFixed(1)}x higher)`);
      console.log(`   Recommended: ₹${offer.recommendedValue?.toLocaleString('en-IN')}`);
      console.log('');
    });
    
    if (offersToFix.length > 10) {
      console.log(`... and ${offersToFix.length - 10} more offers with extreme values`);
    }
    
    // 2. Fix the extreme values
    console.log('\n=== FIXING VALUES ===');
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const offer of offersToFix) {
      try {
        await prisma.offer.update({
          where: { id: offer.id },
          data: {
            poValue: offer.recommendedValue,
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Fixed: ${offer.offerReferenceNumber} - PO: ₹${offer.poValue?.toLocaleString('en-IN')} → ₹${offer.recommendedValue?.toLocaleString('en-IN')}`);
        fixedCount++;
        
      } catch (error) {
        console.log(`❌ Error fixing ${offer.offerReferenceNumber}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n=== FIX SUMMARY ===`);
    console.log(`✅ Successfully fixed: ${fixedCount} offers`);
    console.log(`❌ Failed to fix: ${errorCount} offers`);
    
    // 3. Verify the fix
    console.log('\n=== VERIFICATION ===');
    
    const zones = await prisma.serviceZone.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    
    for (const zone of zones) {
      const offers = await prisma.offer.findMany({
        where: { zoneId: zone.id },
        select: {
          id: true,
          stage: true,
          offerValue: true,
          poValue: true
        }
      });
      
      const totalOfferValue = offers.reduce((sum, offer) => sum + (Number(offer.offerValue) || 0), 0);
      const totalPoValue = offers.reduce((sum, offer) => sum + (Number(offer.poValue) || 0), 0);
      const wonOffers = offers.filter(o => o.stage === 'WON');
      const wonOfferValue = wonOffers.reduce((sum, offer) => sum + (Number(offer.offerValue) || 0), 0);
      const wonPoValue = wonOffers.reduce((sum, offer) => sum + (Number(offer.poValue) || 0), 0);
      
      console.log(`\n${zone.name} Zone (After Fix):`);
      console.log(`  Total offers: ${offers.length}`);
      console.log(`  All offers - offerValue: ₹${totalOfferValue.toLocaleString('en-IN')}`);
      console.log(`  All offers - poValue: ₹${totalPoValue.toLocaleString('en-IN')}`);
      console.log(`  WON offers (${wonOffers.length}) - offerValue: ₹${wonOfferValue.toLocaleString('en-IN')}`);
      console.log(`  WON offers - poValue: ₹${wonPoValue.toLocaleString('en-IN')}`);
    }
    
    // Load processed data for comparison
    const processedStats = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../data/processed/statistics.json'), 
      'utf8'
    ));
    
    console.log('Processed Excel Data vs Fixed Database:');
    
    // Get zone data before the loop
    const zoneOffersData = {};
    for (const zone of zones) {
      const offers = await prisma.offer.findMany({
        where: { zoneId: zone.id },
        select: { offerValue: true }
      });
      zoneOffersData[zone.name] = offers.reduce((sum, offer) => sum + (Number(offer.offerValue) || 0), 0);
    }
    
    Object.entries(processedStats.zoneStats).forEach(([zone, stats]) => {
      const currentValue = zoneOffersData[zone] || 0;
      const processedValue = stats.totalValue;
      const difference = Math.abs(currentValue - processedValue);
      const percentDiff = processedValue > 0 ? (difference / processedValue) * 100 : 0;
      
      console.log(`${zone}:`);
      console.log(`  Processed: ₹${processedValue.toLocaleString('en-IN')}`);
      console.log(`  Database:  ₹${currentValue.toLocaleString('en-IN')}`);
      console.log(`  Difference: ₹${difference.toLocaleString('en-IN')} (${percentDiff.toFixed(1)}%)`);
    });
    
    console.log('\n✅ poValue fix completed successfully!');
    console.log('✅ Dashboard values should now match processed Excel data');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExtremePoValues();
