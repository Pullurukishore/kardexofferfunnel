const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTargets() {
  try {
    console.log('🎯 Creating targets for zones and users...\n');
    
    // Get all zones
    const zones = await prisma.serviceZone.findMany();
    console.log(`Found ${zones.length} zones:`, zones.map(z => z.name).join(', '));
    
    // Get all users
    const users = await prisma.user.findMany({
      where: { role: { in: ['ZONE_USER', 'ZONE_MANAGER'] } },
      include: {
        serviceZones: {
          include: {
            serviceZone: true
          }
        }
      }
    });
    console.log(`Found ${users.length} zone users\n`);
    
    // Target period (current year)
    const targetPeriod = '2025';
    const periodType = 'YEARLY';
    
    // Get admin user for createdById/updatedById
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@example.com' }
    });
    
    if (!admin) {
      console.error('❌ Admin user not found');
      return;
    }
    
    console.log('📊 Creating Zone Targets...\n');
    
    // Create zone targets
    for (const zone of zones) {
      // Calculate target based on actual offers
      const actualOffers = await prisma.offer.count({
        where: {
          zoneId: zone.id,
          stage: { in: ['WON', 'PO_RECEIVED', 'ORDER_BOOKED'] }
        }
      });
      
      const actualValue = await prisma.offer.aggregate({
        where: {
          zoneId: zone.id,
          stage: { in: ['WON', 'PO_RECEIVED', 'ORDER_BOOKED'] }
        },
        _sum: { poValue: true }
      });
      
      const totalOffers = await prisma.offer.count({
        where: { zoneId: zone.id }
      });
      
      // Set target as 20% higher than actual
      const targetValue = actualValue._sum.poValue ? 
        Math.round(Number(actualValue._sum.poValue) * 1.2) : 
        5000000; // Default 5L if no actual value
      
      const targetOfferCount = Math.round(totalOffers * 1.2) || 10;
      
      console.log(`Zone: ${zone.name}`);
      console.log(`  Actual Offers: ${actualOffers} / ${totalOffers}`);
      console.log(`  Actual Value: ₹${actualValue._sum.poValue || 0}`);
      console.log(`  Target Value: ₹${targetValue}`);
      console.log(`  Target Offers: ${targetOfferCount}`);
      
      // Create overall target
      await prisma.zoneTarget.upsert({
        where: {
          serviceZoneId_targetPeriod_periodType_productType: {
            serviceZoneId: zone.id,
            targetPeriod,
            periodType,
            productType: null
          }
        },
        update: {
          targetValue,
          targetOfferCount,
          updatedById: admin.id
        },
        create: {
          serviceZoneId: zone.id,
          targetPeriod,
          periodType,
          productType: null,
          targetValue,
          targetOfferCount,
          createdById: admin.id,
          updatedById: admin.id
        }
      });
      
      // Create product type targets
      const productTypes = ['CONTRACT', 'SPP', 'MIDLIFE_UPGRADE', 'RELOCATION', 'UPGRADE_KIT'];
      
      for (const productType of productTypes) {
        const ptActualOffers = await prisma.offer.count({
          where: {
            zoneId: zone.id,
            productType,
            stage: { in: ['WON', 'PO_RECEIVED', 'ORDER_BOOKED'] }
          }
        });
        
        const ptActualValue = await prisma.offer.aggregate({
          where: {
            zoneId: zone.id,
            productType,
            stage: { in: ['WON', 'PO_RECEIVED', 'ORDER_BOOKED'] }
          },
          _sum: { poValue: true }
        });
        
        const ptTargetValue = ptActualValue._sum.poValue ? 
          Math.round(Number(ptActualValue._sum.poValue) * 1.2) : 
          1000000; // Default 1L per product type
        
        const ptTargetOfferCount = Math.round(ptActualOffers * 1.2) || 2;
        
        if (ptActualOffers > 0) { // Only create if there are actual offers
          await prisma.zoneTarget.upsert({
            where: {
              serviceZoneId_targetPeriod_periodType_productType: {
                serviceZoneId: zone.id,
                targetPeriod,
                periodType,
                productType
              }
            },
            update: {
              targetValue: ptTargetValue,
              targetOfferCount: ptTargetOfferCount,
              updatedById: admin.id
            },
            create: {
              serviceZoneId: zone.id,
              targetPeriod,
              periodType,
              productType,
              targetValue: ptTargetValue,
              targetOfferCount: ptTargetOfferCount,
              createdById: admin.id,
              updatedById: admin.id
            }
          });
          
          console.log(`  ${productType}: ₹${ptTargetValue} (${ptTargetOfferCount} offers)`);
        }
      }
      console.log('');
    }
    
    console.log('👥 Creating User Targets...\n');
    
    // Create user targets
    for (const user of users) {
      for (const userZone of user.serviceZones) {
        const zone = userZone.serviceZone;
        
        // Calculate user's actual performance
        const actualOffers = await prisma.offer.count({
          where: {
            assignedToId: user.id,
            zoneId: zone.id,
            stage: { in: ['WON', 'PO_RECEIVED', 'ORDER_BOOKED'] }
          }
        });
        
        const actualValue = await prisma.offer.aggregate({
          where: {
            assignedToId: user.id,
            zoneId: zone.id,
            stage: { in: ['WON', 'PO_RECEIVED', 'ORDER_BOOKED'] }
          },
          _sum: { poValue: true }
        });
        
        const totalOffers = await prisma.offer.count({
          where: {
            assignedToId: user.id,
            zoneId: zone.id
          }
        });
        
        // Set target as 15% higher than actual
        const targetValue = actualValue._sum.poValue ? 
          Math.round(Number(actualValue._sum.poValue) * 1.15) : 
          2000000; // Default 2L per user
        
        const targetOfferCount = Math.round(totalOffers * 1.15) || 5;
        
        console.log(`User: ${user.name} (${zone.name})`);
        console.log(`  Actual Offers: ${actualOffers} / ${totalOffers}`);
        console.log(`  Actual Value: ₹${actualValue._sum.poValue || 0}`);
        console.log(`  Target Value: ₹${targetValue}`);
        console.log(`  Target Offers: ${targetOfferCount}`);
        
        // Create overall target
        await prisma.userTarget.upsert({
          where: {
            userId_targetPeriod_periodType_productType: {
              userId: user.id,
              targetPeriod,
              periodType,
              productType: null
            }
          },
          update: {
            targetValue,
            targetOfferCount,
            updatedById: admin.id
          },
          create: {
            userId: user.id,
            targetPeriod,
            periodType,
            productType: null,
            targetValue,
            targetOfferCount,
            createdById: admin.id,
            updatedById: admin.id
          }
        });
        
        // Create product type targets for user's main products
        const userProductTypes = await prisma.offer.groupBy({
          by: ['productType'],
          where: {
            assignedToId: user.id,
            zoneId: zone.id
          },
          _count: { productType: true }
        });
        
        for (const pt of userProductTypes) {
          if (pt._count.productType >= 2) { // Only create if user has 2+ offers of this type
            const ptActualOffers = await prisma.offer.count({
              where: {
                assignedToId: user.id,
                zoneId: zone.id,
                productType: pt.productType,
                stage: { in: ['WON', 'PO_RECEIVED', 'ORDER_BOOKED'] }
              }
            });
            
            const ptActualValue = await prisma.offer.aggregate({
              where: {
                assignedToId: user.id,
                zoneId: zone.id,
                productType: pt.productType,
                stage: { in: ['WON', 'PO_RECEIVED', 'ORDER_BOOKED'] }
              },
              _sum: { poValue: true }
            });
            
            const ptTargetValue = ptActualValue._sum.poValue ? 
              Math.round(Number(ptActualValue._sum.poValue) * 1.15) : 
              500000; // Default 5L per product type
            
            const ptTargetOfferCount = Math.round(ptActualOffers * 1.15) || 1;
            
            await prisma.userTarget.upsert({
              where: {
                userId_targetPeriod_periodType_productType: {
                  userId: user.id,
                  targetPeriod,
                  periodType,
                  productType: pt.productType
                }
              },
              update: {
                targetValue: ptTargetValue,
                targetOfferCount: ptTargetOfferCount,
                updatedById: admin.id
              },
              create: {
                userId: user.id,
                targetPeriod,
                periodType,
                productType: pt.productType,
                targetValue: ptTargetValue,
                targetOfferCount: ptTargetOfferCount,
                createdById: admin.id,
                updatedById: admin.id
              }
            });
            
            console.log(`  ${pt.productType}: ₹${ptTargetValue} (${ptTargetOfferCount} offers)`);
          }
        }
        console.log('');
      }
    }
    
    console.log('✅ Targets created successfully!');
    console.log('\n📈 Target Summary:');
    
    // Show summary
    const zoneTargetsCount = await prisma.zoneTarget.count({
      where: { targetPeriod, periodType }
    });
    
    const userTargetsCount = await prisma.userTarget.count({
      where: { targetPeriod, periodType }
    });
    
    console.log(`   Zone Targets: ${zoneTargetsCount}`);
    console.log(`   User Targets: ${userTargetsCount}`);
    console.log(`   Period: ${targetPeriod} (${periodType})`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('   Email: admin@example.com');
    console.log('   Password: password123');
    console.log('\n🌐 Access the application at: http://localhost:3000');
    console.log('   Navigate to: Admin → Targets to view and manage targets');
    
  } catch (error) {
    console.error('❌ Error creating targets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTargets();
