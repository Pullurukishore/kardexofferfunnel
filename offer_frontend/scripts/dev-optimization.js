// Development optimization script
// Run this before starting dev server for faster builds

const fs = require('fs');
const path = require('path');

// Create .next/cache directory if it doesn't exist
const cacheDir = path.join(process.cwd(), '.next', 'cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log('✅ Created cache directory');
}

// Set environment variables for faster development
process.env.NODE_ENV = 'development';
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NEXT_DISABLE_SOURCEMAPS = 'true';

console.log('🚀 Development optimizations applied');
console.log('💡 Tips for faster development:');
console.log('   - Keep dev server running (avoid restarts)');
console.log('   - Use production build: npm run build && npm run dev');
console.log('   - Close unused browser tabs');
console.log('   - Use modern browser with good caching');
