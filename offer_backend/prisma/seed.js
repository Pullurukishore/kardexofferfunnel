const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

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

async function readExcelData() {
  log('Reading Excel data...');
  
  const excelPath = path.join(__dirname, '..', 'data', 'Repaired_2025_Zonewise_Open_Closed_Offer funnel_ on 04032025.xlsx');
  
  if (!fs.existsSync(excelPath)) {
    throw new Error(`Excel file not found: ${excelPath}`);
  }
  
  const workbook = XLSX.readFile(excelPath);
  const allData = {};
  
  // Read all sheets
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    allData[sheetName] = jsonData;
    log(`Read ${jsonData.length} rows from sheet: ${sheetName}`);
  });
  
  return allData;
}

async function seedCustomers(excelData) {
  log('Seeding customers...');
  
  // Get customer data from Customer sheet or extract from offers
  let customerData = [];
  
  if (excelData['Customer'] && excelData['Customer'].length > 0) {
    customerData = excelData['Customer'];
  } else {
    // Extract unique customers from all offer sheets
    const offerSheets = ['Yogesh', 'Ashraf', 'Rahul', 'Minesh', 'Gajendra', 'Pradeep', 'Sasi', 'Vinay', 'Nitin', 'Pankaj'];
    const customerMap = new Map();
    
    offerSheets.forEach(sheetName => {
      if (excelData[sheetName]) {
        excelData[sheetName].forEach(row => {
          const companyName = row['Name of the Customer'] || row['companyName'];
          if (companyName && !customerMap.has(companyName)) {
            customerMap.set(companyName, {
              companyName: companyName,
              location: row['Place'] || row['location'] || '',
              department: row['Department'] || row['department'] || '',
              zone: row['Zone'] || row['zone'] || 'WEST'
            });
          }
        });
      }
    });
    
    customerData = Array.from(customerMap.values());
  }
  
  const zones = await prisma.serviceZone.findMany();
  const zoneMap = new Map(zones.map(z => [z.name, z.id]));
  
  for (const data of customerData) {
    if (!data.companyName || data.companyName.trim() === '') {
      continue; // Skip records with empty company names
    }
    
    const zoneId = zoneMap.get(data.zone) || zoneMap.get('WEST');
    
    const existingCustomer = await prisma.customer.findFirst({
      where: { companyName: data.companyName }
    });
    
    if (!existingCustomer) {
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });
      
      await prisma.customer.create({
        data: {
          companyName: data.companyName,
          location: data.location || null,
          department: data.department || null,
          zoneId: zoneId,
          createdById: adminUser?.id || 1,
          updatedById: adminUser?.id || 1
        }
      });
      
      stats.customers++;
      log(`Created customer: ${data.companyName}`, 'success');
    } else {
      log(`Customer already exists: ${data.companyName}`, 'info');
    }
  }
  
  log(`Processed ${stats.customers} customers`, 'success');
}

