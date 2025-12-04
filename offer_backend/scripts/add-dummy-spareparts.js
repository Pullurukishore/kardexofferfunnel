const { PrismaClient, SparePartStatus } = require('@prisma/client');
const prisma = new PrismaClient();

// Sample spare parts data
const spareParts = [
  // Hardware Components
  {
    name: 'Conveyor Belt Roller',
    partNumber: 'SPP-CBR-001',
    description: 'Heavy-duty roller for conveyor belt systems',
    category: 'Hardware',
    basePrice: 1250.00,
    specifications: JSON.stringify({
      material: 'Stainless Steel',
      diameter: '50mm',
      length: '300mm',
      loadCapacity: '50kg',
      bearingType: 'Double Sealed'
    })
  },
  {
    name: 'Proximity Sensor',
    partNumber: 'SPP-PS-002',
    description: 'Inductive proximity sensor for object detection',
    category: 'Electronics',
    basePrice: 850.00,
    specifications: JSON.stringify({
      type: 'Inductive',
      sensingRange: '8mm',
      outputType: 'NPN',
      voltage: '10-30V DC',
      protection: 'IP67'
    })
  },
  {
    name: 'Motor Drive Unit',
    partNumber: 'SPP-MDU-003',
    description: 'Variable frequency drive for motor control',
    category: 'Electronics',
    basePrice: 12500.00,
    specifications: JSON.stringify({
      power: '1.5kW',
      inputVoltage: '415V AC',
      outputCurrent: '3.7A',
      frequency: '50/60Hz',
      protection: 'IP20'
    })
  },
  {
    name: 'Control Panel Button Set',
    partNumber: 'SPP-CPB-004',
    description: 'Complete set of control panel buttons with LED indicators',
    category: 'Consumables',
    basePrice: 3200.00,
    specifications: JSON.stringify({
      type: 'Momentary Push Button',
      voltage: '24V DC',
      current: '100mA',
      color: 'Red/Green/Yellow',
      ingressProtection: 'IP65'
    })
  },
  {
    name: 'Industrial Bearing Kit',
    partNumber: 'SPP-IBK-005',
    description: 'Maintenance kit with various industrial bearings',
    category: 'Maintenance Kit',
    basePrice: 7800.00,
    specifications: JSON.stringify({
      contents: '4x Bearings, Grease, Seals',
      bearingType: 'Deep Groove Ball Bearing',
      material: 'Chrome Steel',
      temperatureRange: '-30°C to +120°C',
      speedLimit: '10000 RPM'
    })
  },
  {
    name: 'PLC I/O Module',
    partNumber: 'SPP-PLC-IO-006',
    description: '16-point digital input module for PLC systems',
    category: 'Electronics',
    basePrice: 18500.00,
    specifications: JSON.stringify({
      type: 'Digital Input',
      points: 16,
      inputVoltage: '24V DC',
      isolation: 'Optical',
      responseTime: '1ms'
    })
  },
  {
    name: 'Safety Light Curtain',
    partNumber: 'SPP-SLC-007',
    description: 'Infrared safety light curtain for machine guarding',
    category: 'Safety',
    basePrice: 42500.00,
    specifications: JSON.stringify({
      detectionCapability: '30mm',
      protectiveHeight: '600mm',
      operatingRange: '0.1-7m',
      responseTime: '15ms',
      safetyCategory: 'Type 4'
    })
  },
  {
    name: 'Industrial Ethernet Switch',
    partNumber: 'SPP-IES-008',
    description: 'Managed industrial ethernet switch for harsh environments',
    category: 'Networking',
    basePrice: 28750.00,
    specifications: JSON.stringify({
      ports: '8x 10/100/1000',
      powerInput: '24V DC',
      operatingTemp: '-40°C to +75°C',
      protection: 'IP40',
      protocols: 'STP, RSTP, VLAN'
    })
  }
];

async function addDummySpareParts() {
  try {
    console.log('Starting to add dummy spare parts...');
    
    // Get admin user (assuming it exists)
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@kardex.com' },
      select: { id: true }
    });

    if (!adminUser) {
      throw new Error('Admin user not found. Please create an admin user first.');
    }

    let addedCount = 0;
    let skippedCount = 0;

    // Add each spare part if it doesn't exist
    for (const part of spareParts) {
      try {
        // Check if part with this partNumber already exists
        const existingPart = await prisma.sparePart.findUnique({
          where: { partNumber: part.partNumber }
        });

        if (existingPart) {
          console.log(`Skipping existing part: ${part.partNumber} - ${part.name}`);
          skippedCount++;
          continue;
        }

        // Create the new spare part
        const newPart = await prisma.sparePart.create({
          data: {
            ...part,
            createdById: adminUser.id,
            updatedById: adminUser.id,
            status: SparePartStatus.ACTIVE
          }
        });

        console.log(`✅ Added: ${newPart.partNumber} - ${newPart.name} (₹${newPart.basePrice.toFixed(2)})`);
        addedCount++;
      } catch (error) {
        console.error(`❌ Error adding part ${part.partNumber}:`, error.message);
      }
    }

    console.log(`\n✅ Completed! Added ${addedCount} new spare parts, skipped ${skippedCount} existing ones.`);
    
  } catch (error) {
    console.error('❌ Error in addDummySpareParts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addDummySpareParts();
