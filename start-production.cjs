#!/usr/bin/env node

/**
 * Railway Production Starter Script
 * Ensures the server starts correctly with proper error handling
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Set production environment
process.env.NODE_ENV = 'production';

// Remove conflicting environment variables for Railway deployment
delete process.env.HEALTH_CHECK_URL;

console.log('🚀 Starting Disney Pin Authenticator in production mode...');
console.log(`📡 PORT: ${process.env.PORT || 'not set'}`);
console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`);

// Check if built files exist
const distPath = path.join(__dirname, 'dist', 'index.js');
if (!fs.existsSync(distPath)) {
  console.error('❌ Built files not found. Running build...');
  
  const buildProcess = spawn('npm', ['run', 'build'], { 
    stdio: 'inherit',
    shell: true 
  });
  
  buildProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ Build failed with code ${code}`);
      process.exit(1);
    }
    
    console.log('✅ Build completed. Starting server...');
    startServer().catch(error => {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    });
  });
} else {
  console.log('✅ Built files found. Starting server...');
  startServer().catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
}

async function startServer() {
  // Start the server directly without spawning a new process
  console.log('✅ Starting server directly...');
  
  try {
    // Set environment variables
    process.env.NODE_ENV = 'production';
    
    // Import and run the server using dynamic import
    await import('./dist/index.js');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}