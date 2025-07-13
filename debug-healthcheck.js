#!/usr/bin/env node

/**
 * Debug health check endpoint to capture HTML error messages
 */

import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

console.log('🔍 Starting health check debug session...');

// Start production server
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
  console.log('SERVER:', text.trim());
});

serverProcess.stderr.on('data', (data) => {
  const text = data.toString();
  serverErrors += text;
  console.error('ERROR:', text.trim());
});

// Wait for server to start then test health check
setTimeout(() => {
  console.log('\n🔍 Testing health check endpoint...');
  
  const healthCheckOptions = {
    hostname: 'localhost',
    port: 8080,
    path: '/healthz',
    method: 'GET',
    headers: {
      'User-Agent': 'Railway-Health-Check/1.0'
    }
  };

  const req = http.request(healthCheckOptions, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    
    let responseBody = '';
    res.on('data', (chunk) => {
      responseBody += chunk;
    });
    
    res.on('end', () => {
      console.log('Response Body Length:', responseBody.length);
      console.log('Response Body:');
      console.log('================');
      console.log(responseBody);
      console.log('================');
      
      // Check if it's HTML instead of JSON
      if (responseBody.includes('<html>') || responseBody.includes('<!DOCTYPE')) {
        console.log('⚠️  WARNING: Server returned HTML instead of JSON');
        console.log('This is likely the cause of Railway health check failure');
        
        // Save the HTML response for analysis
        fs.writeFileSync('healthcheck-error.html', responseBody);
        console.log('HTML response saved to healthcheck-error.html');
      } else {
        console.log('✅ Server returned non-HTML response');
      }
      
      // Clean up
      serverProcess.kill();
      process.exit(0);
    });
  });

  req.on('error', (e) => {
    console.error('❌ Health check request failed:', e.message);
    serverProcess.kill();
    process.exit(1);
  });

  req.end();
}, 5000); // Wait 5 seconds for server to start

// Cleanup after 30 seconds
setTimeout(() => {
  console.log('⏰ Timeout reached, killing server');
  serverProcess.kill();
  process.exit(1);
}, 30000);