#!/usr/bin/env node

// Set environment variables for Docker deployment
process.env.NODE_ENV = 'development';
process.env.PORT = process.env.PORT || '5000';

// Import and start the server
import('./server/index.js').catch(console.error);