async function seedOffers(excelData) {
  log('Seeding offers...');
  
  const zones = await prisma.serviceZone.findMany();
  const users = await prisma.user.findMany();
  const customers = await prisma.customer.findMany();
  
  const zoneMap = new Map(zones.map(z => [z.name, z.id]));
  const userMap = new Map(users.map(u => [u.name, u.id]));
  const customerMap = new Map(customers.map(c => [c.companyName, c.id]));
  
  // Process each user's offer sheet
  const userSheets = ['Yogesh', 'Ashraf', 'Rahul', 'Minesh', 'Gajendra', 'Pradeep', 'Sasi', 'Vinay', 'Nitin', 'Pankaj'];
  
  for (const sheetName of userSheets) {
    if (!excelData[sheetName]) continue;
    
    log(`Processing offers for ${sheetName}...`);
    
    for (const row of excelData[sheetName]) {
      try {
        const companyName = row['Name of the Customer'] || row['companyName'];
        if (!companyName) continue;
        
        const customerId = customerMap.get(companyName);
        if (!customerId) {
          stats.errors.push(`Customer not found: ${companyName}`);
          continue;
        }
        
        const userId = userMap.get(sheetName);
        if (!userId) {
          stats.errors.push(`User not found: ${sheetName}`);
          continue;
        }
        
        const zoneName = row['Zone'] || row['zone'] || 'WEST';
        const zoneId = zoneMap.get(zoneName);
        if (!zoneId) {
          stats.errors.push(`Zone not found: ${zoneName}`);
          continue;
        }
        
        // Create contact
        const contact = await prisma.contact.create({
          data: {
            customerId: customerId,
            contactPersonName: row['Contact Person'] || row['contactPerson'] || '',
            contactNumber: row['Contact Number'] || row['contactNumber'] ? row['contactNumber'].toString() : '',
            email: row['Email'] || row['email'] || '',
            isPrimary: true,
            isActive: true
          }
        });
        stats.contacts++;
        
        // Create asset
        const serialNumber = row['Serial Number'] || row['machineSerialNumber'];
        let assetId = null;
        
        if (serialNumber) {
          const asset = await prisma.asset.create({
            data: {
              customerId: customerId,
              assetName: `Asset ${serialNumber}`,
              machineSerialNumber: serialNumber.toString(),
              model: row['Department'] || row['department'] || 'Not Specified',
              isActive: true
            }
          });
          assetId = asset.id;
          stats.assets++;
        }
        
        // Create offer
        const productType = normalizeProductType(row['Product Type'] || row['productType']);
        const offerValue = parseFloat(row['Offer Value'] || row['offerValue'] || 0);
        const probability = parseFloat(row['Probability'] || row['probability'] || 0);
        
        const offer = await prisma.offer.create({
          data: {
            offerReferenceNumber: row['Offer Reference Number'] || row['offerReferenceNumber'] || `OF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            offerReferenceDate: new Date(),
            title: `${companyName} - ${productType}`,
            description: row['Remarks'] || row['remarks'] || `Offer for ${productType}`,
            productType: productType,
            lead: row['Lead'] || row['lead'] || 'NEW',
            
            registrationDate: new Date(),
            company: companyName,
            location: row['Place'] || row['location'] || '',
            department: row['Department'] || row['department'] || '',
            contactPersonName: row['Contact Person'] || row['contactPerson'] || '',
            contactNumber: row['Contact Number'] || row['contactNumber'] ? row['contactNumber'].toString() : '',
            email: row['Email'] || row['email'] || '',
            machineSerialNumber: serialNumber ? serialNumber.toString() : '',
            
            status: 'OPEN',
            stage: 'INITIAL',
            priority: 'MEDIUM',
            
            customerId: customerId,
            contactId: contact.id,
            userId: userId,
            zoneId: zoneId,
            assetId: assetId,
            
            offerValue: offerValue,
            probability: probability,
            orderValue: parseFloat(row['Order Value'] || row['orderValue'] || 0),
            remarks: row['Remarks'] || row['remarks'] || '',
            
            offerMonth: convertMonthToYYYYMM(row['Month'] || row['month']),
            poExpectedMonth: convertMonthToYYYYMM(row['Expected Month'] || row['expectedMonth']),
            expectedPoMonth: convertMonthToYYYYMM(row['Expected PO Month'] || row['expectedPoMonth']),
            
            createdById: userId,
            updatedById: userId
          }
        });
        
        stats.offers++;
        
      } catch (error) {
        stats.errors.push(`Failed to create offer for ${sheetName}: ${error.message}`);
        log(`Error creating offer: ${error.message}`, 'error');
      }
    }
  }
  
  log(`Created ${stats.offers} offers`, 'success');
}

async function main() {
  try {
    log('Starting database seeding...\n');
    
    // Step 1: Seed zones
    await seedZones();
    
    // Step 2: Seed users
    await seedUsers();
    
    // Step 3: Read Excel data
    const excelData = await readExcelData();
    
    // Step 4: Seed customers
    await seedCustomers(excelData);
    
    // Step 5: Seed offers
    await seedOffers(excelData);
    
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
