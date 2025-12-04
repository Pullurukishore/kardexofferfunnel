const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyFinalStages() {
  try {
    console.log('=== FINAL OFFER STAGE DISTRIBUTION ===');
    
    // Get final stage distribution
    const stageDistribution = await prisma.offer.groupBy({
      by: ['stage'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });
    
    console.log('\nCurrent stage distribution:');
    stageDistribution.forEach(stage => {
      const percentage = ((stage._count.id / 419) * 100).toFixed(1);
      console.log(`${stage.stage}: ${stage._count.id} offers (${percentage}%)`);
    });
    
    // Get value by stage
    const valueByStage = await prisma.offer.groupBy({
      by: ['stage'],
      _sum: {
        offerValue: true
      },
      orderBy: {
        _sum: {
          offerValue: 'desc'
        }
      }
    });
    
    console.log('\nValue by stage:');
    valueByStage.forEach(stage => {
      const value = stage._sum.offerValue || 0;
      console.log(`${stage.stage}: ₹${value.toLocaleString('en-IN')}`);
    });
    
    // Show sample offers from each stage
    console.log('\n=== SAMPLE OFFERS BY STAGE ===');
    
    for (const stageInfo of stageDistribution) {
      const sampleOffers = await prisma.offer.findMany({
        where: { stage: stageInfo.stage },
        select: {
          offerReferenceNumber: true,
          stage: true,
          probabilityPercentage: true,
          offerValue: true,
          poExpectedMonth: true,
          customer: {
            select: {
              companyName: true
            }
          }
        },
        take: 3,
        orderBy: {
          offerValue: 'desc'
        }
      });
      
      console.log(`\n${stageInfo.stage} (${stageInfo._count.id} offers):`);
      sampleOffers.forEach(offer => {
        console.log(`  ${offer.offerReferenceNumber} - ${offer.customer?.companyName} - ${offer.probabilityPercentage}% - ₹${offer.offerValue?.toLocaleString('en-IN')} - Expected: ${offer.poExpectedMonth || 'Not set'}`);
      });
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    const totalOffers = stageDistribution.reduce((sum, stage) => sum + stage._count.id, 0);
    const wonOffers = stageDistribution.find(s => s.stage === 'WON')?._count.id || 0;
    const lostOffers = stageDistribution.find(s => s.stage === 'LOST')?._count.id || 0;
    const activeOffers = stageDistribution.filter(s => !['WON', 'LOST'].includes(s.stage)).reduce((sum, stage) => sum + stage._count.id, 0);
    
    const totalValue = valueByStage.reduce((sum, stage) => sum + (stage._sum.offerValue || 0), 0);
    const wonValue = valueByStage.find(s => s.stage === 'WON')?._sum.offerValue || 0;
    const lostValue = valueByStage.find(s => s.stage === 'LOST')?._sum.offerValue || 0;
    
    console.log(`Total offers: ${totalOffers}`);
    console.log(`Won offers: ${wonOffers} (${((wonOffers/totalOffers)*100).toFixed(1)}%)`);
    console.log(`Lost offers: ${lostOffers} (${((lostOffers/totalOffers)*100).toFixed(1)}%)`);
    console.log(`Active offers: ${activeOffers} (${((activeOffers/totalOffers)*100).toFixed(1)}%)`);
    
    console.log(`\nTotal value: ₹${totalValue.toLocaleString('en-IN')}`);
    console.log(`Won value: ₹${wonValue.toLocaleString('en-IN')} (${((wonValue/totalValue)*100).toFixed(1)}%)`);
    console.log(`Lost value: ₹${lostValue.toLocaleString('en-IN')} (${((lostValue/totalValue)*100).toFixed(1)}%)`);
    
    // Win rate calculation
    const winRate = totalOffers > 0 ? ((wonOffers / (wonOffers + lostOffers)) * 100).toFixed(1) : 0;
    console.log(`\nWin rate (Won vs Lost): ${winRate}%`);
    
    console.log('\n✅ Stage verification completed!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyFinalStages();
