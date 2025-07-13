#!/usr/bin/env node

/**
 * Test production server startup to diagnose Railway deployment issues
 */

import { spawn } from 'child_process';

console.log('🔍 Testing production server startup...');

const serverProcess = spawn('node', ['dist/index.js'], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '8080'
  },
  stdio: 'pipe'
});

let output = '';
let errorOutput = '';

serverProcess.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  console.log('STDOUT:', text.trim());
});

serverProcess.stderr.on('data', (data) => {
  const text = data.toString();
  errorOutput += text;
  console.error('STDERR:', text.trim());
});

serverProcess.on('close', (code) => {
  console.log(`\n🔍 Process exited with code: ${code}`);
  
  if (code !== 0) {
    console.error('❌ Server failed to start');
    console.error('Error output:', errorOutput);
  } else {
    console.log('✅ Server started successfully');
  }
  
  process.exit(code);
});

// Kill process after 10 seconds for testing
setTimeout(() => {
  console.log('\n⏰ Test timeout - killing process');
  serverProcess.kill();
}, 10000);