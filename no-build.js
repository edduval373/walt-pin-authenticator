#!/usr/bin/env node

/**
 * Disney Pin Authenticator build script for Railway deployment
 * Builds the complete application without Vite complications
 */

import { execSync } from 'child_process';

console.log('Building Disney Pin Authenticator for Railway...');

try {
  // Build the complete Disney Pin Authenticator React app
  execSync('node build-production.js', { stdio: 'inherit' });
  
  console.log('✅ Disney Pin Authenticator build completed successfully');
  console.log('🚀 Ready for Railway deployment with complete three-screen flow');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}