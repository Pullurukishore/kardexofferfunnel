const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeRealisticLost() {
  try {
    console.log('=== REALISTIC LOST OFFER ANALYSIS ===');
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    console.log(`Current date: ${currentDate.toISOString().split('T')[0]}`);
    
    // Get all non-WON offers
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
            name: true,
            email: true
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
    
    // Analyze by expected PO month
    const monthlyAnalysis = {};
    activeOffers.forEach(offer => {
      const month = offer.poExpectedMonth || 'No Date';
      if (!monthlyAnalysis[month]) {
        monthlyAnalysis[month] = {
          count: 0,
          totalValue: 0,
          offers: []
        };
      }
      monthlyAnalysis[month].count++;
      monthlyAnalysis[month].totalValue += offer.offerValue || 0;
      monthlyAnalysis[month].offers.push(offer);
    });
    
    console.log('\n=== OFFERS BY EXPECTED PO MONTH ===');
    Object.entries(monthlyAnalysis).sort(([a], [b]) => {
      if (a === 'No Date') return 1;
      if (b === 'No Date') return -1;
      return a.localeCompare(b);
    }).forEach(([month, data]) => {
      const monthsPast = calculateMonthsPast(month);
      console.log(`\n${month}: ${data.count} offers, Value: ₹${data.totalValue.toLocaleString('en-IN')} (${monthsPast})`);
      
      // Show sample offers
      data.offers.slice(0, 2).forEach(offer => {
        console.log(`  ${offer.offerReferenceNumber} - ${offer.customer?.companyName} - ${offer.probabilityPercentage}%`);
      });
    });
    
    // Different lost criteria scenarios
    console.log('\n=== LOST SCENARIOS ===');
    
    const scenarios = {
      'Scenario 1 - Very Old (>6 months)': {
        condition: (offer) => {
          const daysOld = Math.floor((currentDate - new Date(offer.createdAt)) / (1000 * 60 * 60 * 24));
          return daysOld > 180;
        },
        description: 'Offers created more than 6 months ago'
      },
      'Scenario 2 - Expected Date Past (>3 months)': {
        condition: (offer) => {
          if (!offer.poExpectedMonth) return false;
          const monthsPast = calculateMonthsPast(offer.poExpectedMonth);
          return monthsPast > 3;
        },
        description: 'Expected PO date passed by more than 3 months'
      },
      'Scenario 3 - Low Probability & Old': {
        condition: (offer) => {
          const daysOld = Math.floor((currentDate - new Date(offer.createdAt)) / (1000 * 60 * 60 * 24));
          return daysOld > 90 && offer.probabilityPercentage < 30;
        },
        description: 'More than 3 months old with <30% probability'
      },
      'Scenario 4 - Very Old Expected Date': {
        condition: (offer) => {
          if (!offer.poExpectedMonth) return false;
          const monthsPast = calculateMonthsPast(offer.poExpectedMonth);
          return monthsPast > 6;
        },
        description: 'Expected PO date passed by more than 6 months'
      }
    };
    
    Object.entries(scenarios).forEach(([scenarioName, scenario]) => {
      const matchingOffers = activeOffers.filter(scenario.condition);
      const totalValue = matchingOffers.reduce((sum, offer) => sum + (offer.offerValue || 0), 0);
      
      console.log(`\n${scenarioName}:`);
      console.log(`  ${matchingOffers.length} offers (${((matchingOffers.length/activeOffers.length)*100).toFixed(1)}%)`);
      console.log(`  Total value: ₹${totalValue.toLocaleString('en-IN')}`);
      console.log(`  ${scenario.description}`);
      
      if (matchingOffers.length > 0 && matchingOffers.length <= 5) {
        matchingOffers.forEach(offer => {
          const monthsPast = calculateMonthsPast(offer.poExpectedMonth);
          console.log(`    ${offer.offerReferenceNumber} - ${offer.probabilityPercentage}% - Expected ${monthsPast} months ago`);
        });
      } else if (matchingOffers.length > 5) {
        console.log(`    (Top 5 of ${matchingOffers.length})`);
        matchingOffers.slice(0, 5).forEach(offer => {
          const monthsPast = calculateMonthsPast(offer.poExpectedMonth);
          console.log(`    ${offer.offerReferenceNumber} - ${offer.probabilityPercentage}% - Expected ${monthsPast} months ago`);
        });
      }
    });
    
    // Recommendation
    console.log('\n=== RECOMMENDATION ===');
    console.log('Based on your data, I recommend using:');
    console.log('**Scenario 4 - Very Old Expected Date**');
    console.log('Reason: These offers had expected PO dates 6+ months ago and are still not won');
    console.log('This is the most realistic indicator of lost deals in your dataset');
    
    const recommendedOffers = activeOffers.filter(scenarios['Scenario 4 - Very Old Expected Date'].condition);
    console.log(`\nThis would mark ${recommendedOffers.length} offers as LOST`);
    console.log(`Total value: ₹${recommendedOffers.reduce((sum, offer) => sum + (offer.offerValue || 0), 0).toLocaleString('en-IN')}`);
    
    console.log('\nWould you like to proceed with marking these as LOST?');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function calculateMonthsPast(expectedMonth) {
  if (!expectedMonth) return 'No date';
  
  const [year, month] = expectedMonth.split('-').map(Number);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const monthsPast = (currentYear - year) * 12 + (currentMonth - month);
  return `${monthsPast} months`;
}

analyzeRealisticLost();
