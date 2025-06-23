#!/usr/bin/env node

/**
 * Build the working React app from June backup
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Building working React app from June backup...');

try {
  // Build using Vite with the working React components
  process.chdir('client');
  
  // Use the working build configuration from backup
  execSync('npx vite build --outDir ../dist/public --emptyOutDir', { stdio: 'inherit' });
  
  // Copy build files to deployment location
  process.chdir('..');
  
  if (fs.existsSync('dist/public')) {
    execSync('cp -r dist/public/* client/dist/', { stdio: 'inherit' });
    console.log('✅ Working React app built and deployed successfully');
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}