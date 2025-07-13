#!/usr/bin/env node

/**
 * Debug Railway port configuration
 */

import { spawn } from 'child_process';
import http from 'http';

console.log('🔍 Debugging Railway PORT configuration...');

// Test with different PORT values that Railway might use
const testPorts = [3000, 8080, 8000, 5000, 80, 443];

async function testPortBinding(port) {
  console.log(`\n🔍 Testing port ${port}...`);
  
  return new Promise((resolve) => {
    const serverProcess = spawn('npm', ['run', 'dev'], {
      env: {
        ...process.env,
        NODE_ENV: 'development',
        PORT: port.toString()
      },
      stdio: 'pipe'
    });

    let serverOutput = '';
    let serverStarted = false;

    serverProcess.stdout.on('data', (data) => {
      const text = data.toString();
      serverOutput += text;
      console.log(`[${port}] ${text.trim()}`);
      
      if (text.includes('serving on port')) {
        serverStarted = true;
        
        // Test health check
        setTimeout(() => {
          console.log(`[${port}] Testing health check...`);
          
          const req = http.request({
            hostname: 'localhost',
            port: port,
            path: '/healthz',
            method: 'GET',
            headers: {
              'User-Agent': 'Railway-Health-Check/1.0'
            }
          }, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
              console.log(`[${port}] Health check: ${res.statusCode}`);
              console.log(`[${port}] Response: ${body.substring(0, 100)}...`);
              
              serverProcess.kill();
              resolve({
                port,
                started: true,
                healthCheck: res.statusCode === 200,
                response: body
              });
            });
          });
          
          req.on('error', (e) => {
            console.error(`[${port}] Health check error: ${e.message}`);
            serverProcess.kill();
            resolve({
              port,
              started: true,
              healthCheck: false,
              error: e.message
            });
          });
          
          req.end();
        }, 3000);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[${port}] ERROR: ${data.toString().trim()}`);
    });

    serverProcess.on('close', (code) => {
      if (!serverStarted) {
        console.error(`[${port}] Server failed to start, exit code: ${code}`);
        resolve({
          port,
          started: false,
          error: `Failed to start, exit code: ${code}`
        });
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!serverStarted) {
        console.error(`[${port}] Server startup timeout`);
        serverProcess.kill();
        resolve({
          port,
          started: false,
          error: 'Server startup timeout'
        });
      }
    }, 10000);
  });
}

async function testAllPorts() {
  for (const port of testPorts) {
    const result = await testPortBinding(port);
    console.log(`\n✅ Port ${port} result:`, result);
    
    if (result.started && result.healthCheck) {
      console.log(`🎉 SUCCESS: Port ${port} works correctly!`);
      break;
    }
  }
}

testAllPorts().catch(console.error);