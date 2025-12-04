const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function updateOfferStages() {
  try {
    console.log('=== UPDATING OFFER STAGES BASED ON PO RECEIVED ===');
    
    // Load processed offers data to get poReceived values
    const processedOffersPath = path.join(__dirname, '..', 'data', 'processed', 'all-offers.json');
    
    if (!fs.existsSync(processedOffersPath)) {
      console.log('❌ Processed offers file not found');
      return;
    }
    
    const processedOffers = JSON.parse(fs.readFileSync(processedOffersPath, 'utf8'));
    console.log(`Loaded ${processedOffers.length} processed offers`);
    
    // Create mapping from offer reference number to poReceived value
    const poReceivedMap = new Map();
    processedOffers.forEach(offer => {
      if (offer.offerReferenceNumber && offer.poReceived !== undefined) {
        poReceivedMap.set(offer.offerReferenceNumber, parseFloat(offer.poReceived));
      }
    });
    
    console.log(`Created mapping for ${poReceivedMap.size} offers`);
    
    // Get all offers from database
    const dbOffers = await prisma.offer.findMany({
      select: {
        id: true,
        offerReferenceNumber: true,
        stage: true,
        probabilityPercentage: true,
        offerValue: true,
        poValue: true
      }
    });
    
    console.log(`Found ${dbOffers.length} offers in database`);
    
    // Stage mapping based on poReceived percentage
    const getStageFromPoReceived = (poReceived) => {
      if (poReceived >= 1.0) return 'ORDER_BOOKED';  // 100% - Order booked
      if (poReceived >= 0.8) return 'PO_RECEIVED';   // 80-99% - PO received
      if (poReceived >= 0.5) return 'NEGOTIATION';   // 50-79% - Negotiation
      if (poReceived >= 0.3) return 'PROPOSAL_SENT'; // 30-49% - Proposal sent
      if (poReceived >= 0.1) return 'PROPOSAL_SENT'; // 10-29% - Still proposal stage
      return 'INITIAL';                               // 0-9% - Initial stage
    };
    
    let updateCount = 0;
    const stageDistribution = {};
    
    // Update offers with correct stages
    for (const offer of dbOffers) {
      const poReceived = poReceivedMap.get(offer.offerReferenceNumber);
      
      if (poReceived !== undefined) {
        const newStage = getStageFromPoReceived(poReceived);
        
        if (offer.stage !== newStage) {
          await prisma.offer.update({
            where: { id: offer.id },
            data: { 
              stage: newStage,
              // Also update probabilityPercentage to match poReceived if it's different
              ...(offer.probabilityPercentage !== Math.round(poReceived * 100) && { 
                probabilityPercentage: Math.round(poReceived * 100) 
              })
            }
          });
          
          console.log(`Updated: ${offer.offerReferenceNumber} - ${offer.stage} → ${newStage} (PO: ${poReceived})`);
          updateCount++;
        }
        
        // Count stage distribution
        stageDistribution[newStage] = (stageDistribution[newStage] || 0) + 1;
      } else {
        console.log(`No PO data for: ${offer.offerReferenceNumber}`);
        stageDistribution[offer.stage] = (stageDistribution[offer.stage] || 0) + 1;
      }
    }
    
    console.log(`\n✅ Updated ${updateCount} offers`);
    
    console.log('\n=== STAGE DISTRIBUTION ===');
    Object.entries(stageDistribution).forEach(([stage, count]) => {
      console.log(`${stage}: ${count} offers`);
    });
    
    // Show sample of offers in each stage
    console.log('\n=== SAMPLE OFFERS BY STAGE ===');
    const stageSamples = {};
    
    for (const offer of dbOffers) {
      const poReceived = poReceivedMap.get(offer.offerReferenceNumber);
      const stage = poReceived !== undefined ? getStageFromPoReceived(poReceived) : offer.stage;
      
      if (!stageSamples[stage]) {
        stageSamples[stage] = [];
      }
      
      if (stageSamples[stage].length < 3) {
        stageSamples[stage].push({
          reference: offer.offerReferenceNumber,
          poReceived: poReceived,
          value: offer.offerValue
        });
      }
    }
    
    Object.entries(stageSamples).forEach(([stage, samples]) => {
      console.log(`\n${stage}:`);
      samples.forEach(sample => {
        console.log(`  ${sample.reference} - PO: ${sample.poReceived} - Value: ₹${sample.value?.toLocaleString('en-IN')}`);
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateOfferStages();
