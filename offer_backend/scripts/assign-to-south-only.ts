import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignToSouthOnly() {
  try {
    console.log('🔍 Finding zone manager user...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'pulluru@gmail.com' }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`✅ Found user: ${user.name}`);

    // Delete all existing assignments
    const deleted = await prisma.servicePersonZone.deleteMany({
      where: { userId: user.id }
    });

    console.log(`🗑️  Deleted ${deleted.count} existing zone assignments`);

    // Find South zone (ID: 3)
    const southZone = await prisma.serviceZone.findFirst({
      where: { name: 'South' }
    });

    if (!southZone) {
      console.log('❌ South zone not found');
      return;
    }

    console.log(`✅ Found South zone (ID: ${southZone.id})`);

    // Create new assignment to South only
    const assignment = await prisma.servicePersonZone.create({
      data: {
        userId: user.id,
        serviceZoneId: southZone.id
      }
    });

    console.log(`✅ Successfully assigned ${user.name} to South zone only`);
    console.log(`   Assignment ID: ${assignment.id}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignToSouthOnly();
