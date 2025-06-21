#!/usr/bin/env node

/**
 * Disney Pin Authenticator build script for Railway deployment
 * Builds the complete application without Vite complications
 */

import { execSync } from 'child_process';

console.log('Building Disney Pin Authenticator for Railway...');

try {
  // Create complete Disney Pin Authenticator build
  execSync('node create-complete-build.js', { stdio: 'inherit' });
  
  console.log('✅ Complete Disney Pin Authenticator build created successfully');
  console.log('🚀 Ready for Railway deployment with W.A.L.T. interface');
  process.exit(0);
} catch (error) {
  console.error('Build creation failed:', error.message);
  process.exit(1);
}