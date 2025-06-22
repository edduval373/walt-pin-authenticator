#!/usr/bin/env node

/**
 * Railway-specific Disney Pin Authenticator Server
 * FORCES BUILD FILES ONLY - NO FALLBACK HTML
 */

import express from 'express';
import FormData from 'form-data';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT) || 8080;

// Debug build files
const buildPath = path.join(__dirname, 'client/dist');
const indexPath = path.join(buildPath, 'index.html');

console.log('=== RAILWAY SERVER DEBUG ===');
console.log('Build directory exists:', fs.existsSync(buildPath));
console.log('Index.html exists:', fs.existsSync(indexPath));
console.log('Build path:', buildPath);

// FORCE FAILURE if build files missing
if (!fs.existsSync(indexPath)) {
  console.error('CRITICAL ERROR: Build files not found in Railway deployment');
  console.error('Expected path:', indexPath);
  process.exit(1);
}

// Verify build contains legal section
const buildContent = fs.readFileSync(indexPath, 'utf8');
console.log('Build contains Legal Notice:', buildContent.includes('Legal Notice'));
console.log('Build contains I Acknowledge:', buildContent.includes('I Acknowledge'));

if (!buildContent.includes('Legal Notice')) {
  console.error('CRITICAL ERROR: Build files missing legal section');
  process.exit(1);
}

// Configure middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static assets
app.use('/assets', express.static(path.join(__dirname, 'client/dist/assets')));

// API endpoints
app.post('/api/verify-pin', async (req, res) => {
  console.log('Pin verification request received');
  const { frontImage, backImage, angledImage } = req.body;

  if (!frontImage) {
    return res.status(400).json({
      success: false,
      message: 'Front image is required'
    });
  }

  try {
    const formData = new FormData();
    const frontBuffer = Buffer.from(frontImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
    formData.append('front_image', frontBuffer, 'front.jpg');
    
    if (backImage) {
      const backBuffer = Buffer.from(backImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      formData.append('back_image', backBuffer, 'back.jpg');
    }

    const response = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      body: formData,
      headers: {
        'X-API-Key': process.env.MOBILE_API_KEY || 'pim_0w3nfrt5ahgc'
      }
    });

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification service temporarily unavailable'
    });
  }
});

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/status', (req, res) => {
  res.status(200).json({
    service: 'Disney Pin Authenticator API',
    status: 'operational',
    version: '1.0.0',
    api: {
      configured: !!process.env.MOBILE_API_KEY,
      endpoint: 'https://master.pinauth.com/mobile-upload'
    },
    timestamp: new Date().toISOString()
  });
});

// SERVE BUILD FILES ONLY - NO FALLBACK HTML
app.get('*', (req, res) => {
  console.log('=== SERVING BUILD FILES ===');
  console.log('Request path:', req.path);
  
  // Skip API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/healthz')) {
    return res.status(404).json({
      success: false,
      message: `Endpoint ${req.originalUrl} not found`
    });
  }
  
  // FORCE BUILD FILES ONLY
  if (!fs.existsSync(indexPath)) {
    console.error('ERROR: Build files missing at request time');
    return res.status(500).send('BUILD FILES MISSING - Railway deployment failed');
  }
  
  const htmlContent = fs.readFileSync(indexPath, 'utf8');
  console.log('Serving build with Legal Notice:', htmlContent.includes('Legal Notice'));
  res.send(htmlContent);
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Railway Disney Pin Authenticator Server Started`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`API Key Status: ${process.env.MOBILE_API_KEY ? 'Configured' : 'Missing'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Disney Pin Authenticator server closed');
    process.exit(0);
  });
});

export default app;