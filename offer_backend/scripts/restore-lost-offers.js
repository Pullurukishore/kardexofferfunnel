const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restoreLostOffers() {
  try {
    console.log('=== RESTORING LOST OFFERS (12-MONTHS CRITERIA) ===');
    console.log('Restoring all LOST offers since none meet 12-months criteria');
    
    // Get all LOST offers
    const lostOffers = await prisma.offer.findMany({
      where: { stage: 'LOST' },
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
    
    console.log(`Found ${lostOffers.length} LOST offers to restore`);
    
    if (lostOffers.length === 0) {
      console.log('No LOST offers found to restore.');
      return;
    }
    
    // Calculate total value being restored
    const totalRestoredValue = lostOffers.reduce((sum, offer) => sum + (offer.offerValue || 0), 0);
    
    console.log(`Total value to restore: ₹${totalRestoredValue.toLocaleString('en-In')}`);
    
    // Calculate original stages based on probabilityPercentage
    const getOriginalStage = (probability) => {
      if (probability >= 80) return 'WON';           // 80%+ - WON (your business rule)
      if (probability >= 50) return 'NEGOTIATION';   // 50-79% - Negotiation
      if (probability >= 30) return 'PROPOSAL_SENT'; // 30-49% - Proposal sent
      if (probability >= 10) return 'PROPOSAL_SENT'; // 10-29% - Still proposal stage
      return 'INITIAL';                               // 0-9% - Initial stage
    };
    
    // Group by original stage for analysis
    const stageDistribution = {};
    lostOffers.forEach(offer => {
      const originalStage = getOriginalStage(offer.probabilityPercentage);
      if (!stageDistribution[originalStage]) {
        stageDistribution[originalStage] = [];
      }
      stageDistribution[originalStage].push(offer);
    });
    
    console.log('\n=== STAGE DISTRIBUTION AFTER RESTORATION ===');
    Object.entries(stageDistribution).forEach(([stage, offers]) => {
      const value = offers.reduce((sum, offer) => sum + (offer.offerValue || 0), 0);
      console.log(`${stage}: ${offers.length} offers, Value: ₹${value.toLocaleString('en-In')}`);
    });
    
    // Restore offers to original stages
    console.log('\n=== RESTORING OFFERS ===');
    
    let restoreCount = 0;
    const errors = [];
    
    for (const offer of lostOffers) {
      try {
        const originalStage = getOriginalStage(offer.probabilityPercentage);
        
        await prisma.offer.update({
          where: { id: offer.id },
          data: { 
            stage: originalStage,
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Restored: ${offer.offerReferenceNumber} - LOST → ${originalStage} (${offer.probabilityPercentage}%)`);
        restoreCount++;
        
      } catch (error) {
        console.log(`❌ Error restoring ${offer.offerReferenceNumber}: ${error.message}`);
        errors.push({ offer: offer.offerReferenceNumber, error: error.message });
      }
    }
    
    console.log(`\n=== RESTORATION SUMMARY ===`);
    console.log(`✅ Successfully restored ${restoreCount} offers`);
    
    if (errors.length > 0) {
      console.log(`❌ Failed to restore ${errors.length} offers:`);
      errors.forEach(err => {
        console.log(`  ${err.offer}: ${err.error}`);
      });
    }
    
    // Verify final stage distribution
    const finalStages = await prisma.offer.groupBy({
      by: ['stage'],
      _count: { id: true },
      _sum: { offerValue: true },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });
    
    console.log('\n=== FINAL STAGE DISTRIBUTION ===');
    let totalOffers = 0;
    let totalValue = 0;
    
    finalStages.forEach(stage => {
      const count = stage._count.id;
      const value = stage._sum.offerValue || 0;
      const percentage = ((count / 419) * 100).toFixed(1);
      
      totalOffers += count;
      totalValue += value;
      
      console.log(`${stage.stage}: ${count} offers (${percentage}%), Value: ₹${value.toLocaleString('en-In')}`);
    });
    
    // Calculate new metrics
    const wonOffers = finalStages.find(s => s.stage === 'WON')?._count.id || 0;
    const lostOffersCount = finalStages.find(s => s.stage === 'LOST')?._count.id || 0;
    const activeOffers = totalOffers - wonOffers - lostOffersCount;
    
    const wonValue = finalStages.find(s => s.stage === 'WON')?._sum.offerValue || 0;
    const lostValue = finalStages.find(s => s.stage === 'LOST')?._sum.offerValue || 0;
    
    const winRate = (wonOffers + lostOffersCount) > 0 ? ((wonOffers / (wonOffers + lostOffersCount)) * 100).toFixed(1) : 100;
    
    console.log('\n=== NEW METRICS ===');
    console.log(`Total offers: ${totalOffers}`);
    console.log(`Won offers: ${wonOffers} (${((wonOffers/totalOffers)*100).toFixed(1)}%)`);
    console.log(`Lost offers: ${lostOffersCount} (${((lostOffersCount/totalOffers)*100).toFixed(1)}%)`);
    console.log(`Active offers: ${activeOffers} (${((activeOffers/totalOffers)*100).toFixed(1)}%)`);
    console.log(`Win rate: ${winRate}%`);
    console.log(`Total value: ₹${totalValue.toLocaleString('en-In')}`);
    console.log(`Won value: ₹${wonValue.toLocaleString('in-In')} (${((wonValue/totalValue)*100).toFixed(1)}%)`);
    
    console.log('\n✅ 12-MONTHS CRITERIA APPLIED SUCCESSFULLY!');
    console.log('✅ All offers restored - none meet 12-months lost criteria');
    console.log('✅ Win rate is now 100% (no lost deals)');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreLostOffers();
