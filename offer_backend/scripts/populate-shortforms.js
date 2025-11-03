const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function populateShortForms() {
  console.log('🚀 Populating shortForm values for existing records...');

  try {
    // Update ServiceZone shortForm based on common zone names
    const zones = await prisma.serviceZone.findMany();
    
    for (const zone of zones) {
      let shortForm = 'X'; // Default fallback
      
      // Generate short form based on zone name
      const name = zone.name.toLowerCase();
      if (name.includes('west') || name.includes('mumbai')) {
        shortForm = 'W';
      } else if (name.includes('east') || name.includes('kolkata') || name.includes('bengal')) {
        shortForm = 'E';
      } else if (name.includes('north') || name.includes('delhi') || name.includes('punjab')) {
        shortForm = 'N';
      } else if (name.includes('south') || name.includes('bangalore') || name.includes('chennai') || name.includes('hyderabad')) {
        shortForm = 'S';
      } else if (name.includes('central') || name.includes('madhya')) {
        shortForm = 'C';
      } else {
        // Take first letter of zone name
        shortForm = zone.name.charAt(0).toUpperCase();
      }

      await prisma.serviceZone.update({
        where: { id: zone.id },
        data: { shortForm }
      });

      console.log(`   ✅ Updated zone "${zone.name}" with shortForm: ${shortForm}`);
    }

    // Update User shortForm based on names
    const users = await prisma.user.findMany({
      where: {
        name: { not: null }
      }
    });

    for (const user of users) {
      if (user.name) {
        const nameParts = user.name.trim().split(' ');
        let shortForm = '';
        
        if (nameParts.length >= 2) {
          // Take first letter of first two words
          shortForm = (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
        } else {
          // Take first two letters of the name
          shortForm = nameParts[0].substring(0, 2).toUpperCase();
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { shortForm }
        });

        console.log(`   ✅ Updated user "${user.name}" with shortForm: ${shortForm}`);
      }
    }

    console.log('🎉 Successfully populated shortForm values!');
    console.log('\n📋 Summary:');
    console.log(`   - Updated ${zones.length} zones with shortForm values`);
    console.log(`   - Updated ${users.length} users with shortForm values`);
    console.log('\n🎯 New offer reference format will be: KRIND/W/SPP/AB25042');

  } catch (error) {
    console.error('❌ Population failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

populateShortForms()
  .then(() => {
    console.log('✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
