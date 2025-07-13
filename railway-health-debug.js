#!/usr/bin/env node

/**
 * Railway Health Check Debug Script
 * Tests the exact health check configuration that Railway uses
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔍 Railway Health Check Debug');
console.log('============================');

// Check if build files exist
const checkBuildFiles = () => {
  const clientDist = path.join(__dirname, 'client', 'dist');
  const serverDist = path.join(__dirname, 'dist');
  
  console.log('\n📁 Build File Check:');
  console.log('Client dist exists:', fs.existsSync(clientDist));
  console.log('Server dist exists:', fs.existsSync(serverDist));
  
  if (fs.existsSync(clientDist)) {
    console.log('Client files:', fs.readdirSync(clientDist));
  }
  
  if (fs.existsSync(serverDist)) {
    console.log('Server files:', fs.readdirSync(serverDist));
  }
};

// Test health check endpoint
const testHealthCheck = (port = 5000) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/healthz',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
};

// Main test function
const runTests = async () => {
  try {
    checkBuildFiles();
    
    console.log('\n🔍 Testing Health Check:');
    const result = await testHealthCheck();
    console.log('✅ Health check successful!');
    console.log('Status:', result.statusCode);
    console.log('Response:', JSON.parse(result.body));
    
    // Test with different ports that Railway might use
    const railwayPort = process.env.PORT || 8080;
    if (railwayPort !== 5000) {
      console.log(`\n🔍 Testing on Railway port ${railwayPort}:`);
      try {
        const railwayResult = await testHealthCheck(railwayPort);
        console.log('✅ Railway port health check successful!');
        console.log('Status:', railwayResult.statusCode);
      } catch (e) {
        console.log('❌ Railway port health check failed:', e.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    console.log('\n💡 Common causes:');
    console.log('1. Server not started yet');
    console.log('2. Port mismatch (Railway uses different port)');
    console.log('3. Health check endpoint not configured');
    console.log('4. Server startup taking too long');
  }
};

runTests();