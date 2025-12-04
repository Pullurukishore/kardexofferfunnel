const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@example.com' }
    });
    
    if (admin) {
      console.log('✅ Admin user found:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
    } else {
      console.log('❌ Admin user not found');
      console.log('Creating admin user...');
      
      // Get the WEST zone
      const westZone = await prisma.serviceZone.findFirst({
        where: { name: 'WEST' }
      });
      
      if (westZone) {
        const newAdmin = await prisma.user.create({
          data: {
            name: 'Admin',
            email: 'admin@example.com',
            role: 'ADMIN',
            password: 'password123', // Default password
            tokenVersion: Math.random().toString(36)
          }
        });
        
        // Assign to WEST zone
        await prisma.servicePersonZone.create({
          data: {
            userId: newAdmin.id,
            serviceZoneId: westZone.id
          }
        });
        
        console.log('✅ Admin user created:');
        console.log(`   ID: ${newAdmin.id}`);
        console.log(`   Name: ${newAdmin.name}`);
        console.log(`   Email: ${newAdmin.email}`);
        console.log(`   Password: password123`);
      }
    }
    
    // Show all users
    const allUsers = await prisma.user.findMany({
      include: {
        serviceZones: {
          include: {
            serviceZone: true
          }
        }
      }
    });
    
    console.log('\n📋 All Users:');
    allUsers.forEach(user => {
      const zones = user.serviceZones.map(sz => sz.serviceZone.name).join(', ');
      console.log(`   ${user.name} (${user.email}) - ${user.role} - Zones: ${zones}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
