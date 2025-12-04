const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeNegotiationStageCriteria() {
  try {
    console.log('=== NEGOTIATION STAGE - BUSINESS CRITERIA ANALYSIS ===');
    
    console.log('\n📋 OFFER STAGE DEFINITION (from Prisma Schema):');
    console.log('enum OfferStage {');
    console.log('  INITIAL');
    console.log('  PROPOSAL_SENT');
    console.log('  NEGOTIATION ← Current analysis stage');
    console.log('  FINAL_APPROVAL');
    console.log('  PO_RECEIVED');
    console.log('  ORDER_BOOKED');
    console.log('  WON');
    console.log('  LOST');
    console.log('}');
    
    console.log('\n🎯 NEGOTIATION STAGE BUSINESS DESCRIPTION:');
    console.log('From frontend STAGE_INFO:');
    console.log('✅ "In active negotiations"');
    console.log('✅ "Document key discussion points"');
    console.log('✅ "Pricing changes"');
    console.log('✅ "Customer objections"');
    console.log('✅ "Customer concerns"');
    
    console.log('\n🔧 TECHNICAL REQUIREMENTS FOR NEGOTIATION STAGE:');
    console.log('• requiresAllFields: true (all offer fields must be complete)');
    console.log('• Color theme: Amber');
    console.log('• Icon: 💬 (conversation/negotiation)');
    console.log('• Special UI: Negotiation notes section');
    
    console.log('\n📊 CURRENT NEGOTIATION OFFERS ANALYSIS:');
    
    // Get all negotiation offers with full details
    const negotiationOffers = await prisma.offer.findMany({
      where: { stage: 'NEGOTIATION' },
      select: {
        id: true,
        offerReferenceNumber: true,
        stage: true,
        status: true,
        priority: true,
        offerValue: true,
        poValue: true,
        probabilityPercentage: true,
        createdAt: true,
        updatedAt: true,
        customer: { select: { companyName: true } },
        zone: { select: { name: true } },
        createdBy: { select: { name: true, email: true } },
        stageRemarks: {
          where: { stage: 'NEGOTIATION' },
          select: { remarks: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      },
      take: 20,
      orderBy: { updatedAt: 'desc' }
    });
    
    console.log(`\nFound ${negotiationOffers.length} negotiation offers (showing recent 20):`);
    
    negotiationOffers.forEach((offer, index) => {
      console.log(`\n${index + 1}. ${offer.offerReferenceNumber} - ${offer.customer.companyName}`);
      console.log(`   Zone: ${offer.zone.name} | Created by: ${offer.createdBy.name}`);
      console.log(`   Status: ${offer.status} | Priority: ${offer.priority}`);
      console.log(`   Offer Value: ₹${Number(offer.offerValue || 0).toLocaleString('en-In')}`);
      console.log(`   PO Value: ₹${Number(offer.poValue || 0).toLocaleString('en-In')}`);
      console.log(`   Probability: ${offer.probabilityPercentage || 0}%`);
      console.log(`   Created: ${offer.createdAt.toLocaleDateString()} | Updated: ${offer.updatedAt.toLocaleDateString()}`);
      
      if (offer.stageRemarks.length > 0) {
        console.log(`   Recent Negotiation Notes (${offer.stageRemarks.length}):`);
        offer.stageRemarks.forEach((remark, i) => {
          console.log(`     ${i + 1}. ${remark.remarks.substring(0, 100)}${remark.remarks.length > 100 ? '...' : ''}`);
          console.log(`        (${remark.createdAt.toLocaleDateString()})`);
        });
      } else {
        console.log(`   ⚠️  No negotiation notes found`);
      }
    });
    
    console.log('\n🔍 BUSINESS PATTERNS IN NEGOTIATION STAGE:');
    
    // Analyze patterns
    const withPoValue = negotiationOffers.filter(o => o.poValue && Number(o.poValue) > 0);
    const withHighProbability = negotiationOffers.filter(o => (o.probabilityPercentage || 0) >= 50);
    const recentUpdates = negotiationOffers.filter(o => {
      const daysSinceUpdate = (new Date() - new Date(o.updatedAt)) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate <= 7;
    });
    
    console.log(`• Offers with PO Value: ${withPoValue.length}/${negotiationOffers.length} (${((withPoValue.length/negotiationOffers.length)*100).toFixed(1)}%)`);
    console.log(`• High Probability (≥50%): ${withHighProbability.length}/${negotiationOffers.length} (${((withHighProbability.length/negotiationOffers.length)*100).toFixed(1)}%)`);
    console.log(`• Updated in last 7 days: ${recentUpdates.length}/${negotiationOffers.length} (${((recentUpdates.length/negotiationOffers.length)*100).toFixed(1)}%)`);
    
    console.log('\n📋 NEGOTIATION STAGE - BUSINESS RULES & CRITERIA:');
    console.log('\n🎯 WHEN TO MARK OFFER AS NEGOTIATION:');
    console.log('✅ 1. PROPOSAL SENT STAGE → Customer has received the proposal');
    console.log('✅ 2. Customer is actively discussing the offer');
    console.log('✅ 3. Pricing negotiations are in progress');
    console.log('✅ 4. Customer has objections or concerns being addressed');
    console.log('✅ 5. All required offer fields are complete');
    console.log('✅ 6. Sales team is actively engaged with customer');
    
    console.log('\n⚠️  SPECIFIC INDICATORS:');
    console.log('• Customer has requested price changes');
    console.log('• Customer is comparing with competitors');
    console.log('• Technical discussions are ongoing');
    console.log('• Decision makers are involved');
    console.log('• Multiple follow-up meetings required');
    console.log('• PO is expected but not yet received');
    
    console.log('\n🔄 STAGE TRANSITION LOGIC:');
    console.log('FROM PROPOSAL_SENT → NEGOTIATION WHEN:');
    console.log('• Customer responds to proposal');
    console.log('• Negotiation discussions begin');
    console.log('• Pricing/terms need adjustment');
    console.log('• Customer objections need resolution');
    
    console.log('\nFROM NEGOTIATION → FINAL_APPROVAL WHEN:');
    console.log('• Customer agrees to terms in principle');
    console.log('• Internal approval process starts');
    console.log('• Final terms are being prepared');
    console.log('• PO issuance is imminent');
    
    console.log('\nFROM NEGOTIATION → LOST WHEN:');
    console.log('• Customer rejects the offer');
    console.log('• Competitor wins the deal');
    console.log('• Customer decides not to proceed');
    console.log('• Timeline expires without resolution');
    
    console.log('\n📝 REQUIRED ACTIONS IN NEGOTIATION STAGE:');
    console.log('• Document all negotiation points');
    console.log('• Track pricing changes and counter-offers');
    console.log('• Record customer objections and responses');
    console.log('• Update probability based on progress');
    console.log('• Schedule follow-up meetings');
    console.log('• Coordinate with technical team if needed');
    
    console.log('\n🎯 KEY SUCCESS METRICS:');
    console.log('• Conversion Rate: NEGOTIATION → FINAL_APPROVAL/WON');
    console.log('• Average Time in NEGOTIATION stage');
    console.log('• Win Rate for negotiation deals');
    console.log('• Average Deal Size from negotiation');
    
    console.log('\n✅ SUMMARY:');
    console.log('NEGOTIATION stage is for offers that have moved beyond initial proposal');
    console.log('and are in active discussion/negotiation with the customer. This stage');
    console.log('requires all fields to be complete and involves detailed tracking of');
    console.log('negotiation points, pricing changes, and customer concerns.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeNegotiationStageCriteria();
