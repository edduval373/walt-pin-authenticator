#!/usr/bin/env node

// Simple start script for Railway deployment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '8080';

import('./server/production.js').catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});