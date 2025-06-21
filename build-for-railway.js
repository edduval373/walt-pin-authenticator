const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Railway production build...');

try {
  // Clean previous builds
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
    console.log('Cleaned previous dist folder');
  }

  // Install dependencies
  console.log('Installing dependencies...');
  execSync('npm ci --only=production', { stdio: 'inherit' });

  // Build the application
  console.log('Building application...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}