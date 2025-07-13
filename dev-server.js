#!/usr/bin/env node

/**
 * Development server startup script
 * Runs the TypeScript server with Vite dev server
 */

const { spawn } = require('child_process');

// Kill any existing server processes
const killExisting = spawn('pkill', ['-f', 'node server.js'], { stdio: 'inherit' });

killExisting.on('exit', () => {
  // Start the TypeScript development server
  const server = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });

  server.on('error', (err) => {
    console.error('Failed to start development server:', err);
  });

  server.on('exit', (code) => {
    console.log(`Development server exited with code ${code}`);
  });
});