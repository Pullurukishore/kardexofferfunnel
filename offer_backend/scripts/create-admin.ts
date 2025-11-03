import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('Creating admin user...');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@offerfunnel.com' },
      update: {
        password: hashedPassword,
        isActive: true,
      },
      create: {
        email: 'admin@offerfunnel.com',
        password: hashedPassword,
        role: 'ADMIN',
        name: 'Admin User',
        phone: '9876543210',
        isActive: true,
        tokenVersion: crypto.randomUUID(),
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n📧 Email: admin@offerfunnel.com');
    console.log('🔑 Password: admin123');
    console.log('\nYou can now login to the application.');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
