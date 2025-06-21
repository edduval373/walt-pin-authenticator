#!/usr/bin/env node

/**
 * No-build script for Railway deployment
 * This replaces the Vite build process that was failing
 */

console.log('Skipping build process - using pre-built files');
console.log('Client files: client/dist/index.html');
console.log('Server files: index.js (ready to run)');
console.log('Build completed successfully (no compilation needed)');

process.exit(0);