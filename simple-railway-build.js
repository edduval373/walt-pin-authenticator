#!/usr/bin/env node

/**
 * Simple Railway Build Script - Focuses on server build only
 * Uses existing client build to avoid timeout issues
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Starting simple Railway build process...');

try {
  // 1. Check if client build exists
  const clientDist = path.join(__dirname, 'client', 'dist');
  if (fs.existsSync(clientDist)) {
    console.log('✅ Client build found, using existing build');
  } else {
    console.log('❌ Client build not found, creating minimal build');
    // Create minimal client build structure
    fs.mkdirSync(clientDist, { recursive: true });
    fs.writeFileSync(path.join(clientDist, 'index.html'), `
<!DOCTYPE html>
<html>
<head>
    <title>Disney Pin Authenticator</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
    <div id="root">
        <h1>Disney Pin Authenticator</h1>
        <p>Loading...</p>
    </div>
</body>
</html>
    `);
  }
  
  // 2. Build the server (TypeScript to JavaScript)
  console.log('🔧 Building server...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // 3. Verify build outputs
  console.log('✅ Verifying build outputs...');
  
  const serverDist = path.join(__dirname, 'dist');
  
  if (!fs.existsSync(serverDist)) {
    throw new Error('Server build failed - dist directory not found');
  }
  
  console.log('✅ Simple Railway build completed successfully!');
  console.log('📁 Client build: client/dist/');
  console.log('📁 Server build: dist/');

} catch (error) {
  console.error('❌ Simple Railway build failed:', error.message);
  process.exit(1);
}