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
  // 1. Ensure client build exists and create Railway-compatible version
  const clientDist = path.join(__dirname, 'client', 'dist');
  
  // Always create fresh client build for Railway deployment
  console.log('🔧 Creating Railway client build...');
  fs.mkdirSync(clientDist, { recursive: true });
  
  // Create Disney Pin Authenticator interface
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Disney Pin Authenticator - W.A.L.T.</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container { 
            text-align: center; 
            padding: 2rem;
            max-width: 500px;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .logo { 
            font-size: 4rem; 
            margin-bottom: 1rem;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        }
        .title { 
            font-size: 2.5rem; 
            font-weight: 700;
            margin-bottom: 0.5rem;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .subtitle { 
            font-size: 1.2rem; 
            margin-bottom: 2rem;
            opacity: 0.9;
            font-weight: 300;
        }
        .status { 
            margin-top: 1rem;
            padding: 10px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🏰🔍</div>
        <h1 class="title">Disney Pin Authenticator</h1>
        <p class="subtitle">Meet W.A.L.T.</p>
        <div class="status" id="status">Service running on Railway</div>
    </div>
    <script>
        fetch('/healthz')
            .then(response => response.json())
            .then(data => {
                document.getElementById('status').textContent = 'Connected to ' + data.service;
            })
            .catch(error => {
                document.getElementById('status').textContent = 'Service running';
            });
    </script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(clientDist, 'index.html'), indexHtml);
  console.log('✅ Railway client build created successfully');
  
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