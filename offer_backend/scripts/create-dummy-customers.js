const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Sample customer data with assets
const customers = [
  {
    companyName: 'Tech Solutions Inc.',
    location: 'North City',
    department: 'Operations',
    registrationDate: new Date('2020-01-15'),
    industry: 'Technology',
    website: 'https://north.techsolutions.com',
    address: '123 Tech Park, North City',
    city: 'North City',
    state: 'North State',
    country: 'India',
    pincode: '400001',
    zoneName: 'North',
    isActive: true,
    contacts: [
      { contactPersonName: 'John Doe', contactNumber: '+911234567890', email: 'north@techsolutions.com' },
      { contactPersonName: 'Sarah Smith', contactNumber: '+919876543210', email: 'sarah@techsolutions.com' }
    ],
    assets: [
      { 
        name: 'Warehouse Rack System', 
        model: 'WR-5000', 
        serialNumber: 'WR-5000-N1',
        installationDate: new Date('2022-01-15')
      },
      { 
        name: 'Automated Conveyor System', 
        model: 'ACS-3000', 
        serialNumber: 'ACS-3000-N1',
        installationDate: new Date('2022-03-20')
      },
      { 
        name: 'Pallet Shuttle System', 
        model: 'PSS-4500', 
        serialNumber: 'PSS-4500-N1',
        installationDate: new Date('2022-06-10')
      }
    ]
  },
  {
    companyName: 'Global Logistics Ltd',
    location: 'South City',
    department: 'Logistics',
    registrationDate: new Date('2019-05-20'),
    industry: 'Logistics',
    website: 'https://south.globallogistics.com',
    address: '456 Logistics Park, South City',
    city: 'South City',
    state: 'South State',
    country: 'India',
    pincode: '400002',
    zoneName: 'South',
    isActive: true,
    contacts: [
      { contactPersonName: 'Mike Johnson', contactNumber: '+911234567891', email: 'south@globallogistics.com' },
      { contactPersonName: 'Emily Chen', contactNumber: '+919876543211', email: 'emily@globallogistics.com' }
    ],
    assets: [
      { 
        name: 'Forklift', 
        model: 'FL-3000', 
        serialNumber: 'FL-3000-S1',
        installationDate: new Date('2021-11-10')
      },
      { 
        name: 'Reach Truck', 
        model: 'RT-2500', 
        serialNumber: 'RT-2500-S1',
        installationDate: new Date('2021-10-05')
      }
    ]
  },
  {
    companyName: 'Eastern Enterprises',
    location: 'East City',
    department: 'Manufacturing',
    registrationDate: new Date('2018-08-10'),
    industry: 'Manufacturing',
    website: 'https://easternent.com',
    address: '789 Industrial Area, East City',
    city: 'East City',
    state: 'East State',
    country: 'India',
    pincode: '700001',
    zoneName: 'East', // East
    contacts: [
      { contactPersonName: 'Robert Johnson', contactNumber: '+911234567892', email: 'east@easternent.com' }
    ],
    assets: [
      { 
        name: 'Automated Storage System', 
        type: 'ASRS', 
        model: 'AS-6000', 
        serialNumber: 'AS-6000-E1',
        status: 'ACTIVE',
        installationDate: new Date('2022-03-15'),
        lastMaintenanceDate: new Date('2023-09-15')
      },
      { 
        name: 'Order Picking System', 
        type: 'Picking', 
        model: 'OP-1000', 
        serialNumber: 'OP-1000-E1',
        status: 'ACTIVE',
        installationDate: new Date('2022-04-20'),
        lastMaintenanceDate: new Date('2023-10-20')
      }
    ]
  },
  {
    companyName: 'Western Manufacturing Co.',
    location: 'West City',
    department: 'Production',
    registrationDate: new Date('2017-11-25'),
    industry: 'Manufacturing',
    website: 'https://westmfg.com',
    address: '101 Factory Zone, West City',
    city: 'West City',
    state: 'West State',
    country: 'India',
    pincode: '500001',
    zoneName: 'West', // West
    contacts: [
      { contactPersonName: 'Sarah Williams', contactNumber: '+911234567893', email: 'west@westmfg.com' }
    ],
    assets: [
      { 
        name: 'Automated Guided Vehicle', 
        type: 'AGV', 
        model: 'AGV-7000', 
        serialNumber: 'AGV-7000-W1',
        status: 'ACTIVE',
        installationDate: new Date('2021-09-12'),
        lastMaintenanceDate: new Date('2023-03-12')
      },
      { 
        name: 'Conveyor System', 
        type: 'Conveyance', 
        model: 'CS-2500', 
        serialNumber: 'CS-2500-W1',
        status: 'ACTIVE',
        installationDate: new Date('2021-08-05'),
        lastMaintenanceDate: new Date('2023-02-05')
      }
    ]
  }
];

async function createDummyData() {
  try {
    console.log('Starting to create dummy customers and assets...');

    // Get admin user (assuming it exists)
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@kardex.com' },
      select: { id: true }
    });

    if (!adminUser) {
      throw new Error('Admin user not found. Please create an admin user first.');
    }
    
    // Get all existing zones for mapping
    const zones = await prisma.serviceZone.findMany();
    const zoneMap = {};
    zones.forEach(zone => {
      zoneMap[zone.name] = zone.id;
    });

    for (const customerInfo of customers) {
      const { assets, contacts, ...customerData } = customerInfo;
      
      // Check if customer already exists
      const existingCustomer = await prisma.customer.findFirst({
        where: { companyName: customerData.companyName },
        include: { 
          assets: true,
          zone: true
        }
      });

      if (!existingCustomer) {
        console.log(`Customer '${customerData.companyName}' not found. Please create the customer first.`);
        continue;
      }
      
      console.log(`Checking assets for customer: ${existingCustomer.companyName} (ID: ${existingCustomer.id})`);
      
      // Create assets that don't exist yet
      for (const asset of assets) {
        const existingAsset = existingCustomer.assets.find(a => 
          a.assetName === asset.name && 
          a.machineSerialNumber === asset.serialNumber
        );
        
        if (!existingAsset) {
          console.log(`  Adding asset: ${asset.name} (${asset.model})`);
          await prisma.asset.create({
            data: {
              assetName: asset.name,
              model: asset.model,
              machineSerialNumber: asset.serialNumber,
              installationDate: asset.installationDate,
              customerId: existingCustomer.id,
              location: existingCustomer.location,
              isActive: true
            }
          });
          console.log(`   - Added asset: ${asset.name} (${asset.model})`);
        } else {
          console.log(`   - Asset already exists: ${asset.name} (${asset.model})`);
        }
      }

      // Get zone ID from zone name
      const zoneId = zoneMap[customerInfo.zoneName];
      if (!zoneId) {
        console.error(`❌ Zone '${customerInfo.zoneName}' not found`);
        continue;
      }

      // Skip customer creation, we're only adding missing assets now
    }

    console.log('\n✅ All dummy data has been created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating dummy data:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

createDummyData();
