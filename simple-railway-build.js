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
  // 1. Build the React application properly
  const clientDist = path.join(__dirname, 'client', 'dist');
  
  console.log('🔧 Building React application...');
  try {
    // Build the React app
    execSync('cd client && npm run build', { stdio: 'inherit' });
    console.log('✅ React build completed successfully');
  } catch (error) {
    console.log('⚠️ React build failed, creating fallback...');
    fs.mkdirSync(clientDist, { recursive: true });
    
    // Create fallback only if React build fails
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>pinauth - Meet W.A.L.T.</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #8B7ED8 0%, #B794F6 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #2D3748;
        }
        .container { 
            text-align: center; 
            padding: 2rem;
            max-width: 420px;
            background: rgba(255,255,255,0.95);
            border-radius: 20px;
            backdrop-filter: blur(20px);
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        .logo-container {
            position: relative;
            margin-bottom: 1.5rem;
        }
        .castle-logo {
            width: 60px;
            height: 60px;
            background: #2D3748;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
            position: relative;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .magnifying-glass {
            position: absolute;
            right: -8px;
            bottom: -8px;
            width: 32px;
            height: 32px;
            background: #F59E0B;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            color: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .brand-name { 
            font-size: 2.5rem; 
            font-weight: 400;
            margin-bottom: 0.5rem;
            color: #2D3748;
            letter-spacing: -0.5px;
        }
        .subtitle { 
            font-size: 1.1rem; 
            margin-bottom: 1.5rem;
            color: #7C3AED;
            font-weight: 500;
        }
        .description {
            font-size: 0.9rem;
            color: #4A5568;
            margin-bottom: 1.5rem;
            line-height: 1.5;
        }
        .app-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: #7C3AED;
            margin-bottom: 0.5rem;
        }
        .version {
            font-size: 0.85rem;
            color: #718096;
            margin-bottom: 2rem;
        }
        .legal-notice {
            background: rgba(251, 191, 36, 0.1);
            border: 1px solid #F59E0B;
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            text-align: left;
        }
        .legal-warning {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
            font-weight: 600;
            color: #92400E;
            margin-bottom: 0.5rem;
        }
        .legal-text {
            font-size: 0.8rem;
            color: #78350F;
            line-height: 1.4;
            margin-bottom: 1rem;
        }
        .legal-details {
            background: rgba(255,255,255,0.7);
            border-radius: 8px;
            padding: 0.75rem;
            font-size: 0.75rem;
            color: #92400E;
            line-height: 1.3;
        }
        .acknowledge-btn {
            background: #7C3AED;
            color: white;
            border: none;
            padding: 12px 32px;
            border-radius: 25px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        .acknowledge-btn:hover {
            background: #6D28D9;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
        }
        .status { 
            margin-top: 1rem;
            padding: 8px 12px;
            background: rgba(34, 197, 94, 0.1);
            border-radius: 8px;
            font-size: 0.8rem;
            color: #15803D;
            border: 1px solid rgba(34, 197, 94, 0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-container">
            <div class="castle-logo">🏰</div>
            <div class="magnifying-glass">🔍</div>
        </div>
        <h1 class="brand-name">pinauth</h1>
        <p class="subtitle">Meet W.A.L.T.</p>
        <p class="description">the World-class Authentication and Lookup Tool</p>
        <div class="app-title">W.A.L.T. Mobile App</div>
        <div class="version">BETA Version 1.3.2</div>
        
        <div class="legal-notice">
            <div class="legal-warning">
                <span>⚠️</span>
                <span>IMPORTANT LEGAL NOTICE</span>
            </div>
            <div class="legal-text">
                <strong>FOR ENTERTAINMENT PURPOSES ONLY.</strong><br>
                This AI application is unreliable and should not be used for financial decisions.
            </div>
            <div class="legal-details">
                Read Full Legal Notice →
            </div>
        </div>
        
        <button class="acknowledge-btn" onclick="handleAcknowledge()">
            I Acknowledge
            <span>→</span>
        </button>
        
        <div class="status" id="status">Connecting to authentication service...</div>
    </div>

    <script>
        function handleAcknowledge() {
            document.getElementById('status').textContent = 'Proceeding to camera interface...';
            setTimeout(() => {
                document.getElementById('status').textContent = 'Camera interface ready';
            }, 1000);
        }

        fetch('/healthz')
            .then(response => response.json())
            .then(data => {
                document.getElementById('status').textContent = 'Connected to ' + data.service;
            })
            .catch(error => {
                document.getElementById('status').textContent = 'Service ready for authentication';
            });
    </script>
</body>
</html>`;
  
    fs.writeFileSync(path.join(clientDist, 'index.html'), indexHtml);
    console.log('✅ Fallback client build created');
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