#!/usr/bin/env node

/**
 * Test Railway port configuration
 */

import http from 'http';

console.log('🔍 Testing Railway port configuration...');
console.log('Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Test the ports Railway might use
const possiblePorts = [
  process.env.PORT,
  5000,
  8080,
  3000
].filter(Boolean);

async function testPort(port) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/healthz',
      method: 'GET'
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({
          port,
          success: true,
          status: res.statusCode,
          body: body.substring(0, 100)
        });
      });
    });
    
    req.on('error', (e) => {
      resolve({
        port,
        success: false,
        error: e.message
      });
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({
        port,
        success: false,
        error: 'timeout'
      });
    });
    
    req.end();
  });
}

async function testAllPorts() {
  for (const port of possiblePorts) {
    const result = await testPort(port);
    console.log(`Port ${port}:`, result);
  }
}

testAllPorts();