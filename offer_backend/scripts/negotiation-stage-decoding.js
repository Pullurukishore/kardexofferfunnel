const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeNegotiationStageDecoding() {
  try {
    console.log('=== NEGOTIATION STAGE DECODING ANALYSIS ===');
    
    console.log('\n📋 FRONTEND DISPLAY FORMATS:');
    console.log('1. DATABASE VALUE: "NEGOTIATION" (uppercase with underscore)');
    console.log('2. DISPLAY LABEL: "Negotiation" (Title case, space separated)');
    console.log('3. COLOR SCHEME: Amber/Purple theme (depending on component)');
    
    console.log('\n🎨 COLOR THEMES FOR NEGOTIATION:');
    console.log('• Dashboard Components: Purple theme (text-purple-600 bg-purple-50)');
    console.log('• Offer Lists: Amber theme (bg-gradient-to-r from-amber-100 to-amber-50)');
    console.log('• Activity Timeline: Amber theme (bg-amber-600 hover:bg-amber-700)');
    console.log('• Stage Progression: Amber theme (color: "amber")');
    
    console.log('\n🔄 FORMATTING LOGIC:');
    console.log('formatStage() function:');
    console.log('  Input: "NEGOTIATION"');
    console.log('  Process: stage.split("_").map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(" ")');
    console.log('  Output: "Negotiation"');
    
    console.log('\n📊 NEGOTIATION STAGE IN DATABASE:');
    
    // Check actual negotiation offers in database
    const negotiationOffers = await prisma.offer.findMany({
      where: { stage: 'NEGOTIATION' },
      select: {
        id: true,
        offerReferenceNumber: true,
        stage: true,
        customer: { select: { companyName: true } },
        zone: { select: { name: true } },
        createdAt: true
      },
      take: 10
    });
    
    console.log(`\nFound ${negotiationOffers.length} negotiation offers (showing first 10):`);
    negotiationOffers.forEach(offer => {
      console.log(`• ${offer.offerReferenceNumber} - ${offer.customer.companyName} (${offer.zone.name})`);
      console.log(`  Stage: ${offer.stage} → Display: "Negotiation"`);
      console.log(`  Created: ${offer.createdAt.toLocaleDateString()}`);
    });
    
    // Count all negotiation offers
    const totalNegotiationCount = await prisma.offer.count({
      where: { stage: 'NEGOTIATION' }
    });
    
    console.log(`\n📈 NEGOTIATION STAGE STATISTICS:`);
    console.log(`Total Negotiation Offers: ${totalNegotiationCount}`);
    
    // Negotiation offers by zone
    const negotiationByZone = await prisma.offer.groupBy({
      by: ['zoneId'],
      where: { stage: 'NEGOTIATION' },
      _count: { _all: true },
      _sum: { offerValue: true, poValue: true }
    });
    
    console.log('\nNegotiation Offers by Zone:');
    for (const zoneStat of negotiationByZone) {
      const zone = await prisma.serviceZone.findUnique({
        where: { id: zoneStat.zoneId },
        select: { name: true }
      });
      
      const offerValue = Number(zoneStat._sum.offerValue || 0);
      const poValue = Number(zoneStat._sum.poValue || 0);
      
      console.log(`• ${zone?.name || 'Unknown'}: ${zoneStat._count._all} offers`);
      console.log(`  Offer Value: ₹${offerValue.toLocaleString('en-In')}`);
      console.log(`  PO Value: ₹${poValue.toLocaleString('en-In')}`);
    }
    
    console.log('\n🔧 FRONTEND COMPONENTS USING NEGOTIATION:');
    console.log('1. Dashboard Pie Charts');
    console.log('2. Offer Lists (Admin, Zone Manager, Zone User)');
    console.log('3. Stage Progression in Offer Details');
    console.log('4. Activity Timeline');
    console.log('5. Filter Dropdowns');
    console.log('6. Reports and Analytics');
    
    console.log('\n📝 NEGOTIATION STAGE FEATURES:');
    console.log('• Requires negotiation notes/remarks');
    console.log('• Has special UI for adding negotiation notes');
    console.log('• Shows in activity timeline with amber color');
    console.log('• Part of main sales funnel stages');
    console.log('• Included in pipeline calculations');
    console.log('• Has dedicated color coding across all components');
    
    console.log('\n⚙️ TECHNICAL IMPLEMENTATION:');
    console.log('• Database stores: "NEGOTIATION"');
    console.log('• Frontend displays: "Negotiation" (via formatStage)');
    console.log('• Color mapping: Multiple color schemes by component');
    console.log('• Icon: TrendingUp (in stage progression)');
    console.log('• Emoji: 💬 (in negotiation notes section)');
    
    console.log('\n🎯 STAGE ORDER IN SALES FUNNEL:');
    console.log('1. INITIAL');
    console.log('2. PROPOSAL_SENT');
    console.log('3. NEGOTIATION ← Current stage');
    console.log('4. FINAL_APPROVAL');
    console.log('5. PO_RECEIVED');
    console.log('6. ORDER_BOOKED');
    console.log('7. WON');
    console.log('(LOST is separate outcome stage)');
    
    console.log('\n✅ DECODING SUMMARY:');
    console.log('• Raw DB Value: "NEGOTIATION"');
    console.log('• Display Label: "Negotiation"');
    console.log('• Format Function: formatStage()');
    console.log('• Color Themes: Amber/Purple variations');
    console.log('• Special Features: Negotiation notes, timeline tracking');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeNegotiationStageDecoding();
