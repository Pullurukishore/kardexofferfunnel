const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugFrontendValues() {
  try {
    console.log('=== DEBUGGING FRONTEND VALUES ===');
    console.log('Frontend shows: WON Value ₹65,72,266 and Pipeline Value ₹6,62,43,250');
    console.log('Our calculation: WON Value ₹83,96,678 and Pipeline Value ₹6,03,49,754');
    console.log('\nLet me find what the backend is actually returning...');
    
    // 1. Get zones
    const zones = await prisma.serviceZone.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    
    // 2. Simulate getZoneActualPerformance for current month (November 2025)
    console.log('\n=== BACKEND getZoneActualPerformance SIMULATION ===');
    console.log('Target Period: 2025-11 (Current Month)');
    console.log('Period Type: MONTHLY');
    
    let backendTotalWon = 0;
    let backendTotalPipeline = 0;
    
    for (const zone of zones) {
      // Simulate the exact backend logic
      const startDate = new Date('2025-11-01');
      const endDate = new Date('2025-11-30');
      
      // Backend where clause for WON offers
      const whereClause = {
        zoneId: zone.id,
        stage: { in: ['WON', 'PO_RECEIVED', 'ORDER_BOOKED'] },
        OR: [
          // PO-based stages: use poDate
          {
            AND: [
              { stage: { in: ['PO_RECEIVED', 'ORDER_BOOKED'] } },
              { poDate: { gte: startDate, lte: endDate } },
            ],
          },
          // ORDER_BOOKED: prefer bookingDateInSap when available
          {
            AND: [
              { stage: 'ORDER_BOOKED' },
              { bookingDateInSap: { gte: startDate, lte: endDate } },
            ],
          },
          // WON stage: use offerClosedInCrm
          {
            AND: [
              { stage: 'WON' },
              { offerClosedInCrm: { gte: startDate, lte: endDate } },
            ],
          },
          // Fallback: if above dates missing, use createdAt
          {
            AND: [
              { OR: [
                { poDate: null },
                { offerClosedInCrm: null },
                { bookingDateInSap: null },
              ] },
              { createdAt: { gte: startDate, lte: endDate } },
            ],
          },
        ],
      };
      
      const backendWonOffers = await prisma.offer.findMany({
        where: whereClause,
        select: {
          id: true,
          stage: true,
          poValue: true,
          offerValue: true,
          createdAt: true,
          offerClosedInCrm: true,
          poDate: true,
          bookingDateInSap: true,
        },
      });
      
      // Calculate backend WON value
      let backendWonValue = 0;
      backendWonOffers.forEach(offer => {
        const value = offer.poValue ? Number(offer.poValue) : 
                     (offer.offerValue ? Number(offer.offerValue) : 0);
        if (value > 0) {
          backendWonValue += value;
        }
      });
      
      // For pipeline, backend might be using different logic
      // Let me check all offers for the zone (excluding LOST)
      const allPipelineOffers = await prisma.offer.findMany({
        where: {
          zoneId: zone.id,
          stage: { not: 'LOST' }
        },
        select: {
          id: true,
          stage: true,
          poValue: true,
          offerValue: true,
        }
      });
      
      let pipelineValue = 0;
      allPipelineOffers.forEach(offer => {
        const value = offer.poValue ? Number(offer.poValue) : 
                     (offer.offerValue ? Number(offer.offerValue) : 0);
        pipelineValue += value;
      });
      
      console.log(`\n${zone.name.toUpperCase()} ZONE:`);
      console.log(`  Backend WON offers (Nov 2025): ${backendWonOffers.length}`);
      console.log(`  Backend WON value: ₹${backendWonValue.toLocaleString('en-IN')}`);
      console.log(`  All Pipeline offers: ${allPipelineOffers.length}`);
      console.log(`  Pipeline value: ₹${pipelineValue.toLocaleString('en-IN')}`);
      
      // Show dates for WON offers
      if (backendWonOffers.length > 0) {
        console.log(`  WON offers with dates:`);
        backendWonOffers.slice(0, 3).forEach((offer, index) => {
          console.log(`    ${index + 1}. ${offer.offerReferenceNumber} - Stage: ${offer.stage}`);
          console.log(`       poDate: ${offer.poDate || 'NULL'}`);
          console.log(`       offerClosedInCrm: ${offer.offerClosedInCrm || 'NULL'}`);
          console.log(`       bookingDateInSap: ${offer.bookingDateInSap || 'NULL'}`);
          console.log(`       createdAt: ${offer.createdAt}`);
          console.log(`       Value: ₹${(offer.poValue || offer.offerValue || 0).toLocaleString('en-IN')}`);
        });
      }
      
      backendTotalWon += backendWonValue;
      backendTotalPipeline += pipelineValue;
    }
    
    console.log('\n=== BACKEND TOTALS SIMULATION ===');
    console.log(`Backend WON Value (Nov 2025 only): ₹${backendTotalWon.toLocaleString('en-IN')}`);
    console.log(`Backend Pipeline Value (all active): ₹${backendTotalPipeline.toLocaleString('en-IN')}`);
    
    // 3. Check if this matches frontend
    console.log('\n=== COMPARISON ===');
    console.log(`Frontend WON: ₹65,72,266`);
    console.log(`Backend Simulation: ₹${backendTotalWon.toLocaleString('en-IN')}`);
    console.log(`Match: ${backendTotalWon === 6572266 ? 'YES' : 'NO'}`);
    
    console.log(`\nFrontend Pipeline: ₹6,62,43,250`);
    console.log(`Backend Simulation: ₹${backendTotalPipeline.toLocaleString('en-IN')}`);
    console.log(`Match: ${backendTotalPipeline === 66243250 ? 'YES' : 'NO'}`);
    
    // 4. Check yearly vs monthly
    console.log('\n=== CHECKING YEARLY vs MONTHLY ===');
    
    let yearlyWon = 0;
    for (const zone of zones) {
      // All WON offers for the year (no date filter)
      const yearlyWonOffers = await prisma.offer.findMany({
        where: {
          zoneId: zone.id,
          stage: { in: ['WON', 'PO_RECEIVED', 'ORDER_BOOKED'] }
        },
        select: {
          poValue: true,
          offerValue: true,
        }
      });
      
      yearlyWonOffers.forEach(offer => {
        const value = offer.poValue ? Number(offer.poValue) : 
                     (offer.offerValue ? Number(offer.offerValue) : 0);
        yearlyWon += value;
      });
    }
    
    console.log(`Yearly WON Value (all time): ₹${yearlyWon.toLocaleString('en-IN')}`);
    console.log(`Monthly WON Value (Nov 2025): ₹${backendTotalWon.toLocaleString('en-IN')}`);
    console.log(`Difference: ₹${(yearlyWon - backendTotalWon).toLocaleString('en-IN')}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFrontendValues();
