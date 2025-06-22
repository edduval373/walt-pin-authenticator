#!/usr/bin/env node

/**
 * Disney Pin Authenticator build script for Railway deployment
 * Uses ES modules compatible build process
 */

import { execSync } from 'child_process';

console.log('Building Disney Pin Authenticator for Railway...');

try {
  // Use the complete build script that includes legal section
  execSync('node create-complete-build.js', { stdio: 'inherit' });
  console.log('✅ Railway deployment build completed successfully');
  console.log('🚀 Ready for deployment with complete IntroPage and legal section');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}