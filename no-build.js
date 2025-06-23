#!/usr/bin/env node

/**
 * Disney Pin Authenticator build script for Railway deployment
 * Builds the actual working React app from restored June backup
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Building working React app for Railway deployment...');

try {
  // Change to client directory and build with Vite
  process.chdir('client');
  
  // Build the actual React application
  console.log('Building React app with Vite...');
  execSync('npx vite build --outDir ../client/dist --emptyOutDir', { stdio: 'inherit' });
  
  // Return to root directory
  process.chdir('..');
  
  // Verify the build was successful
  const distDir = path.join(process.cwd(), 'client', 'dist');
  const indexPath = path.join(distDir, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    console.log('✅ Working React app built successfully');
    console.log(`📁 Built files in: ${distDir}`);
    
    // Verify it's the real React app, not fake splash
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    if (indexContent.includes('Disney Pin Authenticator') && indexContent.includes('script')) {
      console.log('✅ Confirmed: Real React app build (not fake splash screen)');
    } else {
      console.log('⚠️  Warning: Build may not contain the full React app');
    }
  } else {
    throw new Error('Build failed - index.html not found');
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}