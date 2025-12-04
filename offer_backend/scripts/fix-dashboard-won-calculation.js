const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDashboardWonCalculation() {
  try {
    console.log('=== FIXING DASHBOARD WON CALCULATION ===');
    console.log('Issue: Dashboard only sums poValue, not offerValue fallback');
    
    // 1. Get zones
    const zones = await prisma.serviceZone.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    
    // 2. Calculate current dashboard logic (only poValue)
    let currentDashboardWon = 0;
    let fixedDashboardWon = 0;
    
    console.log('\n=== CURRENT vs FIXED CALCULATION ===');
    
    for (const zone of zones) {
      // Current dashboard logic (only poValue)
      const currentLogic = await prisma.offer.aggregate({
        where: { 
          zoneId: zone.id,
          stage: 'WON' 
        },
        _sum: { poValue: true },
      });
      
      const currentWon = currentLogic._sum.poValue ? Number(currentLogic._sum.poValue) : 0;
      
      // Fixed logic (poValue or offerValue fallback)
      const allWonOffers = await prisma.offer.findMany({
        where: { 
          zoneId: zone.id,
          stage: 'WON' 
        },
        select: { poValue: true, offerValue: true }
      });
      
      let fixedWon = 0;
      allWonOffers.forEach(offer => {
        const value = offer.poValue ? Number(offer.poValue) : 
                     (offer.offerValue ? Number(offer.offerValue) : 0);
        fixedWon += value;
      });
      
      console.log(`\n${zone.name.toUpperCase()} ZONE:`);
      console.log(`  Current Dashboard (poValue only): ₹${currentWon.toLocaleString('en-IN')}`);
      console.log(`  Fixed (poValue or offerValue): ₹${fixedWon.toLocaleString('en-IN')}`);
      console.log(`  Difference: ₹${(fixedWon - currentWon).toLocaleString('en-IN')}`);
      
      // Show offers with null poValue
      const offersWithNullPoValue = allWonOffers.filter(offer => !offer.poValue);
      if (offersWithNullPoValue.length > 0) {
        console.log(`  Offers with null poValue (${offersWithNullPoValue.length}):`);
        offersWithNullPoValue.slice(0, 3).forEach((offer, index) => {
          console.log(`    ${index + 1}. poValue: NULL, offerValue: ₹${Number(offer.offerValue || 0).toLocaleString('en-IN')}`);
        });
      }
      
      currentDashboardWon += currentWon;
      fixedDashboardWon += fixedWon;
    }
    
    console.log('\n=== TOTAL COMPARISON ===');
    console.log(`Current Dashboard Total: ₹${currentDashboardWon.toLocaleString('en-IN')}`);
    console.log(`Fixed Dashboard Total: ₹${fixedDashboardWon.toLocaleString('en-IN')}`);
    console.log(`Difference: ₹${(fixedDashboardWon - currentDashboardWon).toLocaleString('en-IN')}`);
    
    // 3. Check if this matches frontend values
    console.log('\n=== FRONTEND MATCH CHECK ===');
    console.log(`Frontend shows: ₹65,72,266`);
    console.log(`Current Dashboard: ₹${currentDashboardWon.toLocaleString('en-IN')}`);
    console.log(`Fixed Dashboard: ₹${fixedDashboardWon.toLocaleString('en-IN')}`);
    console.log(`Frontend matches Current: ${currentDashboardWon === 6572266 ? 'YES' : 'NO'}`);
    console.log(`Frontend matches Fixed: ${fixedDashboardWon === 6572266 ? 'YES' : 'NO'}`);
    
    // 4. Pipeline calculation check
    console.log('\n=== PIPELINE CALCULATION CHECK ===');
    let currentPipeline = 0;
    
    for (const zone of zones) {
      const allActiveOffers = await prisma.offer.findMany({
        where: {
          zoneId: zone.id,
          stage: { not: 'LOST' }
        },
        select: { poValue: true, offerValue: true }
      });
      
      let pipelineValue = 0;
      allActiveOffers.forEach(offer => {
        const value = offer.poValue ? Number(offer.poValue) : 
                     (offer.offerValue ? Number(offer.offerValue) : 0);
        pipelineValue += value;
      });
      
      currentPipeline += pipelineValue;
    }
    
    console.log(`Pipeline Value (all active offers): ₹${currentPipeline.toLocaleString('en-IN')}`);
    console.log(`Frontend Pipeline: ₹6,62,43,250`);
    console.log(`Match: ${currentPipeline === 66243250 ? 'YES' : 'NO'}`);
    
    // 5. Solution
    console.log('\n=== SOLUTION ===');
    console.log('The dashboard controller needs to be updated to:');
    console.log('1. Use poValue if available, otherwise offerValue (like target controller)');
    console.log('2. This will fix the WON value discrepancy');
    console.log('3. Pipeline value might need similar fix');
    
    console.log('\n🎯 RECOMMENDATION:');
    console.log('Update dashboard.controller.ts line 70-72 to use the same logic as target.controller.ts:');
    console.log('```javascript');
    console.log('// Instead of: _sum: { poValue: true }');
    console.log('// Use: Fetch individual offers and sum with fallback');
    console.log('const value = offer.poValue ? Number(offer.poValue) : (offer.offerValue ? Number(offer.offerValue) : 0);');
    console.log('```');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDashboardWonCalculation();
