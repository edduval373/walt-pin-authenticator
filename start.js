#!/usr/bin/env node

/**
 * Railway deployment entry point
 * FORCE USE OF CORRECTED PRODUCTION SERVER
 */

console.log('=== RAILWAY START.JS ENTRY POINT ===');
console.log('Loading corrected production server...');

import('./index.js').catch((error) => {
  console.error('Failed to start Disney Pin Authenticator:', error);
  process.exit(1);
});