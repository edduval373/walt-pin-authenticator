#!/usr/bin/env node

/**
 * Railway deployment entry point
 * This file ensures the production server starts correctly on Railway
 */

import('./index.js').catch((error) => {
  console.error('Failed to start Disney Pin Authenticator:', error);
  process.exit(1);
});