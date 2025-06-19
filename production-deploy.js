#!/usr/bin/env node

// Production deployment script for Disney Pin Authenticator
// This bypasses build conflicts and starts the API server directly

process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '8080';

console.log('🏰 Starting Disney Pin Authenticator Production Server');
console.log(`Port: ${process.env.PORT}`);
console.log(`API Key: ${process.env.MOBILE_API_KEY ? 'Configured' : 'Missing'}`);

// Import and start the minimal server
import('./minimal-server.js')
  .then(() => {
    console.log('✅ Production server started successfully');
  })
  .catch(error => {
    console.error('❌ Failed to start production server:', error);
    process.exit(1);
  });