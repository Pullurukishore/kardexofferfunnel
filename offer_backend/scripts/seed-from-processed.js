const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Statistics tracking
const stats = {
  zones: 0,
  users: 0,
  customers: 0,
  contacts: 0,
  assets: 0,
  offers: 0,
  errors: []
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '[INFO]',
    success: '[SUCCESS]',
    warn: '[WARN]',
    error: '[ERROR]'
  }[type] || '[INFO]';
  
  console.log(`${timestamp} ${prefix} ${message}`);
}

// Product type normalization
const PRODUCT_TYPE_MAP = {
  "RELOCATION": "RELOCATION",
  "Relocation": "RELOCATION",
  "CONTRACT": "CONTRACT", 
  "Contract": "CONTRACT",
  "Ccontarct": "CONTRACT",
  "Contarct": "CONTRACT",
  "SPP": "SPP",
  "spp": "SPP",
  "MLU": "MIDLIFE_UPGRADE",
  "Midlife Upgrade": "MIDLIFE_UPGRADE",
  "RETROFIT": "RETROFIT_KIT",
  "Retrofit kit": "RETROFIT_KIT",
  "Upgrade": "UPGRADE_KIT",
  "Upgrade kit": "UPGRADE_KIT",
  "BD Charges": "BD_CHARGES",
  "BD Spare": "BD_SPARE"
};

function normalizeProductType(excelProductType) {
  if (!excelProductType) return null;
  const normalized = PRODUCT_TYPE_MAP[excelProductType.trim()];
  return normalized || "OTHER";
}

function convertMonthToYYYYMM(monthName) {
  if (!monthName) return null;
  
  // Handle if monthName is already in YYYY-MM format
  if (typeof monthName === 'string' && monthName.includes('-')) {
    return monthName;
  }
  
  // Handle if monthName is a number or other format
  if (typeof monthName !== 'string') {
    return null;
  }
  
  const monthMap = {
    'january': '2025-01', 'jan': '2025-01',
    'february': '2025-02', 'feb': '2025-02',
    'march': '2025-03', 'mar': '2025-03',
    'april': '2025-04', 'apr': '2025-04',
    'may': '2025-05',
    'june': '2025-06', 'jun': '2025-06',
    'july': '2025-07', 'jul': '2025-07',
    'august': '2025-08', 'aug': '2025-08',
    'september': '2025-09', 'sep': '2025-09', 'sept': '2025-09',
    'october': '2025-10', 'oct': '2025-10',
    'november': '2025-11', 'nov': '2025-11',
    'december': '2025-12', 'dec': '2025-12'
  };
  
  const normalized = monthName.toLowerCase().trim();
  return monthMap[normalized] || null;
}

async function seedZones() {
  log('Seeding zones...');
  
  const zones = [
    { name: 'WEST', shortForm: 'W', description: 'West Zone' },
    { name: 'SOUTH', shortForm: 'S', description: 'South Zone' },
    { name: 'NORTH', shortForm: 'N', description: 'North Zone' },
    { name: 'EAST', shortForm: 'E', description: 'East Zone' }
  ];
  
  for (const zone of zones) {
    const existingZone = await prisma.serviceZone.findFirst({
      where: { name: zone.name }
    });
    
    if (!existingZone) {
      await prisma.serviceZone.create({
        data: zone
      });
      stats.zones++;
      log(`Created zone: ${zone.name}`, 'success');
    } else {
      log(`Zone already exists: ${zone.name}`, 'info');
    }
  }
  
  log(`Processed ${stats.zones} zones`, 'success');
}

async function seedUsers() {
  log('Seeding users...');
  
  const zones = await prisma.serviceZone.findMany();
  const zoneMap = new Map(zones.map(z => [z.name, z.id]));
  
  const users = [
    { name: 'Yogesh', email: 'yogesh@example.com', role: 'ZONE_USER', zone: 'WEST', shortForm: 'YOG' },
    { name: 'Ashraf', email: 'ashraf@example.com', role: 'ZONE_USER', zone: 'WEST', shortForm: 'ASH' },
    { name: 'Rahul', email: 'rahul@example.com', role: 'ZONE_USER', zone: 'WEST', shortForm: 'RAH' },
    { name: 'Minesh', email: 'minesh@example.com', role: 'ZONE_USER', zone: 'WEST', shortForm: 'MIN' },
    { name: 'Gajendra', email: 'gajendra@example.com', role: 'ZONE_USER', zone: 'WEST', shortForm: 'GAJ' },
    { name: 'Pradeep', email: 'pradeep@example.com', role: 'ZONE_USER', zone: 'WEST', shortForm: 'PRA' },
    { name: 'Sasi', email: 'sasi@example.com', role: 'ZONE_USER', zone: 'WEST', shortForm: 'SAS' },
    { name: 'Vinay', email: 'vinay@example.com', role: 'ZONE_USER', zone: 'WEST', shortForm: 'VIN' },
    { name: 'Nitin', email: 'nitin@example.com', role: 'ZONE_USER', zone: 'WEST', shortForm: 'NIT' },
    { name: 'Pankaj', email: 'pankaj@example.com', role: 'ZONE_USER', zone: 'WEST', shortForm: 'PAN' },
    { name: 'Admin', email: 'admin@example.com', role: 'ADMIN', zone: 'WEST', shortForm: 'ADM' }
  ];
  
  for (const userData of users) {
    const zoneId = zoneMap.get(userData.zone);
    if (!zoneId) {
      log(`Zone not found for user: ${userData.name}`, 'warn');
      continue;
    }
    
    const existingUser = await prisma.user.findFirst({
      where: { email: userData.email }
    });
    
    if (!existingUser) {
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          role: userData.role,
          password: 'password123', // Default password
          tokenVersion: Math.random().toString(36)
        }
      });
      
      // Create zone assignment
      await prisma.servicePersonZone.create({
        data: { userId: user.id, serviceZoneId: zoneId }
      });
      
      stats.users++;
      log(`Created user: ${userData.name}`, 'success');
    } else {
      log(`User already exists: ${userData.name}`, 'info');
    }
  }
  
  log(`Processed ${stats.users} users`, 'success');
}

