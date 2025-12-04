const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const adminData = {
      name: 'Admin User',
      email: 'admin@kardex.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      phone: '1234567890',
      tokenVersion: crypto.randomUUID(),
      isActive: true,
      shortForm: 'ADM' // Added short form for admin
    };

    console.log('Checking if admin user exists...');
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminData.email }
    });

    if (existingAdmin) {
      console.log('❌ Admin user already exists');
      return;
    }

    console.log('Creating admin user...');
    const admin = await prisma.user.create({
      data: adminData
    });

    console.log('✅ Admin user created successfully!');
    console.log({
      id: admin.id,
      email: admin.email,
      role: admin.role,
      status: admin.isActive ? 'Active' : 'Inactive'
    });
  } catch (error) {
    console.error('❌ Error creating admin user:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
