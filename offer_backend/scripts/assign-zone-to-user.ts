import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignZoneToUser() {
  try {
    console.log('🔍 Finding zone manager user...');
    
    // Find the zone manager user (pulluru)
    const user = await prisma.user.findUnique({
      where: { email: 'pulluru@gmail.com' }
    });

    if (!user) {
      console.log('❌ User not found: pulluru@gmail.com');
      return;
    }

    console.log(`✅ Found user: ${user.name} (${user.email}) - Role: ${user.role}`);

    // Find the South zone
    const zone = await prisma.serviceZone.findFirst({
      where: { 
        isActive: true,
        name: 'South'
      }
    });

    if (!zone) {
      console.log('❌ No active zones found');
      return;
    }

    console.log(`✅ Found zone: ${zone.name}`);

    // Check if user is already assigned to this zone
    const existingAssignment = await prisma.servicePersonZone.findUnique({
      where: {
        userId_serviceZoneId: {
          userId: user.id,
          serviceZoneId: zone.id
        }
      }
    });

    if (existingAssignment) {
      console.log(`⚠️  User is already assigned to zone: ${zone.name}`);
      return;
    }

    // Assign user to zone
    const assignment = await prisma.servicePersonZone.create({
      data: {
        userId: user.id,
        serviceZoneId: zone.id
      }
    });

    console.log(`✅ Successfully assigned user ${user.name} to zone ${zone.name}`);
    console.log(`   Assignment ID: ${assignment.id}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignZoneToUser();
