const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Define the expected short forms for each zone
const ZONE_SHORT_FORMS = {
  'North': 'N',
  'South': 'S',
  'East': 'E',
  'West': 'W',
  'Central': 'C',
  'International': 'I'
};

async function updateAllZoneShortForms() {
  try {
    console.log('Updating zone short forms...');
    console.log('----------------------------');
    
    // Get all zones
    const zones = await prisma.serviceZone.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        shortForm: true
      }
    });

    // Update each zone with the correct short form
    for (const zone of zones) {
      const expectedShortForm = ZONE_SHORT_FORMS[zone.name] || 'X';
      
      if (zone.shortForm !== expectedShortForm) {
        console.log(`Updating ${zone.name.padEnd(12)}: Changing short form from '${zone.shortForm || 'none'}' to '${expectedShortForm}'`);
        
        await prisma.serviceZone.update({
          where: { id: zone.id },
          data: { shortForm: expectedShortForm }
        });
      } else {
        console.log(`${zone.name.padEnd(12)}: Already has correct short form '${zone.shortForm}'`);
      }
    }

    // Verify the updates
    console.log('\n✅ All zone short forms have been updated successfully!');
    console.log('\nUpdated zone configurations:');
    console.log('----------------------------');
    
    const updatedZones = await prisma.serviceZone.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        shortForm: true
      }
    });

    updatedZones.forEach(zone => {
      console.log(`ID: ${zone.id} | Name: ${zone.name.padEnd(12)} | Short Form: '${zone.shortForm}'`);
    });
    
  } catch (error) {
    console.error('❌ Error updating zone short forms:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAllZoneShortForms();
