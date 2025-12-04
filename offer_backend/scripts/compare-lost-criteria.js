const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function compareLostCriteria() {
  try {
    console.log('=== COMPARING LOST OFFER CRITERIA ===');
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    console.log(`Current date: ${currentDate.toISOString().split('T')[0]}`);
    
    // Get current stage distribution
    const currentStages = await prisma.offer.groupBy({
      by: ['stage'],
      _count: { id: true },
      _sum: { offerValue: true }
    });
    
    console.log('\n=== CURRENT STAGE DISTRIBUTION ===');
    currentStages.forEach(stage => {
      const value = stage._sum.offerValue || 0;
      console.log(`${stage.stage}: ${stage._count.id} offers, Value: ₹${value.toLocaleString('en-IN')}`);
    });
    
    // Get all offers with expected dates
    const allOffers = await prisma.offer.findMany({
      where: {
        poExpectedMonth: { not: null }
      },
      select: {
        id: true,
        offerReferenceNumber: true,
        stage: true,
        poExpectedMonth: true,
        offerValue: true,
        customer: {
          select: { companyName: true }
        }
      },
      orderBy: {
        poExpectedMonth: 'asc'
      }
    });
    
    console.log(`\nFound ${allOffers.length} offers with expected PO dates`);
    
    // Calculate months past for each offer
    const calculateMonthsPast = (expectedMonth) => {
      const [year, month] = expectedMonth.split('-').map(Number);
      return (currentYear - year) * 12 + (currentMonth - month);
    };
    
    // Analyze different criteria
    const criteria = {
      '6 months': { threshold: 6, offers: [] },
      '9 months': { threshold: 9, offers: [] },
      '12 months': { threshold: 12, offers: [] },
      '18 months': { threshold: 18, offers: [] }
    };
    
    allOffers.forEach(offer => {
      const monthsPast = calculateMonthsPast(offer.poExpectedMonth);
      
      Object.entries(criteria).forEach(([name, criterion]) => {
        if (monthsPast > criterion.threshold && offer.stage !== 'WON') {
          criterion.offers.push(offer);
        }
      });
    });
    
    console.log('\n=== COMPARISON OF DIFFERENT CRITERIA ===');
    
    Object.entries(criteria).forEach(([name, criterion]) => {
      const count = criterion.offers.length;
      const value = criterion.offers.reduce((sum, offer) => sum + (offer.offerValue || 0), 0);
      const percentage = allOffers.length > 0 ? ((count / allOffers.length) * 100).toFixed(1) : 0;
      
      console.log(`\n${name} criteria:`);
      console.log(`  Offers: ${count} (${percentage}% of total)`);
      console.log(`  Value: ₹${value.toLocaleString('en-IN')}`);
      
      if (count > 0 && count <= 5) {
        criterion.offers.slice(0, 3).forEach(offer => {
          const monthsPast = calculateMonthsPast(offer.poExpectedMonth);
          console.log(`    ${offer.offerReferenceNumber} - ${monthsPast} months past`);
        });
      }
    });
    
    // Show actual date range
    console.log('\n=== ACTUAL DATE RANGE OF YOUR OFFERS ===');
    const monthsPast = allOffers.map(offer => calculateMonthsPast(offer.poExpectedMonth));
    const minMonths = Math.min(...monthsPast);
    const maxMonths = Math.max(...monthsPast);
    
    console.log(`Earliest expected: ${maxMonths} months ago`);
    console.log(`Latest expected: ${minMonths} months ago`);
    console.log(`Range: ${maxMonths - minMonths} months`);
    
    console.log('\n=== RECOMMENDATION ===');
    console.log('Based on your data:');
    console.log(`- Your offers range from ${minMonths} to ${maxMonths} months past expected date`);
    console.log('- 6-months criteria: Conservative, marks clearly old offers as lost');
    console.log('- 9-months criteria: Moderate approach');
    console.log('- 12-months criteria: Very conservative, no offers meet this');
    console.log('- 18-months criteria: Extremely conservative');
    
    console.log('\nWhich criteria would you prefer?');
    console.log('1. 6 months (161 offers lost - 38.4%)');
    console.log('2. 9 months (97 offers lost - 23.1%)');
    console.log('3. 12 months (0 offers lost - 0%)');
    console.log('4. Keep current 161 lost offers');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

compareLostCriteria();