async function seedCustomersFromProcessed() {
  log('Seeding customers from processed data...');
  
  const customersPath = path.join(__dirname, '..', 'data', 'processed', 'customers.json');
  
  if (!fs.existsSync(customersPath)) {
    log('Customers file not found, skipping customer seeding', 'warn');
    return;
  }
  
  const customersData = JSON.parse(fs.readFileSync(customersPath, 'utf8'));
  
  const zones = await prisma.serviceZone.findMany();
  const zoneMap = new Map(zones.map(z => [z.name, z.id]));
  
  for (const customerData of customersData) {
    if (!customerData.companyName || customerData.companyName.trim() === '') {
      continue; // Skip records with empty company names
    }
    
    const zoneId = zoneMap.get(customerData.zone) || zoneMap.get('WEST');
    
    const existingCustomer = await prisma.customer.findFirst({
      where: { companyName: customerData.companyName }
    });
    
    if (!existingCustomer) {
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });
      
      await prisma.customer.create({
        data: {
          companyName: customerData.companyName,
          location: customerData.location || null,
          department: customerData.department || null,
          zoneId: zoneId,
          createdById: adminUser?.id || 1,
          updatedById: adminUser?.id || 1
        }
      });
      
      stats.customers++;
      log(`Created customer: ${customerData.companyName}`, 'success');
    } else {
      log(`Customer already exists: ${customerData.companyName}`, 'info');
    }
  }
  
  log(`Processed ${stats.customers} customers`, 'success');
}

