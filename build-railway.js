#!/usr/bin/env node

/**
 * Railway Build Script - Compatible with npm run build
 * This script ensures the build process works correctly for Railway deployment
 */

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🚀 Railway Build Process Starting...');

// Function to run a command
function runCommand(command, args = [], cwd = __dirname) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { 
      cwd, 
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function buildClient() {
  console.log('🔧 Building React client...');
  
  const clientDir = join(__dirname, 'client');
  if (!existsSync(clientDir)) {
    throw new Error('Client directory not found');
  }

  // Run the client build using the production config
  await runCommand('npm', ['run', 'build'], clientDir);
  console.log('✅ Client build completed');
}

async function buildServer() {
  console.log('🔧 Building server...');
  
  // Use the same esbuild command as defined in package.json
  await runCommand('npx', [
    'esbuild', 
    'server/index.ts', 
    '--platform=node', 
    '--packages=external', 
    '--bundle', 
    '--format=esm', 
    '--outdir=dist'
  ]);
  
  console.log('✅ Server build completed');
}

async function verifyBuild() {
  console.log('🔍 Verifying build outputs...');
  
  const clientDist = join(__dirname, 'client', 'dist');
  const serverDist = join(__dirname, 'dist');
  
  if (!existsSync(clientDist)) {
    throw new Error('Client build output not found');
  }
  
  if (!existsSync(serverDist)) {
    throw new Error('Server build output not found');
  }
  
  console.log('✅ Build verification passed');
}

async function main() {
  try {
    await buildClient();
    await buildServer();
    await verifyBuild();
    
    console.log('🎉 Railway build completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

main();