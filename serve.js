#!/usr/bin/env node

// Production server wrapper for Railway deployment
// This file ensures the server starts correctly regardless of Railway's build process

import { spawn } from 'child_process';
import path from 'path';

console.log('Starting Disney Pin Authenticator Production Server...');

// Start the main server process
const serverProcess = spawn('node', ['index.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: process.env.PORT || 8080
  }
});

// Handle server process events
serverProcess.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

serverProcess.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`Server exited with code ${code} and signal ${signal}`);
    process.exit(code || 1);
  }
});

// Handle termination signals
process.on('SIGTERM', () => {
  console.log('SIGTERM received, stopping server...');
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('SIGINT received, stopping server...');
  serverProcess.kill('SIGINT');
});