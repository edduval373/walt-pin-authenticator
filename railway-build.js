/**
 * Railway-specific build script that ensures deployment success
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Building for Railway deployment...');

// Ensure client/dist directory exists
const distDir = path.join(__dirname, 'client', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Build the React app without TypeScript compilation issues
try {
  // Build with Vite using the root-level vite.config.ts
  console.log('Building React app with Vite...');
  execSync('npx vite build --mode production', { stdio: 'inherit' });
  
  console.log('✅ React app built successfully for Railway!');
  
  // Check where the build files actually ended up
  const distPublicPath = path.join(__dirname, 'dist', 'public', 'index.html');
  const clientDistPath = path.join(__dirname, 'client', 'dist', 'index.html');
  
  if (fs.existsSync(distPublicPath)) {
    console.log('✅ Build files found in dist/public');
    // Move files from dist/public to client/dist for Railway
    if (!fs.existsSync(path.join(__dirname, 'client', 'dist'))) {
      fs.mkdirSync(path.join(__dirname, 'client', 'dist'), { recursive: true });
    }
    execSync('cp -r dist/public/* client/dist/', { stdio: 'inherit' });
    console.log('✅ Build files moved to client/dist');
  } else if (fs.existsSync(clientDistPath)) {
    console.log('✅ Build files found in client/dist');
  } else {
    console.error('❌ Build verification failed: index.html missing in both locations');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

console.log('🎉 Railway build completed successfully!');