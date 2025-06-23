#!/usr/bin/env node

/**
 * Build the actual working React app instead of fake splash screen
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Building real Disney Pin Authenticator React app...');

try {
  // Build the actual React app using Vite
  process.chdir('client');
  
  console.log('Running Vite build...');
  execSync('npx vite build --outDir dist', { stdio: 'inherit' });
  
  console.log('✅ Real React app built successfully');
  
  // Check if build succeeded
  const distPath = path.join(process.cwd(), 'dist');
  const indexPath = path.join(distPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    console.log('Build verification:');
    console.log('- Contains React:', content.includes('react'));
    console.log('- Contains main.tsx:', content.includes('main'));
    console.log('- Build size:', fs.statSync(indexPath).size, 'bytes');
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}