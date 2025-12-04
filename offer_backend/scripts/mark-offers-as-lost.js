const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function markOffersAsLost() {
  try {
    console.log('=== MARKING OFFERS AS LOST ===');
    
    // Find offers to mark as lost (expected date > 6 months ago)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const calculateMonthsPast = (expectedMonth) => {
      if (!expectedMonth) return null;
      
      try {
        const [year, month] = expectedMonth.split('-').map(Number);
        const totalMonths = (currentYear - year) * 12 + (currentMonth - month);
        return totalMonths;
      } catch (error) {
        return null;
      }
    };
    
    // Find offers to mark as lost
    const offersToMarkLost = await prisma.offer.findMany({
      where: {
        AND: [
          { stage: { not: 'WON' } },
          { stage: { not: 'LOST' } },
          { poExpectedMonth: { not: null } }
        ]
      },
      select: {
        id: true,
        offerReferenceNumber: true,
        stage: true,
        probabilityPercentage: true,
        offerValue: true,
        poExpectedMonth: true,
        createdAt: true,
        assignedTo: {
          select: {
            name: true
          }
        },
        customer: {
          select: {
            companyName: true
          }
        }
      }
    });
    
    // Filter for offers > 6 months past expected date
    const lostOffers = offersToMarkLost.filter(offer => {
      const monthsPast = calculateMonthsPast(offer.poExpectedMonth);
      return monthsPast !== null && monthsPast > 6;
    });
    
    console.log(`Found ${lostOffers.length} offers to mark as LOST`);
    
    if (lostOffers.length === 0) {
      console.log('No offers to mark as lost.');
      return;
    }
    
    // Calculate total value
    const totalLostValue = lostOffers.reduce((sum, offer) => sum + (offer.offerValue || 0), 0);
    
    console.log(`\n=== OFFERS TO BE MARKED AS LOST ===`);
    console.log(`Total offers: ${lostOffers.length}`);
    console.log(`Total value: ₹${totalLostValue.toLocaleString('en-IN')}`);
    
    // Group by months past for analysis
    const byMonthsPast = {};
    lostOffers.forEach(offer => {
      const monthsPast = calculateMonthsPast(offer.poExpectedMonth);
      if (!byMonthsPast[monthsPast]) {
        byMonthsPast[monthsPast] = [];
      }
      byMonthsPast[monthsPast].push(offer);
    });
    
    console.log('\n=== BREAKDOWN BY MONTHS PAST ===');
    Object.entries(byMonthsPast).sort(([a], [b]) => b - a).forEach(([monthsPast, offers]) => {
      console.log(`\n${monthsPast} months past: ${offers.length} offers`);
      offers.slice(0, 3).forEach(offer => {
        console.log(`  ${offer.offerReferenceNumber} - ${offer.customer?.companyName} - ${offer.stage} → LOST`);
      });
      if (offers.length > 3) {
        console.log(`  ... and ${offers.length - 3} more`);
      }
    });
    
    // Mark offers as lost
    console.log('\n=== MARKING OFFERS AS LOST ===');
    
    let updateCount = 0;
    const errors = [];
    
    for (const offer of lostOffers) {
      try {
        await prisma.offer.update({
          where: { id: offer.id },
          data: { 
            stage: 'LOST',
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Updated: ${offer.offerReferenceNumber} - ${offer.stage} → LOST`);
        updateCount++;
        
      } catch (error) {
        console.log(`❌ Error updating ${offer.offerReferenceNumber}: ${error.message}`);
        errors.push({ offer: offer.offerReferenceNumber, error: error.message });
      }
    }
    
    console.log(`\n=== COMPLETION SUMMARY ===`);
    console.log(`✅ Successfully marked ${updateCount} offers as LOST`);
    
    if (errors.length > 0) {
      console.log(`❌ Failed to update ${errors.length} offers:`);
      errors.forEach(err => {
        console.log(`  ${err.offer}: ${err.error}`);
      });
    }
    
    // Verify the updates
    const remainingActive = await prisma.offer.count({
      where: {
        stage: {
          notIn: ['WON', 'LOST']
        }
      }
    });
    
    const lostCount = await prisma.offer.count({
      where: { stage: 'LOST' }
    });
    
    console.log(`\n=== FINAL STATUS ===`);
    console.log(`Active offers (not WON/LOST): ${remainingActive}`);
    console.log(`Lost offers: ${lostCount}`);
    console.log(`Total lost value: ₹${totalLostValue.toLocaleString('en-IN')}`);
    
    console.log('\n✅ Lost offer marking completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

markOffersAsLost();
