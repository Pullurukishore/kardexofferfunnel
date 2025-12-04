const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixLostAnalysis() {
  try {
    console.log('=== CORRECTED LOST OFFER ANALYSIS ===');
    
    const currentDate = new Date();
    console.log(`Current date: ${currentDate.toISOString().split('T')[0]}`);
    
    // Get all non-WON offers with date analysis
    const activeOffers = await prisma.offer.findMany({
      where: {
        stage: {
          not: 'WON'
        }
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
      },
      orderBy: {
        poExpectedMonth: 'asc'
      }
    });
    
    console.log(`\nFound ${activeOffers.length} active (non-WON) offers`);
    
    // Manual date calculation
    const calculateMonthsPastCorrect = (expectedMonth) => {
      if (!expectedMonth) return 'No date';
      
      try {
        const [year, month] = expectedMonth.split('-').map(Number);
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        
        const totalMonths = (currentYear - year) * 12 + (currentMonth - month);
        return totalMonths;
      } catch (error) {
        return 'Invalid';
      }
    };
    
    // Analyze the date ranges
    console.log('\n=== DATE RANGE ANALYSIS ===');
    const dateRanges = {};
    
    activeOffers.forEach(offer => {
      const monthsPast = calculateMonthsPastCorrect(offer.poExpectedMonth);
      
      if (monthsPast === 'No date') {
        dateRanges['No Date'] = (dateRanges['No Date'] || 0) + 1;
      } else if (monthsPast < 0) {
        dateRanges['Future'] = (dateRanges['Future'] || 0) + 1;
      } else if (monthsPast <= 3) {
        dateRanges['0-3 months past'] = (dateRanges['0-3 months past'] || 0) + 1;
      } else if (monthsPast <= 6) {
        dateRanges['4-6 months past'] = (dateRanges['4-6 months past'] || 0) + 1;
      } else if (monthsPast <= 9) {
        dateRanges['7-9 months past'] = (dateRanges['7-9 months past'] || 0) + 1;
      } else {
        dateRanges['10+ months past'] = (dateRanges['10+ months past'] || 0) + 1;
      }
    });
    
    Object.entries(dateRanges).forEach(([range, count]) => {
      console.log(`${range}: ${count} offers`);
    });
    
    // Find offers that are clearly lost (expected date > 6 months ago)
    const clearlyLostOffers = activeOffers.filter(offer => {
      const monthsPast = calculateMonthsPastCorrect(offer.poExpectedMonth);
      return typeof monthsPast === 'number' && monthsPast > 6;
    });
    
    console.log(`\n=== CLEARLY LOST OFFERS (>6 months past expected date) ===`);
    console.log(`Found ${clearlyLostOffers.length} clearly lost offers`);
    
    if (clearlyLostOffers.length > 0) {
      // Group by months past
      const lostByMonthsPast = {};
      clearlyLostOffers.forEach(offer => {
        const monthsPast = calculateMonthsPastCorrect(offer.poExpectedMonth);
        if (!lostByMonthsPast[monthsPast]) {
          lostByMonthsPast[monthsPast] = [];
        }
        lostByMonthsPast[monthsPast].push(offer);
      });
      
      Object.entries(lostByMonthsPast).sort(([a], [b]) => b - a).forEach(([monthsPast, offers]) => {
        console.log(`\n${monthsPast} months past expected date: ${offers.length} offers`);
        const totalValue = offers.reduce((sum, offer) => sum + (offer.offerValue || 0), 0);
        console.log(`Total value: ₹${totalValue.toLocaleString('en-IN')}`);
        
        offers.slice(0, 3).forEach(offer => {
          console.log(`  ${offer.offerReferenceNumber} - ${offer.customer?.companyName} - ${offer.probabilityPercentage}% - ₹${offer.offerValue?.toLocaleString('en-IN')}`);
        });
        
        if (offers.length > 3) {
          console.log(`  ... and ${offers.length - 3} more`);
        }
      });
      
      const totalLostValue = clearlyLostOffers.reduce((sum, offer) => sum + (offer.offerValue || 0), 0);
      console.log(`\n=== SUMMARY ===`);
      console.log(`Total clearly lost offers: ${clearlyLostOffers.length}`);
      console.log(`Total lost value: ₹${totalLostValue.toLocaleString('en-IN')}`);
      console.log(`Percentage of active offers: ${((clearlyLostOffers.length / activeOffers.length) * 100).toFixed(1)}%`);
      
      console.log('\n=== RECOMMENDATION ===');
      console.log('These offers should be marked as LOST because:');
      console.log('1. Their expected PO date was more than 6 months ago');
      console.log('2. They are still not marked as WON');
      console.log('3. It\'s unrealistic to expect these deals to close now');
      
      console.log('\nWould you like to mark these offers as LOST?');
      console.log('This will update their stage from current stage to LOST');
      
    } else {
      console.log('No offers meet the >6 months past expected date criteria');
      console.log('Consider using a different threshold or criteria');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLostAnalysis();
