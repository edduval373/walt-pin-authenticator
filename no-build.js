#!/usr/bin/env node

/**
 * Disney Pin Authenticator build script for Railway deployment
 * Preserves the exact working React app functionality
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Building working React app for Railway deployment...');

try {
  // Ensure client/dist directory exists
  const distDir = path.join(process.cwd(), 'client', 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Run Vite build
  console.log('Running Vite build...');
  try {
    execSync('npx vite build --outDir client/dist --emptyOutDir', { stdio: 'inherit' });
    console.log('✅ Vite build completed successfully');
  } catch (buildError) {
    console.error('❌ Vite build failed:', buildError.message);
    process.exit(1);
  }
  
  // Verify deployment readiness
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log('✅ Working React app ready for deployment');
    console.log(`📁 Built files in: ${distDir}`);
  } else {
    throw new Error('Build verification failed');
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}