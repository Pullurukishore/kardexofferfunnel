const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearData() {
  try {
    console.log('Clearing offers...');
    await prisma.offer.deleteMany();
    console.log('Offers cleared');
    
    console.log('Clearing contacts...');
    await prisma.contact.deleteMany();
    console.log('Contacts cleared');
    
    console.log('Clearing assets...');
    await prisma.asset.deleteMany();
    console.log('Assets cleared');
    
    console.log('Data cleared successfully!');
  } catch (error) {
    console.error('Error clearing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();
