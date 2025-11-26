import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkZonesAndOffers() {
  try {
    console.log('🔍 Checking all zones and their offer counts...\n');
    
    const zones = await prisma.serviceZone.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });

    for (const zone of zones) {
      const offerCount = await prisma.offer.count({
        where: { zoneId: zone.id }
      });
      
      const offers = await prisma.offer.findMany({
        where: { zoneId: zone.id },
        select: { id: true, offerReferenceNumber: true, stage: true, offerValue: true }
      });

      console.log(`\n📍 Zone: ${zone.name} (ID: ${zone.id})`);
      console.log(`   Total Offers: ${offerCount}`);
      
      if (offers.length > 0) {
        console.log(`   Offers:`);
        offers.forEach(o => {
          console.log(`     - ${o.offerReferenceNumber} (Stage: ${o.stage}, Value: ${o.offerValue})`);
        });
      }
    }

    console.log('\n\n👤 Checking zone manager assignment...');
    const user = await prisma.user.findUnique({
      where: { email: 'pulluru@gmail.com' },
      include: { serviceZones: { include: { serviceZone: true } } }
    });

    if (user) {
      console.log(`\nUser: ${user.name} (${user.email})`);
      console.log(`Assigned Zones:`);
      user.serviceZones.forEach(sz => {
        console.log(`  - ${sz.serviceZone.name} (ID: ${sz.serviceZone.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkZonesAndOffers();
