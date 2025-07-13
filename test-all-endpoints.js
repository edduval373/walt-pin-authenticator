#!/usr/bin/env node

/**
 * Test all possible health check endpoints to find the exact issue
 */

import http from 'http';

const endpoints = [
  '/healthz',
  '/health',
  '/api/health',
  '/',
  '/api/status'
];

function testEndpoint(path, port = 8080) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Railway-Health-Check/1.0'
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          headers: res.headers,
          body: body.substring(0, 500), // First 500 chars
          isHtml: body.includes('<html>') || body.includes('<!DOCTYPE')
        });
      });
    });
    
    req.on('error', (e) => {
      resolve({
        path,
        error: e.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        path,
        error: 'timeout'
      });
    });
    
    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🔍 Testing all health check endpoints...');
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    console.log(`\n${endpoint}:`);
    console.log(`Status: ${result.status || 'ERROR'}`);
    if (result.error) {
      console.log(`Error: ${result.error}`);
    } else {
      console.log(`Content-Type: ${result.headers['content-type']}`);
      console.log(`Is HTML: ${result.isHtml}`);
      console.log(`Body preview: ${result.body.substring(0, 100)}...`);
    }
  }
}

testAllEndpoints().then(() => {
  console.log('\n✅ Health check testing completed');
}).catch(console.error);