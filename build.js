#!/usr/bin/env node

/**
 * Railway-compatible build script
 * Uses the complete build with legal section and acknowledge button
 */

import { execSync } from 'child_process';

console.log('Building Disney Pin Authenticator for Railway deployment...');

try {
  // Use the complete build script that includes legal section
  execSync('node create-complete-build.js', { stdio: 'inherit' });
  console.log('✅ Railway deployment build completed successfully');
  console.log('🚀 Ready for deployment with complete IntroPage and legal section');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}