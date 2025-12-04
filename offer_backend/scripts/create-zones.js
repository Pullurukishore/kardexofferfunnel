const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const zones = [
  { name: 'North', description: 'Northern Region' },
  { name: 'South', description: 'Southern Region' },
  { name: 'East', description: 'Eastern Region' },
  { name: 'West', description: 'Western Region' }
];

async function createZones() {
  try {
    console.log('Creating zones...');
    
    for (const zone of zones) {
      // Check if zone already exists
      const existingZone = await prisma.serviceZone.findFirst({
        where: { name: zone.name }
      });

      if (existingZone) {
        console.log(`Zone '${zone.name}' already exists (ID: ${existingZone.id})`);
        continue;
      }

      // Create zone if it doesn't exist
      const createdZone = await prisma.serviceZone.create({
        data: {
          name: zone.name,
          description: zone.description,
          isActive: true
        }
      });

      console.log(`✅ Created zone: ${createdZone.name} (ID: ${createdZone.id})`);
    }

    console.log('\nAll zones have been processed.');
    
  } catch (error) {
    console.error('❌ Error creating zones:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

createZones();
