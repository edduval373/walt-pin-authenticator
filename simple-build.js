#!/usr/bin/env node

/**
 * Simple build script for Railway deployment
 * Just runs Vite build and trusts the result
 */

import { execSync } from 'child_process';

console.log('Building Disney Pin Authenticator for production...');

try {
  // Run Vite build
  execSync('npx vite build --outDir client/dist --emptyOutDir', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}