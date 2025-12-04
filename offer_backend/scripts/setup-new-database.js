const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== NEW DATABASE SETUP ===\n');

function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} - Complete`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} - Failed:`, error.message);
    throw error;
  }
}

async function setupNewDatabase() {
  try {
    console.log('Setting up new database from scratch...\n');
    
    // Step 1: Generate Prisma client
    runCommand('npx prisma generate', 'Generating Prisma client');
    
    // Step 2: Create initial migration
    runCommand('npx prisma migrate dev --name init --create-only', 'Creating initial migration');
    
    // Step 3: Apply migration
    runCommand('npx prisma migrate deploy', 'Applying database migration');
    
    // Step 4: Generate client again
    runCommand('npx prisma generate', 'Regenerating Prisma client');
    
    console.log('\n✅ Database schema created successfully!');
    console.log('Next: Run the seed script to import Excel data.\n');
    
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  setupNewDatabase();
}

module.exports = { setupNewDatabase };
