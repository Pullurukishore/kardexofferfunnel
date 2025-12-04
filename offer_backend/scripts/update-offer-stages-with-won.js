const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function updateOfferStagesWithWon() {
  try {
    console.log('=== UPDATING OFFER STAGES WITH WON STAGE ===');
    
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
        poValue: true,
        poNumber: true,
        poDate: true
      }
    });
    
    console.log(`Found ${dbOffers.length} offers in database`);
    
    // Updated stage mapping with WON stage - PO received means WON
    const getStageFromPoReceived = (poReceived) => {
      if (poReceived >= 0.8) return 'WON';            // 80%+ - PO received = WON
      if (poReceived >= 0.5) return 'NEGOTIATION';    // 50-79% - Negotiation
      if (poReceived >= 0.3) return 'PROPOSAL_SENT'; // 30-49% - Proposal sent
      if (poReceived >= 0.1) return 'PROPOSAL_SENT'; // 10-29% - Still proposal stage
      return 'INITIAL';                               // 0-9% - Initial stage
    };
    
    let updateCount = 0;
    const stageDistribution = {};
    const conversionDetails = [];
    
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
          
          // Track conversions to WON
          if (newStage === 'WON') {
            conversionDetails.push({
              reference: offer.offerReferenceNumber,
              value: offer.offerValue,
              previousStage: offer.stage
            });
          }
          
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
    
    console.log('\n=== NEW STAGE DISTRIBUTION ===');
    Object.entries(stageDistribution).forEach(([stage, count]) => {
      console.log(`${stage}: ${count} offers`);
    });
    
    // Show WON conversions
    if (conversionDetails.length > 0) {
      console.log('\n=== OFFERS CONVERTED TO WON STAGE ===');
      console.log(`Total ${conversionDetails.length} offers converted to WON:`);
      conversionDetails.slice(0, 10).forEach(conv => {
        console.log(`  ${conv.reference} - Value: ₹${conv.value?.toLocaleString('en-IN')} - Was: ${conv.previousStage}`);
      });
      if (conversionDetails.length > 10) {
        console.log(`  ... and ${conversionDetails.length - 10} more`);
      }
      
      const totalWonValue = conversionDetails.reduce((sum, conv) => sum + (conv.value || 0), 0);
      console.log(`\nTotal WON value: ₹${totalWonValue.toLocaleString('en-IN')}`);
    }
    
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
          value: offer.offerValue,
          poNumber: offer.poNumber
        });
      }
    }
    
    Object.entries(stageSamples).forEach(([stage, samples]) => {
      console.log(`\n${stage}:`);
      samples.forEach(sample => {
        console.log(`  ${sample.reference} - PO: ${sample.poReceived} - Value: ₹${sample.value?.toLocaleString('en-IN')} - PO#: ${sample.poNumber || 'None'}`);
      });
    });
    
    console.log('\n✅ Stage mapping with WON completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateOfferStagesWithWon();
