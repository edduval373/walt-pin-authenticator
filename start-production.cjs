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
    startServer();
  });
} else {
  console.log('✅ Built files found. Starting server...');
  startServer();
}

function startServer() {
  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

  serverProcess.on('close', (code) => {
    console.log(`🔚 Server process exited with code ${code}`);
    process.exit(code);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM. Shutting down gracefully...');
    serverProcess.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT. Shutting down gracefully...');
    serverProcess.kill('SIGINT');
  });
}