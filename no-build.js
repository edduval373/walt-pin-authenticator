#!/usr/bin/env node

/**
 * Disney Pin Authenticator build script for Railway deployment
 * Builds the complete application without Vite complications
 */

import { execSync } from 'child_process';

console.log('Building Disney Pin Authenticator for Railway...');

try {
  // Apply CSS formatting fix for Disney Pin Authenticator
  execSync('node quick-css-fix.js', { stdio: 'inherit' });
  
  console.log('✅ Disney Pin Authenticator CSS fix applied successfully');
  console.log('🚀 Ready for Railway deployment with proper formatting');
  process.exit(0);
} catch (error) {
  console.error('CSS fix failed:', error.message);
  process.exit(1);
}