const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigateFrontendPipelineLogic() {
  try {
    console.log('=== INVESTIGATING FRONTEND PIPELINE LOGIC ===');
    console.log('Frontend Pipeline: ₹6,62,43,250');
    console.log('Our Pipeline: ₹6,03,49,754');
    console.log('Difference: ₹58,93,496');
    
    // Let me check if the frontend might be including offers with null values
    // or using a different calculation method
    
    const zones = await prisma.serviceZone.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    
    // Method 1: Check if frontend includes offers with null values
    console.log('\n=== METHOD 1: INCLUDING NULL VALUES ===');
    
    let method1Total = 0;
    for (const zone of zones) {
      const allOffers = await prisma.offer.findMany({
        where: {
          zoneId: zone.id,
          stage: { not: 'LOST' }
        },
        select: { poValue: true, offerValue: true, stage: true }
      });
      
      let zoneTotal = 0;
      allOffers.forEach(offer => {
        // Include offers even if value is 0 or null
        const poValue = offer.poValue ? Number(offer.poValue) : 0;
        const offerValue = offer.offerValue ? Number(offer.offerValue) : 0;
        const value = poValue || offerValue || 0;
        zoneTotal += value;
      });
      
      method1Total += zoneTotal;
      console.log(`${zone.name}: ₹${zoneTotal.toLocaleString('en-In')} (${allOffers.length} offers)`);
    }
    
    console.log(`Method 1 Total: ₹${method1Total.toLocaleString('en-In')}`);
    console.log(`Match Frontend: ${method1Total === 66243250 ? 'YES ✅' : 'NO ❌'}`);
    
    // Method 2: Check if frontend uses different stage filtering
    console.log('\n=== METHOD 2: DIFFERENT STAGE FILTERING ===');
    
    // Check all possible stage combinations
    const allStages = await prisma.offer.groupBy({
      by: ['stage'],
      _count: { stage: true },
      _sum: { poValue: true, offerValue: true }
    });
    
    console.log('All stages in database:');
    allStages.forEach(stage => {
      const poSum = stage._sum.poValue ? Number(stage._sum.poValue) : 0;
      const offerSum = stage._sum.offerValue ? Number(stage._sum.offerValue) : 0;
      console.log(`  ${stage.stage}: ${stage._count.stage} offers, poValue: ₹${poSum.toLocaleString('en-In')}, offerValue: ₹${offerSum.toLocaleString('en-In')}`);
    });
    
    // Method 3: Check if frontend includes all offers regardless of stage
    console.log('\n=== METHOD 3: ALL OFFERS REGARDLESS OF STAGE ===');
    
    let method3Total = 0;
    for (const zone of zones) {
      const allOffers = await prisma.offer.findMany({
        where: { zoneId: zone.id },
        select: { poValue: true, offerValue: true, stage: true }
      });
      
      let zoneTotal = 0;
      allOffers.forEach(offer => {
        const poValue = offer.poValue ? Number(offer.poValue) : 0;
        const offerValue = offer.offerValue ? Number(offer.offerValue) : 0;
        const value = poValue || offerValue || 0;
        zoneTotal += value;
      });
      
      method3Total += zoneTotal;
      console.log(`${zone.name}: ₹${zoneTotal.toLocaleString('en-In')} (${allOffers.length} offers)`);
    }
    
    console.log(`Method 3 Total: ₹${method3Total.toLocaleString('en-In')}`);
    console.log(`Match Frontend: ${method3Total === 66243250 ? 'YES ✅' : 'NO ❌'}`);
    
    // Method 4: Check if frontend uses different value priority
    console.log('\n=== METHOD 4: DIFFERENT VALUE PRIORITY ===');
    
    // Maybe frontend prioritizes offerValue over poValue (opposite of WON calculation)
    let method4Total = 0;
    for (const zone of zones) {
      const allOffers = await prisma.offer.findMany({
        where: {
          zoneId: zone.id,
          stage: { not: 'LOST' }
        },
        select: { poValue: true, offerValue: true, stage: true }
      });
      
      let zoneTotal = 0;
      allOffers.forEach(offer => {
        // Opposite priority: offerValue first, then poValue
        const value = offer.offerValue ? Number(offer.offerValue) : 
                     (offer.poValue ? Number(offer.poValue) : 0);
        zoneTotal += value;
      });
      
      method4Total += zoneTotal;
      console.log(`${zone.name}: ₹${zoneTotal.toLocaleString('en-In')} (${allOffers.length} offers)`);
    }
    
    console.log(`Method 4 Total: ₹${method4Total.toLocaleString('en-In')}`);
    console.log(`Match Frontend: ${method4Total === 66243250 ? 'YES ✅' : 'NO ❌'}`);
    
    // Method 5: Check if frontend uses sum of both poValue and offerValue
    console.log('\n=== METHOD 5: SUM OF BOTH VALUES ===');
    
    let method5Total = 0;
    for (const zone of zones) {
      const allOffers = await prisma.offer.findMany({
        where: {
          zoneId: zone.id,
          stage: { not: 'LOST' }
        },
        select: { poValue: true, offerValue: true, stage: true }
      });
      
      let zoneTotal = 0;
      allOffers.forEach(offer => {
        const poValue = offer.poValue ? Number(offer.poValue) : 0;
        const offerValue = offer.offerValue ? Number(offer.offerValue) : 0;
        // Sum both values
        zoneTotal += poValue + offerValue;
      });
      
      method5Total += zoneTotal;
      console.log(`${zone.name}: ₹${zoneTotal.toLocaleString('en-In')} (${allOffers.length} offers)`);
    }
    
    console.log(`Method 5 Total: ₹${method5Total.toLocaleString('en-In')}`);
    console.log(`Match Frontend: ${method5Total === 66243250 ? 'YES ✅' : 'NO ❌'}`);
    
    // Method 6: Check if frontend uses date-based filtering
    console.log('\n=== METHOD 6: DATE-BASED FILTERING ===');
    
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    // Last 30 days
    let method6aTotal = 0;
    for (const zone of zones) {
      const recentOffers = await prisma.offer.findMany({
        where: {
          zoneId: zone.id,
          stage: { not: 'LOST' },
          createdAt: { gte: last30Days }
        },
        select: { poValue: true, offerValue: true }
      });
      
      recentOffers.forEach(offer => {
        const value = offer.poValue ? Number(offer.poValue) : 
                     (offer.offerValue ? Number(offer.offerValue) : 0);
        method6aTotal += value;
      });
    }
    
    console.log(`Last 30 Days: ₹${method6aTotal.toLocaleString('en-In')}`);
    console.log(`Match Frontend: ${method6aTotal === 66243250 ? 'YES ✅' : 'NO ❌'}`);
    
    // Last 90 days
    let method6bTotal = 0;
    for (const zone of zones) {
      const recentOffers = await prisma.offer.findMany({
        where: {
          zoneId: zone.id,
          stage: { not: 'LOST' },
          createdAt: { gte: last90Days }
        },
        select: { poValue: true, offerValue: true }
      });
      
      recentOffers.forEach(offer => {
        const value = offer.poValue ? Number(offer.poValue) : 
                     (offer.offerValue ? Number(offer.offerValue) : 0);
        method6bTotal += value;
      });
    }
    
    console.log(`Last 90 Days: ₹${method6bTotal.toLocaleString('en-In')}`);
    console.log(`Match Frontend: ${method6bTotal === 66243250 ? 'YES ✅' : 'NO ❌'}`);
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Frontend Target: ₹6,62,43,250`);
    console.log(`Method 1 (Include nulls): ₹${method1Total.toLocaleString('en-In')}`);
    console.log(`Method 2 (All stages): ₹${method3Total.toLocaleString('en-In')}`);
    console.log(`Method 3 (offerValue priority): ₹${method4Total.toLocaleString('en-In')}`);
    console.log(`Method 4 (Sum both values): ₹${method5Total.toLocaleString('en-In')}`);
    console.log(`Method 5 (Last 30 days): ₹${method6aTotal.toLocaleString('en-In')}`);
    console.log(`Method 6 (Last 90 days): ₹${method6bTotal.toLocaleString('en-In')}`);
    
    // Find closest match
    const methods = [
      { name: 'Include nulls', value: method1Total },
      { name: 'All stages', value: method3Total },
      { name: 'offerValue priority', value: method4Total },
      { name: 'Sum both values', value: method5Total },
      { name: 'Last 30 days', value: method6aTotal },
      { name: 'Last 90 days', value: method6bTotal }
    ];
    
    const closest = methods.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.value - 66243250);
      const currDiff = Math.abs(curr.value - 66243250);
      return currDiff < prevDiff ? curr : prev;
    });
    
    console.log(`\nClosest match: ${closest.name} with difference of ₹${Math.abs(closest.value - 66243250).toLocaleString('en-In')}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateFrontendPipelineLogic();
