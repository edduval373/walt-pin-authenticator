
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Disney Pin Authenticator for production...');

// Clean previous build
const distPath = path.join(__dirname, 'client/dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true });
  console.log('✅ Cleaned previous build');
}

// Build the React app
try {
  console.log('📦 Building React application...');
  execSync('cd client && npm run build', { stdio: 'inherit' });
  console.log('✅ React build completed');
} catch (error) {
  console.error('❌ React build failed:', error.message);
  process.exit(1);
}

// Verify build output
if (!fs.existsSync(distPath)) {
  console.error('❌ Build output directory not found');
  process.exit(1);
}

const indexPath = path.join(distPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html not found in build output');
  process.exit(1);
}

console.log('✅ Production build completed successfully');
console.log(`📁 Build output: ${distPath}`);

const files = fs.readdirSync(distPath);
console.log('📄 Build contents:', files);
