#!/usr/bin/env node

/**
 * Fix the package.json build script to work with Railway
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');

console.log('🔧 Fixing package.json build script...');

// Read the current package.json
let packageJson;
try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (error) {
  console.error('❌ Failed to read package.json:', error.message);
  process.exit(1);
}

// Update the build script
packageJson.scripts.build = "node build-complete.js";

// Write back the updated package.json
try {
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json build script');
  console.log('Build script now runs: node build-complete.js');
} catch (error) {
  console.error('❌ Failed to write package.json:', error.message);
  process.exit(1);
}