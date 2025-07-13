#!/usr/bin/env node

/**
 * Railway Health Check Debug Script
 * Tests the exact health check configuration that Railway uses
 */

import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

console.log('🔍 Starting Railway health check debug...');

// Start server exactly as Railway would
const serverProcess = spawn('npm', ['run', 'dev'], {
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: '5000'
  },
  stdio: 'pipe'
});

let serverOutput = '';
let serverErrors = '';
let serverStarted = false;

serverProcess.stdout.on('data', (data) => {
  const text = data.toString();
  serverOutput += text;
  console.log('SERVER:', text.trim());
  
  if (text.includes('serving on port')) {
    serverStarted = true;
    console.log('✅ Server started successfully');
  }
});

serverProcess.stderr.on('data', (data) => {
  const text = data.toString();
  serverErrors += text;
  console.error('ERROR:', text.trim());
});

// Test health check multiple times like Railway does
async function testHealthCheck() {
  console.log('\n🔍 Testing health check endpoint...');
  
  for (let attempt = 1; attempt <= 8; attempt++) {
    console.log(`\nAttempt #${attempt}:`);
    
    try {
      const response = await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: 5000,
          path: '/healthz',
          method: 'GET',
          headers: {
            'User-Agent': 'Railway-Health-Check/1.0'
          }
        }, (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: body
            });
          });
        });
        
        req.on('error', (e) => {
          reject(e);
        });
        
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
        
        req.end();
      });
      
      console.log(`Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers['content-type']}`);
      console.log(`Body: ${response.body.substring(0, 100)}...`);
      
      if (response.status === 200) {
        console.log('✅ Health check passed!');
        break;
      } else {
        console.log('❌ Health check failed');
      }
      
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}`);
    }
    
    // Wait before next attempt
    if (attempt < 8) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Save debug info
  const debugReport = `
=== RAILWAY HEALTH CHECK DEBUG ===
Time: ${new Date().toISOString()}
Server Started: ${serverStarted}

=== SERVER OUTPUT ===
${serverOutput}

=== SERVER ERRORS ===
${serverErrors}
`;
  
  fs.writeFileSync('railway-health-debug.txt', debugReport);
  console.log('\nDebug report saved to railway-health-debug.txt');
  
  serverProcess.kill();
}

// Wait for server to start, then test
setTimeout(() => {
  if (serverStarted) {
    testHealthCheck();
  } else {
    console.log('❌ Server failed to start within 15 seconds');
    serverProcess.kill();
  }
}, 15000);