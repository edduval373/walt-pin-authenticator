#!/usr/bin/env node

/**
 * Complete build script that works with Railway's npm run build
 * This replaces the server-only build command in package.json
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Complete Railway Build Process');
console.log('================================');

function runCommand(command, cwd = __dirname) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { 
      stdio: 'inherit', 
      cwd: cwd,
      env: { ...process.env, NODE_ENV: 'production' }
    });
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

function checkExists(filepath) {
  const exists = fs.existsSync(filepath);
  console.log(`${exists ? '✅' : '❌'} ${filepath} ${exists ? 'exists' : 'missing'}`);
  return exists;
}

// Step 1: Build the React client
console.log('\n🔧 Building React client...');
const clientDir = path.join(__dirname, 'client');
if (!checkExists(clientDir)) {
  console.error('❌ Client directory not found');
  process.exit(1);
}

if (!runCommand('npm run build', clientDir)) {
  console.error('❌ Client build failed');
  process.exit(1);
}

// Step 2: Build the server
console.log('\n🔧 Building server...');
if (!runCommand('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist')) {
  console.error('❌ Server build failed');
  process.exit(1);
}

// Step 3: Verify build outputs
console.log('\n🔍 Verifying build outputs...');
const clientDist = path.join(__dirname, 'client', 'dist');
const serverDist = path.join(__dirname, 'dist');
const serverIndex = path.join(serverDist, 'index.js');

if (!checkExists(clientDist)) {
  console.error('❌ Client build output missing');
  process.exit(1);
}

if (!checkExists(serverIndex)) {
  console.error('❌ Server build output missing');
  process.exit(1);
}

// Step 4: Copy client build to expected location for production
console.log('\n🔧 Setting up production static files...');
const publicDir = path.join(__dirname, 'dist', 'public');
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
}
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy client build to dist/public for production serving
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDirectory(clientDist, publicDir);
console.log(`✅ Client files copied to ${publicDir}`);

console.log('\n✅ Build completed successfully!');
console.log(`📁 Client: ${clientDist}`);
console.log(`📁 Server: ${serverDist}`);
console.log(`📁 Production static: ${publicDir}`);
console.log('🚀 Ready for Railway deployment!');