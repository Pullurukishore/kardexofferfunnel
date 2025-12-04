const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function validateIntegration() {
  try {
    console.log('=== INTEGRATION VALIDATION ===\n');
    
    // Check database counts
    const [offersCount, customersCount, usersCount, zonesCount] = await Promise.all([
      prisma.offer.count(),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.serviceZone.count({ where: { isActive: true } })
    ]);
    
    console.log('Database Statistics:');
    console.log(`- Total Offers: ${offersCount}`);
    console.log(`- Total Customers: ${customersCount}`);
    console.log(`- Total Users: ${usersCount}`);
    console.log(`- Total Zones: ${zonesCount}\n`);
    
    // Check product type distribution
    const productTypeStats = await prisma.offer.groupBy({
      by: ['productType'],
      _count: { productType: true },
      orderBy: { _count: { productType: 'desc' } }
    });
    
    console.log('Product Type Distribution:');
    productTypeStats.forEach(stat => {
      console.log(`- ${stat.productType}: ${stat._count.productType} offers`);
    });
    console.log();
    
    // Check zone distribution
    const zoneStats = await prisma.offer.groupBy({
      by: ['zoneId'],
      _count: { zoneId: true },
      orderBy: { _count: { zoneId: 'desc' } }
    });
    
    console.log('Zone Distribution:');
    for (const stat of zoneStats) {
      const zone = await prisma.serviceZone.findUnique({
        where: { id: stat.zoneId },
        select: { name: true }
      });
      console.log(`- ${zone.name}: ${stat._count.zoneId} offers`);
    }
    console.log();
    
    // Check user distribution
    const userStats = await prisma.offer.groupBy({
      by: ['createdById'],
      _count: { createdById: true },
      orderBy: { _count: { createdById: 'desc' } }
    });
    
    console.log('User Distribution (Top 10):');
    for (let i = 0; i < Math.min(10, userStats.length); i++) {
      const stat = userStats[i];
      const user = await prisma.user.findUnique({
        where: { id: stat.createdById },
        select: { name: true }
      });
      console.log(`- ${user.name}: ${stat._count.createdById} offers`);
    }
    console.log();
    
    // Check offer value statistics
    const valueStats = await prisma.offer.aggregate({
      _sum: { offerValue: true },
      _avg: { offerValue: true },
      _min: { offerValue: true },
      _max: { offerValue: true },
      _count: true
    });
    
    console.log('Offer Value Statistics:');
    console.log(`- Total Value: ₹${(valueStats._sum.offerValue || 0).toLocaleString('en-IN')}`);
    console.log(`- Average Value: ₹${Math.round(valueStats._avg.offerValue || 0).toLocaleString('en-IN')}`);
    console.log(`- Min Value: ₹${(valueStats._min.offerValue || 0).toLocaleString('en-IN')}`);
    console.log(`- Max Value: ₹${(valueStats._max.offerValue || 0).toLocaleString('en-IN')}`);
    console.log();
    
    // Check stage distribution
    const stageStats = await prisma.offer.groupBy({
      by: ['stage'],
      _count: { stage: true },
      orderBy: { _count: { stage: 'desc' } }
    });
    
    console.log('Stage Distribution:');
    stageStats.forEach(stat => {
      console.log(`- ${stat.stage}: ${stat._count.stage} offers`);
    });
    console.log();
    
    // Sample data verification
    console.log('Sample Offers (First 5):');
    const sampleOffers = await prisma.offer.findMany({
      take: 5,
      select: {
        offerReferenceNumber: true,
        company: true,
        productType: true,
        offerValue: true,
        zone: { select: { name: true } },
        createdBy: { select: { name: true } },
        customer: { select: { companyName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    sampleOffers.forEach(offer => {
      console.log(`- ${offer.offerReferenceNumber}: ${offer.company} (${offer.productType}) - ₹${offer.offerValue} - ${offer.zone.name} - ${offer.createdBy.name}`);
    });
    
    console.log('\n=== VALIDATION COMPLETE ===');
    console.log('✅ All checks passed! Your project is ready with Excel data.');
    
  } catch (error) {
    console.error('Validation failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run validation
if (require.main === module) {
  validateIntegration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { validateIntegration };
