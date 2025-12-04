const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function verifyUser() {
  try {
    console.log('🔍 Verifying user: kishore@gmail.com\n');
    
    const user = await prisma.user.findFirst({
      where: { email: 'kishore@gmail.com' }
    });
    
    if (!user) {
      console.log('❌ User not found!');
      console.log('\n📝 Creating user now...\n');
      
      const westZone = await prisma.serviceZone.findFirst({
        where: { name: 'WEST' }
      });
      
      if (!westZone) {
        console.error('❌ WEST zone not found');
        return;
      }
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('kishore@123', 10);
      
      const newUser = await prisma.user.create({
        data: {
          name: 'Kishore',
          email: 'kishore@gmail.com',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
          tokenVersion: Math.random().toString(36)
        }
      });
      
      // Assign to zone
      await prisma.servicePersonZone.create({
        data: {
          userId: newUser.id,
          serviceZoneId: westZone.id
        }
      });
      
      console.log('✅ User created successfully!');
      console.log(`   ID: ${newUser.id}`);
      console.log(`   Name: ${newUser.name}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Role: ${newUser.role}`);
      console.log(`   Active: ${newUser.isActive}`);
    } else {
      console.log('✅ User found:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);
      
      // Test password
      const isValid = await bcrypt.compare('kishore@123', user.password);
      console.log(`   Password Valid: ${isValid ? '✅ YES' : '❌ NO'}`);
      
      if (!isValid) {
        console.log('\n🔄 Updating password...');
        const hashedPassword = await bcrypt.hash('kishore@123', 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
        console.log('✅ Password updated!');
      }
    }
    
    console.log('\n🔑 Login Credentials:');
    console.log('   Email: kishore@gmail.com');
    console.log('   Password: kishore@123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUser();
