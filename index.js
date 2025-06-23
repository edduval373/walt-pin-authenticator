#!/usr/bin/env node

/**
 * Disney Pin Authenticator Production Server
 * Simplified Railway deployment entry point
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

// Configure middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Build files check
const buildPath = path.join(__dirname, 'client/dist');
const indexPath = path.join(buildPath, 'index.html');

console.log('=== RAILWAY SERVER STARTUP ===');
console.log('Build directory exists:', fs.existsSync(buildPath));
console.log('Index.html exists:', fs.existsSync(indexPath));

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

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    buildFiles: fs.existsSync(indexPath)
  });
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

// Force production mode - disable development middleware
console.log('=== FORCING PRODUCTION MODE ===');

// Serve static assets with proper headers
app.use('/assets', express.static(path.join(__dirname, 'client/dist/assets'), {
  maxAge: '1y',
  etag: false,
  setHeaders: (res, path) => {
    console.log('Serving asset:', path);
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Serve build files
app.get('*', (req, res) => {
  console.log('Request for:', req.path);
  
  // Skip API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/healthz')) {
    return res.status(404).json({
      success: false,
      message: `Endpoint ${req.originalUrl} not found`
    });
  }
  
  if (!fs.existsSync(indexPath)) {
    console.error('Build files missing');
    return res.status(500).send('Build files not found - deployment issue');
  }
  
  const htmlContent = fs.readFileSync(indexPath, 'utf8');
  console.log('Serving HTML - contains JavaScript bundle:', htmlContent.includes('index-DQwQ6CII.js'));
  console.log('Serving HTML - contains CSS bundle:', htmlContent.includes('index-DAgQPu_G.css'));
  res.setHeader('Content-Type', 'text/html');
  res.send(htmlContent);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=== RAILWAY PRODUCTION SERVER STARTED ===`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`API Key Status: ${process.env.MOBILE_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`Build Files: ${fs.existsSync(indexPath) ? 'FOUND' : 'MISSING'}`);
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    console.log(`Legal Section: ${content.includes('Legal Notice') ? 'YES' : 'NO'}`);
  }
});

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log('Disney Pin Authenticator server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;