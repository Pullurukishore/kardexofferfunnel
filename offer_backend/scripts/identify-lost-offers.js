const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function identifyLostOffers() {
  try {
    console.log('=== IDENTIFYING LOST OFFERS ===');
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    console.log(`Current date: ${currentDate.toISOString().split('T')[0]}`);
    
    // Get all offers that are not WON
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
      }
    });
    
    console.log(`\nFound ${activeOffers.length} active (non-WON) offers to analyze`);
    
    const lostCandidates = [];
    const analysisResults = {
      veryLowProbability: [],
      veryOldOffers: [],
      pastExpectedDate: [],
      noProgress: []
    };
    
    activeOffers.forEach(offer => {
      const daysSinceCreation = Math.floor((currentDate - new Date(offer.createdAt)) / (1000 * 60 * 60 * 24));
      const daysSinceUpdate = Math.floor((currentDate - new Date(offer.updatedAt)) / (1000 * 60 * 60 * 24));
      
      // Criteria 1: Very low probability (< 10%)
      if (offer.probabilityPercentage < 10) {
        analysisResults.veryLowProbability.push({
          ...offer,
          daysSinceCreation,
          reason: 'Very low probability (< 10%)'
        });
      }
      
      // Criteria 2: Very old offers (> 90 days) with no WON status
      if (daysSinceCreation > 90) {
        analysisResults.veryOldOffers.push({
          ...offer,
          daysSinceCreation,
          reason: `Very old (${daysSinceCreation} days) with no progress`
        });
      }
      
      // Criteria 3: Past expected PO month
      if (offer.poExpectedMonth) {
        const [year, month] = offer.poExpectedMonth.split('-').map(Number);
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          const monthsPast = (currentYear - year) * 12 + (currentMonth - month);
          analysisResults.pastExpectedDate.push({
            ...offer,
            monthsPast,
            reason: `Expected PO was ${monthsPast} months ago`
          });
        }
      }
      
      // Criteria 4: No progress in last 30 days with low probability
      if (daysSinceUpdate > 30 && offer.probabilityPercentage < 30) {
        analysisResults.noProgress.push({
          ...offer,
          daysSinceUpdate,
          reason: `No update for ${daysSinceUpdate} days with low probability`
        });
      }
    });
    
    console.log('\n=== LOST OFFER ANALYSIS RESULTS ===');
    
    Object.entries(analysisResults).forEach(([criteria, offers]) => {
      console.log(`\n${criteria.toUpperCase().replace(/_/g, ' ')}: ${offers.length} offers`);
      
      if (offers.length > 0) {
        console.log('Sample offers:');
        offers.slice(0, 5).forEach(offer => {
          console.log(`  ${offer.offerReferenceNumber} - ${offer.customer?.companyName} - ${offer.probabilityPercentage}% - ${offer.reason}`);
        });
        
        if (offers.length > 5) {
          console.log(`  ... and ${offers.length - 5} more`);
        }
      }
    });
    
    // Combine all lost candidates
    const allLostCandidates = [
      ...analysisResults.veryLowProbability,
      ...analysisResults.veryOldOffers,
      ...analysisResults.pastExpectedDate,
      ...analysisResults.noProgress
    ];
    
    // Remove duplicates (same offer might appear in multiple categories)
    const uniqueLostCandidates = allLostCandidates.filter((offer, index, self) => 
      index === self.findIndex(o => o.id === offer.id)
    );
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total unique lost candidates: ${uniqueLostCandidates.length}`);
    console.log(`Total active offers: ${activeOffers.length}`);
    console.log(`Lost percentage: ${((uniqueLostCandidates.length / activeOffers.length) * 100).toFixed(1)}%`);
    
    if (uniqueLostCandidates.length > 0) {
      console.log('\n=== RECOMMENDED ACTION ===');
      console.log('Would you like to:');
      console.log('1. Mark these offers as LOST in the database?');
      console.log('2. Review them manually before marking?');
      console.log('3. Use different criteria for identifying lost offers?');
      
      // Calculate potential lost value
      const totalLostValue = uniqueLostCandidates.reduce((sum, offer) => sum + (offer.offerValue || 0), 0);
      console.log(`\nPotential lost value: ₹${totalLostValue.toLocaleString('en-IN')}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

identifyLostOffers();
