#!/usr/bin/env node

/**
 * Railway health check fix - add startup delay and robust health endpoint
 */

import fs from 'fs';

console.log('🔧 Applying Railway health check fix...');

// Read the current server code
const serverCode = fs.readFileSync('server/index.ts', 'utf8');

// Add a startup delay and enhanced health check
const healthCheckFix = `
// Add startup delay for Railway health check
let serverReady = false;
setTimeout(() => {
  serverReady = true;
  console.log('✅ Server marked as ready for health checks');
}, 3000);

// Enhanced health check with startup delay
app.get('/healthz', (req, res) => {
  if (!serverReady) {
    return res.status(503).json({
      status: 'starting',
      message: 'Server is starting up, please wait...',
      timestamp: new Date().toISOString()
    });
  }
  
  res.status(200).json({
    status: 'healthy',
    service: 'Disney Pin Authenticator',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});
`;

// Find where to insert the health check fix
const insertPoint = serverCode.indexOf('// Add Railway health check endpoint FIRST');
if (insertPoint === -1) {
  console.error('❌ Could not find insertion point for health check fix');
  process.exit(1);
}

// Insert the fix
const fixedCode = serverCode.substring(0, insertPoint) + healthCheckFix + serverCode.substring(insertPoint);

// Write back the fixed code
fs.writeFileSync('server/index.ts', fixedCode);

console.log('✅ Added startup delay and enhanced health check');
console.log('Server will return 503 for first 3 seconds, then 200');