async function seedOffersFromProcessed() {
  log('Seeding offers from processed data...');
  
  const offersPath = path.join(__dirname, '..', 'data', 'processed', 'all-offers.json');
  
  if (!fs.existsSync(offersPath)) {
    log('Offers file not found, skipping offer seeding', 'warn');
    return;
  }
  
  const offersData = JSON.parse(fs.readFileSync(offersPath, 'utf8'));
  
  const zones = await prisma.serviceZone.findMany();
  const users = await prisma.user.findMany();
  const customers = await prisma.customer.findMany();
  
  const zoneMap = new Map(zones.map(z => [z.name, z.id]));
  const userMap = new Map(users.map(u => [u.name, u.id]));
  const customerMap = new Map(customers.map(c => [c.companyName, c.id]));
  
  for (const offerData of offersData) {
    try {
      const companyName = offerData.companyName;
      if (!companyName) {
        stats.errors.push(`Offer missing company name: ${offerData.id}`);
        continue;
      }
      
      const customerId = customerMap.get(companyName);
      if (!customerId) {
        stats.errors.push(`Customer not found: ${companyName}`);
        continue;
      }
      
      const userId = userMap.get(offerData.assignedUser);
      if (!userId) {
        stats.errors.push(`User not found: ${offerData.assignedUser}`);
        continue;
      }
      
      const zoneName = offerData.zone || 'WEST';
      const zoneId = zoneMap.get(zoneName);
      if (!zoneId) {
        stats.errors.push(`Zone not found: ${zoneName}`);
        continue;
      }
      
      // Create contact
      let contactId;
      if (offerData.contactPerson && offerData.contactNumber) {
        const existingContact = await prisma.contact.findFirst({
          where: {
            customerId: customerId,
            contactPersonName: offerData.contactPerson.trim(),
            isActive: true
          }
        });
        
        if (existingContact) {
          contactId = existingContact.id;
        } else {
          const newContact = await prisma.contact.create({
            data: {
              customerId: customerId,
              contactPersonName: offerData.contactPerson.trim(),
              contactNumber: offerData.contactNumber ? offerData.contactNumber.toString().trim() : null,
              email: offerData.email ? offerData.email.trim() : null,
              isPrimary: true,
              isActive: true
            }
          });
          contactId = newContact.id;
        }
        stats.contacts++;
      } else {
        // Create a dummy contact if none exists
        const dummyContact = await prisma.contact.findFirst({
          where: {
            customerId: customerId,
            contactPersonName: 'Default Contact',
            isActive: true
          }
        });
        
        if (dummyContact) {
          contactId = dummyContact.id;
        } else {
          const newDummyContact = await prisma.contact.create({
            data: {
              customerId: customerId,
              contactPersonName: 'Default Contact',
              contactNumber: null,
              email: null,
              isPrimary: true,
              isActive: true
            }
          });
          contactId = newDummyContact.id;
        }
      }
      
      // Create asset
      let assetId;
      if (offerData.machineSerialNumber) {
        const existingAsset = await prisma.asset.findFirst({
          where: {
            customerId: customerId,
            machineSerialNumber: offerData.machineSerialNumber.trim(),
            isActive: true
          }
        });
        
        if (existingAsset) {
          assetId = existingAsset.id;
        } else {
          const newAsset = await prisma.asset.create({
            data: {
              customerId: customerId,
              assetName: `Asset ${offerData.machineSerialNumber}`,
              machineSerialNumber: offerData.machineSerialNumber.trim(),
              model: offerData.department || 'Not Specified',
              isActive: true
            }
          });
          assetId = newAsset.id;
        }
        stats.assets++;
      }
      
      // Create offer
      const productType = normalizeProductType(offerData.productType);
      const offerValue = parseFloat(offerData.offerValue || 0);
      const probability = parseFloat(offerData.probability || 0);
      
      const offer = await prisma.offer.create({
        data: {
          offerReferenceNumber: offerData.offerReferenceNumber || `OF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          offerReferenceDate: new Date(),
          title: `${companyName} - ${productType}`,
          description: (offerData.remarks && typeof offerData.remarks === 'string') ? offerData.remarks : `Offer for ${productType}`,
          productType: productType,
          lead: 'YES',
          
          registrationDate: new Date(),
          company: companyName,
          location: offerData.location || '',
          department: offerData.department || '',
          contactPersonName: offerData.contactPerson || '',
          contactNumber: offerData.contactNumber ? offerData.contactNumber.toString() : '',
          email: offerData.email || '',
          machineSerialNumber: offerData.machineSerialNumber ? offerData.machineSerialNumber.toString() : '',
          
          status: 'OPEN',
          stage: 'INITIAL',
          priority: 'MEDIUM',
          
          customer: { connect: { id: customerId } },
          contact: { connect: { id: contactId } },
          assignedTo: { connect: { id: userId } },
          zone: { connect: { id: zoneId } },
          
          offerValue: offerValue,
          probabilityPercentage: isNaN(probability) ? null : Math.round(probability),
          poValue: parseFloat(offerData.orderValue || 0),
          remarks: (offerData.remarks && typeof offerData.remarks === 'string') ? offerData.remarks : '',
          
          offerMonth: convertMonthToYYYYMM(offerData.month),
          poExpectedMonth: convertMonthToYYYYMM(offerData.expectedMonth),
          
          createdBy: { connect: { id: userId } },
          updatedBy: { connect: { id: userId } }
        }
      });
      
      // Create asset relationship if asset exists
      if (assetId) {
        await prisma.offerAsset.create({
          data: {
            offerId: offer.id,
            assetId: assetId
          }
        });
      }
      
      stats.offers++;
      log(`Created offer: ${offer.offerReferenceNumber} (${companyName})`, 'success');
      
    } catch (error) {
      stats.errors.push(`Failed to create offer: ${error.message}`);
      log(`Error creating offer: ${error.message}`, 'error');
    }
  }
  
  log(`Created ${stats.offers} offers`, 'success');
}

async function main() {
  try {
    log('Starting database seeding from processed data...\n');
    
    // Step 1: Seed zones
    await seedZones();
    
    // Step 2: Seed users
    await seedUsers();
    
    // Step 3: Seed customers from processed data
    await seedCustomersFromProcessed();
    
    // Step 4: Seed offers from processed data
    await seedOffersFromProcessed();
    
    // Print statistics
    log('\n=== SEEDING COMPLETE ===', 'success');
    log(`Zones created: ${stats.zones}`);
    log(`Users created: ${stats.users}`);
    log(`Customers created: ${stats.customers}`);
    log(`Contacts created: ${stats.contacts}`);
    log(`Assets created: ${stats.assets}`);
    log(`Offers created: ${stats.offers}`);
    
    if (stats.errors.length > 0) {
      log('\nErrors encountered:', 'warn');
      stats.errors.slice(0, 10).forEach(error => log(`- ${error}`, 'warn'));
      if (stats.errors.length > 10) {
        log(`... and ${stats.errors.length - 10} more errors`, 'warn');
      }
    }
    
    log('\n✅ Database is ready with Excel data!', 'success');
    
  } catch (error) {
    log(`Seeding failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    log('Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    log('Seeding failed!');
    console.error(error);
    process.exit(1);
  });
