#!/usr/bin/env node

/**
 * Test Railway port configuration
 */

console.log('🔍 Testing Railway port configuration...');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('PORT:', process.env.PORT || 'not set');

// Test the exact port Railway would use
const port = process.env.PORT || 8080;
console.log('Expected port:', port);

// Check if port is being used
const { execSync } = require('child_process');

try {
  const result = execSync(`netstat -tlnp | grep :${port}`, { encoding: 'utf8' });
  console.log('Port status:', result.trim());
} catch (e) {
  console.log('Port not in use');
}

console.log('✅ Railway port test completed');