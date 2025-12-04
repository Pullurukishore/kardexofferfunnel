const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function markLostOffers() {
  try {
    console.log('=== MARKING LOST OFFERS ===');
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Define criteria for lost offers
    const lostCriteria = {
      // Offers expected before January 2025 (more than 10 months old)
      expectedBeforeMonth: '2025-01',
      // Very low probability
      maxProbability: 10,
      // Minimum age in days
      minAgeDays: 180 // 6 months
    };
    
    console.log('Lost criteria:');
    console.log(`- Expected PO before: ${lostCriteria.expectedBeforeMonth}`);
    console.log(`- Maximum probability: ${lostCriteria.maxProbability}%`);
    console.log(`- Minimum age: ${lostCriteria.minAgeDays} days`);
    
    // Find offers to mark as lost
    const offersToMarkLost = await prisma.offer.findMany({
      where: {
        AND: [
          { stage: { not: 'WON' } },
          { stage: { not: 'LOST' } },
          { poExpectedMonth: { lt: lostCriteria.expectedBeforeMonth } },
          { 
            OR: [
              { probabilityPercentage: { lt: lostCriteria.maxProbability } },
              { 
                createdAt: { 
                  lt: new Date(currentDate.getTime() - lostCriteria.minAgeDays * 24 * 60 * 60 * 1000) 
                }
              }
            ]
          }
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
        updatedAt: true,
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
    
    console.log(`\nFound ${offersToMarkLost.length} offers to mark as LOST`);
    
    if (offersToMarkLost.length === 0) {
      console.log('No offers meet the lost criteria.');
      return;
    }
    
    // Group by user for better analysis
    const lostByUser = {};
    offersToMarkLost.forEach(offer => {
      const userName = offer.assignedTo?.name || 'Unassigned';
      if (!lostByUser[userName]) {
        lostByUser[userName] = [];
      }
      lostByUser[userName].push(offer);
    });
    
    console.log('\n=== LOST OFFERS BY USER ===');
    Object.entries(lostByUser).forEach(([userName, offers]) => {
      const totalValue = offers.reduce((sum, offer) => sum + (offer.offerValue || 0), 0);
      console.log(`\n${userName}: ${offers.length} offers, Total value: ₹${totalValue.toLocaleString('en-IN')}`);
      
      offers.slice(0, 3).forEach(offer => {
        const monthsPast = calculateMonthsPast(offer.poExpectedMonth);
        console.log(`  ${offer.offerReferenceNumber} - ${offer.customer?.companyName} - ${offer.probabilityPercentage}% - Expected ${monthsPast} months ago`);
      });
      
      if (offers.length > 3) {
        console.log(`  ... and ${offers.length - 3} more`);
      }
    });
    
    // Calculate total lost value
    const totalLostValue = offersToMarkLost.reduce((sum, offer) => sum + (offer.offerValue || 0), 0);
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total offers to mark as LOST: ${offersToMarkLost.length}`);
    console.log(`Total lost value: ₹${totalLostValue.toLocaleString('en-IN')}`);
    
    // Ask for confirmation before proceeding
    console.log('\n=== ACTION REQUIRED ===');
    console.log('Do you want to mark these offers as LOST?');
    console.log('This will:');
    console.log('1. Change their stage to LOST');
    console.log('2. Add a remark about the reason');
    console.log('3. Update the timestamp');
    
    console.log('\nOptions:');
    console.log('1. Mark all as LOST');
    console.log('2. Review first, then mark');
    console.log('3. Use different criteria');
    console.log('4. Cancel');
    
    // For now, let's just show what would be marked
    console.log('\n=== OFFERS THAT WOULD BE MARKED AS LOST ===');
    offersToMarkLost.slice(0, 10).forEach(offer => {
      const monthsPast = calculateMonthsPast(offer.poExpectedMonth);
      const daysOld = Math.floor((currentDate - new Date(offer.createdAt)) / (1000 * 60 * 60 * 24));
      console.log(`${offer.offerReferenceNumber} - ${offer.customer?.companyName}`);
      console.log(`  Current: ${offer.stage} → LOST`);
      console.log(`  Probability: ${offer.probabilityPercentage}%`);
      console.log(`  Expected: ${monthsPast} months ago`);
      console.log(`  Age: ${daysOld} days`);
      console.log(`  Value: ₹${offer.offerValue?.toLocaleString('en-IN')}`);
      console.log('');
    });
    
    if (offersToMarkLost.length > 10) {
      console.log(`... and ${offersToMarkLost.length - 10} more offers`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function calculateMonthsPast(expectedMonth) {
  if (!expectedMonth) return 'Unknown';
  
  const [year, month] = expectedMonth.split('-').map(Number);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const monthsPast = (currentYear - year) * 12 + (currentMonth - month);
  return monthsPast;
}

markLostOffers();
