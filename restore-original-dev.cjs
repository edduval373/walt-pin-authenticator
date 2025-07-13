/**
 * Restore the original working development server configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔄 Restoring original working development server...');

// Kill any existing server processes
try {
  execSync('pkill -f "node server.js"', { stdio: 'ignore' });
  console.log('Stopped static server');
} catch (e) {
  // Ignore if no process found
}

// Restore original package.json dev script
const packagePath = 'package.json';
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Restore original dev script
pkg.scripts.dev = 'NODE_ENV=development tsx server/index.ts';

// Keep the production build scripts for Railway
pkg.scripts.build = 'node production-build.cjs';
pkg.scripts.start = 'node server.js';

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
console.log('✅ Restored original development configuration');

// Start the original development server
console.log('🚀 Starting original development server on port 5000...');
try {
  execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to start development server:', error.message);
  process.exit(1);
}