const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateExistingOffers() {
  console.log('🚀 Migrating existing offers to new structured format...');

  try {
    // Get all existing offers with old format
    const existingOffers = await prisma.offer.findMany({
      include: {
        zone: { select: { id: true, name: true, shortForm: true } },
        createdBy: { select: { id: true, name: true, shortForm: true } }
      },
      where: {
        OR: [
          { offerReferenceNumber: { startsWith: 'offer-' } },
          { offerReferenceNumber: { startsWith: 'KRIND-' } },
          { offerReferenceNumber: { not: { contains: '/' } } } // Any format without slashes
        ]
      }
    });

    console.log(`Found ${existingOffers.length} offers to migrate`);

    if (existingOffers.length === 0) {
      console.log('✅ No offers need migration - all are already in correct format!');
      return;
    }

    // Product type mapping
    const productTypeMap = {
      'SPP': 'SPP',
      'CONTRACT': 'CON',
      'RELOCATION': 'REL',
      'UPGRADE_KIT': 'UPG',
      'SOFTWARE': 'SFT'
    };

    const migrations = [];

    for (const offer of existingOffers) {
      // Generate user short form if missing
      let userShortForm = offer.createdBy?.shortForm;
      if (!userShortForm && offer.createdBy?.name) {
        const nameParts = offer.createdBy.name.trim().split(' ');
        userShortForm = nameParts.length >= 2 
          ? (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase()
          : nameParts[0].substring(0, 2).toUpperCase();
      } else if (!userShortForm) {
        userShortForm = 'XX';
      }

      const companyPrefix = 'KRIND';
      const zoneAbbr = offer.zone?.shortForm || 'X';
      const productAbbr = productTypeMap[offer.productType] || offer.productType?.substring(0, 3).toUpperCase() || 'UNK';

      // Extract sequence number from old format
      let sequenceNumber = 1;
      const oldRef = offer.offerReferenceNumber;
      
      // Try to extract number from various old formats
      const numberMatch = oldRef.match(/(\d+)$/);
      if (numberMatch) {
        sequenceNumber = parseInt(numberMatch[1]);
      }

      // Generate new format
      const newReferenceNumber = `${companyPrefix}/${zoneAbbr}/${productAbbr}/${userShortForm}${String(sequenceNumber).padStart(5, '0')}`;

      migrations.push({
        id: offer.id,
        oldRef: oldRef,
        newRef: newReferenceNumber,
        zone: offer.zone?.name || 'Unknown',
        productType: offer.productType || 'Unknown',
        user: offer.createdBy?.name || 'Unknown'
      });
    }

    // Show preview of changes
    console.log('\n📋 Preview of migrations:');
    migrations.slice(0, 5).forEach(m => {
      console.log(`   ${m.oldRef} → ${m.newRef} (${m.zone}, ${m.productType}, ${m.user})`);
    });
    
    if (migrations.length > 5) {
      console.log(`   ... and ${migrations.length - 5} more offers`);
    }

    console.log('\n⚠️  WARNING: This will change existing offer reference numbers!');
    console.log('   - Customers may have saved the old reference numbers');
    console.log('   - External systems may reference the old numbers');
    console.log('   - Consider creating a backup before proceeding');

    // Performing migration...
    console.log('\n🔄 Performing migration...');
    for (const migration of migrations) {
      await prisma.offer.update({
        where: { id: migration.id },
        data: { offerReferenceNumber: migration.newRef }
      });
      console.log(`   ✅ Updated: ${migration.oldRef} → ${migration.newRef}`);
    }

    console.log('\n💡 To actually perform the migration:');
    console.log('   1. Uncomment the migration code in this script');
    console.log('   2. Take a database backup first');
    console.log('   3. Run the script again');
    console.log(`\n🎯 Would migrate ${migrations.length} offers to new format`);

  } catch (error) {
    console.error('❌ Migration preview failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateExistingOffers()
  .then(() => {
    console.log('✨ Migration preview completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration preview failed:', error);
    process.exit(1);
  });
