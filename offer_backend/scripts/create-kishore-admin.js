const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createKishoreAdmin() {
  try {
    console.log('👤 Creating admin user: kishore@gmail.com\n');
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: 'kishore@gmail.com' }
    });
    
    if (existingUser) {
      console.log('✅ User already exists:');
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      
      // Update to admin if not already
      if (existingUser.role !== 'ADMIN') {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'ADMIN' }
        });
        console.log('🔑 Updated role to ADMIN');
      }
    } else {
      // Get the WEST zone
      const westZone = await prisma.serviceZone.findFirst({
        where: { name: 'WEST' }
      });
      
      if (!westZone) {
        console.error('❌ WEST zone not found. Please create zones first.');
        return;
      }
      
      // Create new admin user
      const newAdmin = await prisma.user.create({
        data: {
          name: 'Kishore',
          email: 'kishore@gmail.com',
          role: 'ADMIN',
          password: 'kishore@123',
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
      console.log(`   Password: kishore@123`);
      console.log(`   Role: ${newAdmin.role}`);
      console.log(`   Zone: ${westZone.name}`);
    }
    
    // Show all admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      include: {
        serviceZones: {
          include: {
            serviceZone: true
          }
        }
      }
    });
    
    console.log('\n👑 All Admin Users:');
    adminUsers.forEach(user => {
      const zones = user.serviceZones.map(sz => sz.serviceZone.name).join(', ');
      console.log(`   ${user.name} (${user.email}) - Zones: ${zones}`);
    });
    
    console.log('\n🔑 Login Credentials:');
    console.log('   Email: kishore@gmail.com');
    console.log('   Password: kishore@123');
    console.log('\n🌐 Access: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createKishoreAdmin();
