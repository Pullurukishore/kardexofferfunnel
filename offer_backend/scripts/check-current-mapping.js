const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurrentMapping() {
  try {
    console.log('=== CURRENT STAGE MAPPING ANALYSIS ===');
    
    // Check current stage distribution
    const currentStages = await prisma.offer.groupBy({
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
    
    console.log('\nCurrent stage distribution in database:');
    currentStages.forEach(stage => {
      console.log(`${stage.stage}: ${stage._count.id} offers`);
    });
    
    // Check offers with poReceived = 1 (100%)
    const offersWithFullProbability = await prisma.offer.findMany({
      where: {
        probabilityPercentage: 100
      },
      select: {
        id: true,
        offerReferenceNumber: true,
        stage: true,
        probabilityPercentage: true,
        offerValue: true,
        poValue: true,
        poNumber: true,
        poDate: true
      },
      take: 10
    });
    
    console.log('\n=== OFFERS WITH 100% PROBABILITY ===');
    console.log(`Found ${offersWithFullProbability.length} sample offers with 100% probability:`);
    offersWithFullProbability.forEach(offer => {
      console.log(`${offer.offerReferenceNumber} - Stage: ${offer.stage} - PO: ${offer.poNumber || 'None'} - Date: ${offer.poDate || 'None'} - Value: ₹${offer.offerValue?.toLocaleString('en-IN')}`);
    });
    
    // Check offers with PO information
    const offersWithPO = await prisma.offer.findMany({
      where: {
        poNumber: {
          not: null
        }
      },
      select: {
        id: true,
        offerReferenceNumber: true,
        stage: true,
        poNumber: true,
        poDate: true,
        poValue: true
      },
      take: 10
    });
    
    console.log('\n=== OFFERS WITH PO INFORMATION ===');
    console.log(`Found ${offersWithPO.length} sample offers with PO numbers:`);
    offersWithPO.forEach(offer => {
      console.log(`${offer.offerReferenceNumber} - Stage: ${offer.stage} - PO: ${offer.poNumber} - Date: ${offer.poDate} - Value: ₹${offer.poValue?.toLocaleString('en-IN') || 'N/A'}`);
    });
    
    // Count total offers with PO
    const totalWithPO = await prisma.offer.count({
      where: {
        poNumber: {
          not: null
        }
      }
    });
    
    console.log(`\nTotal offers with PO numbers: ${totalWithPO}`);
    
    console.log('\n=== RECOMMENDATION ===');
    console.log('Based on your requirement for WON stage, you have several options:');
    console.log('1. Add WON to OfferStage enum and map offers with PO numbers to WON');
    console.log('2. Map offers with 100% probability to WON stage');
    console.log('3. Keep ORDER_BOOKED as the final stage (current approach)');
    console.log('4. Use both WON and ORDER_BOOKED (WON for deals won, ORDER_BOOKED for orders booked)');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentMapping();
