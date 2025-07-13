#!/usr/bin/env node

/**
 * Capture the exact reason why the production server is crashing
 */

import { spawn } from 'child_process';
import fs from 'fs';

console.log('🔍 Starting server crash detection...');

const serverProcess = spawn('node', ['dist/index.js'], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '8080'
  },
  stdio: 'pipe'
});

let serverOutput = '';
let serverErrors = '';

serverProcess.stdout.on('data', (data) => {
  const text = data.toString();
  serverOutput += text;
  console.log('STDOUT:', text.trim());
});

serverProcess.stderr.on('data', (data) => {
  const text = data.toString();
  serverErrors += text;
  console.error('STDERR:', text.trim());
});

serverProcess.on('close', (code, signal) => {
  console.log(`\n🔍 Server process ended:`);
  console.log(`Exit code: ${code}`);
  console.log(`Signal: ${signal}`);
  
  // Save all output for analysis
  const report = `
=== SERVER CRASH REPORT ===
Exit Code: ${code}
Signal: ${signal}
Time: ${new Date().toISOString()}

=== STDOUT ===
${serverOutput}

=== STDERR ===
${serverErrors}

=== ANALYSIS ===
${code === 0 ? 'Server exited normally' : 'Server crashed with error'}
`;
  
  fs.writeFileSync('server-crash-report.txt', report);
  console.log('Full crash report saved to server-crash-report.txt');
  
  if (code !== 0) {
    console.log('❌ Server crashed - check the error output above');
  }
  
  process.exit(code);
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

// Keep process alive for 30 seconds to see what happens
setTimeout(() => {
  console.log('⏰ 30 second timeout reached');
  if (!serverProcess.killed) {
    console.log('✅ Server still running after 30 seconds');
    serverProcess.kill();
  }
}, 30000);