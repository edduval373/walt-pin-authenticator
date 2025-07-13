#!/usr/bin/env node

/**
 * Railway Build Script for Disney Pin Authenticator
 * This script builds both the client and server for production deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Railway build process...');

try {
  // 1. Build the client (React app)
  console.log('📦 Building React client...');
  execSync('cd client && npm run build', { stdio: 'inherit' });
  
  // 2. Build the server (TypeScript to JavaScript)
  console.log('🔧 Building server...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // 3. Verify build outputs
  console.log('✅ Verifying build outputs...');
  
  const clientDist = path.join(process.cwd(), 'client', 'dist');
  const serverDist = path.join(process.cwd(), 'dist');
  
  if (!fs.existsSync(clientDist)) {
    throw new Error('Client build failed - dist directory not found');
  }
  
  if (!fs.existsSync(serverDist)) {
    throw new Error('Server build failed - dist directory not found');
  }
  
  console.log('✅ Railway build completed successfully!');
  console.log('📁 Client build: client/dist/');
  console.log('📁 Server build: dist/');

} catch (error) {
  console.error('❌ Railway build failed:', error.message);
  process.exit(1);
}