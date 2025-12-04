const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findExtremeOfferDifference() {
  try {
    console.log('=== FINDING EXTREME OFFER DIFFERENCE ===');
    console.log('Frontend pipeline: ₹6,62,43,250');
    console.log('Our pipeline: ₹6,03,49,754');
    console.log('Difference: ₹58,93,496');
    
    // The difference should be the sum of the two extreme offers we found
    const extreme1 = 17022025; // KXIND/W/YD/SPP/2519
    const extreme2 = 30072024; // KXIND/S/GA/SPP/24042B
    const expectedDiff = extreme1 + extreme2;
    
    console.log(`Expected difference from extreme offers: ₹${expectedDiff.toLocaleString('en-IN')}`);
    console.log(`Actual difference: ₹58,93,496`);
    console.log(`Match: ${expectedDiff === 5893496 ? 'YES ✅' : 'NO ❌'}`);
    
    // Let me check if these offers are being counted differently
    console.log('\n=== CHECKING EXTREME OFFERS ===');
    
    const extremeOffers = await prisma.offer.findMany({
      where: {
        offerReferenceNumber: { in: ['KXIND/W/YD/SPP/2519', 'KXIND/S/GA/SPP/24042B'] }
      },
      select: {
        offerReferenceNumber: true,
        stage: true,
        poValue: true,
        offerValue: true,
        customer: { select: { companyName: true } },
        zone: { select: { name: true } }
      }
    });
    
    extremeOffers.forEach(offer => {
      console.log(`\n${offer.offerReferenceNumber}:`);
      console.log(`  Customer: ${offer.customer.companyName}`);
      console.log(`  Zone: ${offer.zone.name}`);
      console.log(`  Stage: ${offer.stage}`);
      console.log(`  poValue: ₹${Number(offer.poValue || 0).toLocaleString('en-IN')}`);
      console.log(`  offerValue: ₹${Number(offer.offerValue || 0).toLocaleString('en-In')}`);
      
      // Check if this should be included in pipeline
      const isActive = offer.stage !== 'LOST';
      console.log(`  Should be in pipeline: ${isActive ? 'YES' : 'NO'}`);
    });
    
    // Let me also check if there are any other offers we might have missed
    console.log('\n=== COMPREHENSIVE PIPELINE CHECK ===');
    
    const zones = await prisma.serviceZone.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });
    
    let comprehensiveTotal = 0;
    let allOffersList = [];
    
    for (const zone of zones) {
      const zoneOffers = await prisma.offer.findMany({
        where: { zoneId: zone.id },
        select: {
          offerReferenceNumber: true,
          stage: true,
          poValue: true,
          offerValue: true,
          customer: { select: { companyName: true } }
        }
      });
      
      zoneOffers.forEach(offer => {
        const value = offer.poValue ? Number(offer.poValue) : 
                     (offer.offerValue ? Number(offer.offerValue) : 0);
        
        allOffersList.push({
          zone: zone.name,
          ref: offer.offerReferenceNumber,
          customer: offer.customer.companyName,
          stage: offer.stage,
          value: value
        });
        
        if (offer.stage !== 'LOST') {
          comprehensiveTotal += value;
        }
      });
    }
    
    console.log(`Comprehensive pipeline total: ₹${comprehensiveTotal.toLocaleString('en-In')}`);
    console.log(`Our previous total: ₹6,03,49,754`);
    console.log(`Match: ${comprehensiveTotal === 60349754 ? 'YES ✅' : 'NO ❌'}`);
    
    // Check if frontend includes LOST offers
    const withLostTotal = allOffersList.reduce((sum, offer) => sum + offer.value, 0);
    console.log(`Total including LOST offers: ₹${withLostTotal.toLocaleString('en-In')}`);
    console.log(`Frontend pipeline: ₹6,62,43,250`);
    console.log(`Match with LOST included: ${withLostTotal === 66243250 ? 'YES ✅' : 'NO ❌'}`);
    
    // Show the difference
    if (withLostTotal === 66243250) {
      console.log('\n🎯 FOUND: Frontend includes LOST offers in pipeline calculation');
      console.log('This is unusual but might be intentional for total opportunity value');
    } else {
      console.log('\n⚠️  Still investigating pipeline calculation difference');
    }
    
    // Show top offers by value to understand the pattern
    console.log('\n=== TOP 10 OFFERS BY VALUE ===');
    allOffersList
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .forEach((offer, index) => {
        console.log(`${index + 1}. ${offer.ref} - ${offer.customer} - ₹${offer.value.toLocaleString('en-In')} (${offer.stage})`);
      });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findExtremeOfferDifference();
