const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recalculateLost12Months() {
  try {
    console.log('=== RECALCULATING LOST OFFERS (12 MONTHS CRITERIA) ===');
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    console.log(`Current date: ${currentDate.toISOString().split('T')[0]}`);
    console.log('Using criteria: Expected PO date > 12 months ago');
    
    // Calculate months past function
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
    
    // Get all non-WON offers
    const activeOffers = await prisma.offer.findMany({
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
    
    console.log(`\nFound ${activeOffers.length} active offers to analyze`);
    
    // Analyze by months past
    const dateRanges = {};
    const lostOffers12Months = [];
    const notLostOffers = [];
    
    activeOffers.forEach(offer => {
      const monthsPast = calculateMonthsPast(offer.poExpectedMonth);
      
      if (monthsPast === null) return;
      
      // Categorize by date range
      if (monthsPast < 0) {
        dateRanges['Future'] = (dateRanges['Future'] || 0) + 1;
        notLostOffers.push(offer);
      } else if (monthsPast <= 6) {
        dateRanges['0-6 months past'] = (dateRanges['0-6 months past'] || 0) + 1;
        notLostOffers.push(offer);
      } else if (monthsPast <= 12) {
        dateRanges['7-12 months past'] = (dateRanges['7-12 months past'] || 0) + 1;
        notLostOffers.push(offer);
      } else {
        dateRanges['13+ months past'] = (dateRanges['13+ months past'] || 0) + 1;
        lostOffers12Months.push(offer);
      }
    });
    
    console.log('\n=== DATE RANGE ANALYSIS ===');
    Object.entries(dateRanges).forEach(([range, count]) => {
      console.log(`${range}: ${count} offers`);
    });
    
    console.log(`\n=== LOST OFFERS (>12 months past expected date) ===`);
    console.log(`Found ${lostOffers12Months.length} offers to mark as LOST`);
    
    if (lostOffers12Months.length > 0) {
      // Group by months past
      const byMonthsPast = {};
      lostOffers12Months.forEach(offer => {
        const monthsPast = calculateMonthsPast(offer.poExpectedMonth);
        if (!byMonthsPast[monthsPast]) {
          byMonthsPast[monthsPast] = [];
        }
        byMonthsPast[monthsPast].push(offer);
      });
      
      Object.entries(byMonthsPast).sort(([a], [b]) => b - a).forEach(([monthsPast, offers]) => {
        console.log(`\n${monthsPast} months past: ${offers.length} offers`);
        const totalValue = offers.reduce((sum, offer) => sum + (offer.offerValue || 0), 0);
        console.log(`Total value: ₹${totalValue.toLocaleString('en-IN')}`);
        
        offers.slice(0, 3).forEach(offer => {
          console.log(`  ${offer.offerReferenceNumber} - ${offer.customer?.companyName} - ${offer.stage} → LOST`);
        });
        
        if (offers.length > 3) {
          console.log(`  ... and ${offers.length - 3} more`);
        }
      });
      
      const totalLostValue = lostOffers12Months.reduce((sum, offer) => sum + (offer.offerValue || 0), 0);
      
      console.log(`\n=== 12-MONTH CRITERIA SUMMARY ===`);
      console.log(`Lost offers (>12 months): ${lostOffers12Months.length}`);
      console.log(`Active offers (≤12 months): ${notLostOffers.length}`);
      console.log(`Lost value: ₹${totalLostValue.toLocaleString('en-IN')}`);
      console.log(`Lost percentage: ${((lostOffers12Months.length / activeOffers.length) * 100).toFixed(1)}%`);
      
      // Compare with 6-month criteria
      console.log('\n=== COMPARISON: 6-MONTHS vs 12-MONTHS ===');
      console.log('6-months criteria: 161 offers lost (38.4%)');
      console.log(`12-months criteria: ${lostOffers12Months.length} offers lost (${((lostOffers12Months.length / activeOffers.length) * 100).toFixed(1)}%)`);
      console.log(`Difference: ${161 - lostOffers12Months.length} fewer offers marked as lost`);
      
      console.log('\n=== RECOMMENDATION ===');
      if (lostOffers12Months.length === 0) {
        console.log('No offers meet the >12 months criteria.');
        console.log('All offers are within 12 months of expected PO date.');
        console.log('Consider using 6-months criteria or review offers manually.');
      } else {
        console.log('The 12-month criteria is more conservative.');
        console.log('It only marks offers that are clearly very old as lost.');
        console.log('Would you like to proceed with marking these as LOST?');
      }
      
    } else {
      console.log('No offers meet the >12 months criteria.');
      console.log('All offers are within 12 months of expected PO date.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recalculateLost12Months();
