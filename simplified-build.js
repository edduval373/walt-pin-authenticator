/**
 * Simplified build script for Disney Pin Authenticator
 * No complex TypeScript compilation - just static files
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Building Disney Pin Authenticator...');

// Ensure client/dist exists
if (!fs.existsSync('client/dist')) {
  fs.mkdirSync('client/dist', { recursive: true });
}

// Run the existing production build
const { execSync } = require('child_process');

try {
  execSync('node production-build.cjs', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}