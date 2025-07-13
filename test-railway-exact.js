#!/usr/bin/env node

/**
 * Test the exact Railway deployment scenario
 */

import { spawn } from 'child_process';
import http from 'http';

console.log('🔍 Testing Railway exact deployment scenario...');

// Test different port configurations that Railway might use
const ports = [8080, 3000, 5000, process.env.PORT || 8080];

function testPort(port) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing port ${port}...`);
    
    const serverProcess = spawn('node', ['dist/index.js'], {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: port.toString()
      },
      stdio: 'pipe'
    });

    let serverStarted = false;
    let serverOutput = '';

    serverProcess.stdout.on('data', (data) => {
      const text = data.toString();
      serverOutput += text;
      console.log(`[${port}] ${text.trim()}`);
      
      if (text.includes('serving on port')) {
        serverStarted = true;
        
        // Test health check after server starts
        setTimeout(() => {
          const req = http.request({
            hostname: 'localhost',
            port: port,
            path: '/healthz',
            method: 'GET'
          }, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
              console.log(`[${port}] Health check: ${res.statusCode} - ${body.substring(0, 100)}`);
              serverProcess.kill();
              resolve({
                port,
                success: res.statusCode === 200,
                response: body,
                error: null
              });
            });
          });
          
          req.on('error', (e) => {
            console.error(`[${port}] Health check error: ${e.message}`);
            serverProcess.kill();
            resolve({
              port,
              success: false,
              error: e.message
            });
          });
          
          req.end();
        }, 2000);
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
          success: false,
          error: `Server failed to start, exit code: ${code}`
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
          success: false,
          error: 'Server startup timeout'
        });
      }
    }, 10000);
  });
}

async function testAllPorts() {
  for (const port of ports) {
    const result = await testPort(port);
    console.log(`\n✅ Port ${port} result:`, result);
  }
}

testAllPorts().catch(console.error);