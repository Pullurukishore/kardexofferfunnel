const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateZoneShortForms() {
  try {
    // Update South zone short form to 'S'
    const southZone = await prisma.serviceZone.updateMany({
      where: {
        name: {
          contains: 'South',
          mode: 'insensitive'
        }
      },
      data: {
        shortForm: 'S'
      }
    });

    console.log(`✅ Updated ${southZone.count} South zone(s) with short form 'S'`);

    // Verify the update
    const updatedZone = await prisma.serviceZone.findFirst({
      where: {
        name: {
          contains: 'South',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        shortForm: true
      }
    });

    console.log('\nUpdated zone details:');
    console.log(updatedZone);
    
  } catch (error) {
    console.error('❌ Error updating zone short forms:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

updateZoneShortForms();
