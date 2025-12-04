const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkZoneShortForms() {
  try {
    console.log('Current zone configurations:');
    console.log('----------------------------');
    
    const zones = await prisma.serviceZone.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        shortForm: true
      }
    });

    // Display current configurations
    zones.forEach(zone => {
      console.log(`ID: ${zone.id} | Name: ${zone.name.padEnd(10)} | Short Form: '${zone.shortForm}'`);
    });

    // Expected configurations
    const expectedShortForms = {
      'North': 'N',
      'South': 'S',
      'East': 'E',
      'West': 'W',
      'Central': 'C',
      'International': 'I'
    };

    console.log('\nRecommended updates:');
    console.log('-------------------');
    
    let updatesNeeded = false;
    for (const zone of zones) {
      const expected = expectedShortForms[zone.name] || 'X';
      if (zone.shortForm !== expected) {
        console.log(`- Update ${zone.name.padEnd(12)}: Change short form from '${zone.shortForm || 'none'}' to '${expected}'`);
        updatesNeeded = true;
      }
    }

    if (!updatesNeeded) {
      console.log('All zone short forms are correctly configured!');
    } else {
      console.log('\nRun the update-zone-shortforms.js script to apply these changes.');
    }
    
  } catch (error) {
    console.error('❌ Error checking zone short forms:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkZoneShortForms();
