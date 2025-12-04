const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createZoneAssignments() {
  try {
    console.log('=== CREATING PROPER ZONE ASSIGNMENTS ===');
    
    // Get all zones
    const zones = await prisma.serviceZone.findMany();
    const zoneMap = new Map(zones.map(z => [z.name, z.id]));
    
    console.log('Available zones:', Array.from(zoneMap.keys()));
    
    // Typical zone assignments based on common organizational structure
    // You can modify these based on your actual requirements
    const userZoneAssignments = {
      // WEST Zone users
      'Yogesh': 'WEST',
      'Ashraf': 'WEST', 
      'Rahul': 'WEST',
      'Minesh': 'WEST',
      
      // SOUTH Zone users
      'Gajendra': 'SOUTH',
      'Pradeep': 'SOUTH',
      
      // NORTH Zone users  
      'Sasi': 'NORTH',
      'Vinay': 'NORTH',
      
      // EAST Zone users
      'Nitin': 'EAST',
      'Pankaj': 'EAST',
      
      // Admins can be in WEST or have access to all zones
      'Admin': 'WEST',
      'Kishore': 'WEST'
    };
    
    console.log('\n=== APPLYING ZONE ASSIGNMENTS ===');
    
    for (const [userName, zoneName] of Object.entries(userZoneAssignments)) {
      const user = await prisma.user.findFirst({
        where: { name: userName },
        include: { serviceZones: true }
      });
      
      if (!user) {
        console.log(`❌ User not found: ${userName}`);
        continue;
      }
      
      const zoneId = zoneMap.get(zoneName);
      if (!zoneId) {
        console.log(`❌ Zone not found: ${zoneName} for user ${userName}`);
        continue;
      }
      
      // Clear existing zone assignments
      await prisma.servicePersonZone.deleteMany({
        where: { userId: user.id }
      });
      
      // Create new zone assignment
      await prisma.servicePersonZone.create({
        data: {
          userId: user.id,
          serviceZoneId: zoneId
        }
      });
      
      console.log(`✅ Assigned ${userName} to ${zoneName} zone`);
    }
    
    // Verify the assignments
    console.log('\n=== VERIFIED ASSIGNMENTS ===');
    const users = await prisma.user.findMany({
      include: {
        serviceZones: {
          include: {
            serviceZone: true
          }
        }
      }
    });
    
    const zoneCounts = {};
    users.forEach(user => {
      const zones = user.serviceZones.map(sz => sz.serviceZone.name).join(', ') || 'NO ZONE';
      console.log(`${user.name} (${user.email}) - Role: ${user.role} - Zones: ${zones}`);
      
      user.serviceZones.forEach(sz => {
        const zoneName = sz.serviceZone.name;
        zoneCounts[zoneName] = (zoneCounts[zoneName] || 0) + 1;
      });
    });
    
    console.log('\n=== FINAL ZONE COUNTS ===');
    Object.entries(zoneCounts).forEach(([zone, count]) => {
      console.log(`${zone}: ${count} users`);
    });
    
    console.log('\n✅ Zone assignments updated successfully!');
    console.log('\nNote: Modify the userZoneAssignments object in this script if you need different assignments.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createZoneAssignments();
