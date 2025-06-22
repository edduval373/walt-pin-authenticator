#!/usr/bin/env node

/**
 * Disney Pin Authenticator Production Server
 * Direct deployment entry point for Railway platform
 * Updated: 2025-06-22 - Complete IntroPage with legal section
 */

import express from 'express';
import FormData from 'form-data';
import fetch from 'node-fetch';
import path from 'path';
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

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'disney-pin-authenticator',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'production',
    api: {
      configured: !!process.env.MOBILE_API_KEY,
      endpoint: 'https://master.pinauth.com/mobile-upload'
    }
  });
});

// Serve static files from client build directory
const clientBuildPath = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientBuildPath));



// Pin verification endpoint
app.post('/api/verify-pin', async (req, res) => {
  try {
    const { frontImage, backImage, angledImage } = req.body;
    
    // Validate required data
    if (!frontImage) {
      return res.status(400).json({
        success: false,
        message: 'Front image is required for Disney pin verification'
      });
    }

    // Check API configuration
    const apiKey = process.env.MOBILE_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        message: 'Authentication service configuration error'
      });
    }

    // Prepare API request
    const formData = new FormData();
    
    // Process front image (required)
    const frontImageData = frontImage.replace(/^data:image\/[a-z]+;base64,/, '');
    const frontBuffer = Buffer.from(frontImageData, 'base64');
    formData.append('front_image', frontBuffer, {
      filename: 'front_image.jpg',
      contentType: 'image/jpeg'
    });
    
    // Process back image (optional)
    if (backImage) {
      const backImageData = backImage.replace(/^data:image\/[a-z]+;base64,/, '');
      const backBuffer = Buffer.from(backImageData, 'base64');
      formData.append('back_image', backBuffer, {
        filename: 'back_image.jpg',
        contentType: 'image/jpeg'
      });
    }
    
    // Process angled image (optional)
    if (angledImage) {
      const angledImageData = angledImage.replace(/^data:image\/[a-z]+;base64,/, '');
      const angledBuffer = Buffer.from(angledImageData, 'base64');
      formData.append('angled_image', angledBuffer, {
        filename: 'angled_image.jpg',
        contentType: 'image/jpeg'
      });
    }
    
    // Add API key
    formData.append('api_key', apiKey);
    
    // Call master authentication service
    const apiResponse = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      body: formData,
      headers: {
        'User-Agent': 'Disney-Pin-Authenticator/1.0.0',
        ...formData.getHeaders()
      }
    });
    
    const responseData = await apiResponse.json();
    
    // Return standardized response
    res.status(200).json({
      success: true,
      message: 'Disney pin verification completed',
      sessionId: `250621${Math.floor(Date.now() / 1000)}`,
      timestamp: new Date().toISOString(),
      ...responseData
    });
    
  } catch (error) {
    console.error('Pin verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Disney pin verification service temporarily unavailable'
    });
  }
});

// API status endpoint
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred'
  });
});

// Debug: Check if build files exist
const fs = require('fs');
const buildPath = path.join(__dirname, 'client/dist');
const indexPath = path.join(buildPath, 'index.html');

console.log('=== DEBUGGING BUILD FILES ===');
console.log('Build directory exists:', fs.existsSync(buildPath));
console.log('Index.html exists:', fs.existsSync(indexPath));
console.log('Build directory path:', buildPath);
console.log('Index.html path:', indexPath);

if (fs.existsSync(buildPath)) {
  console.log('Build directory contents:', fs.readdirSync(buildPath));
}

// Serve static files from build directory with debugging
app.use('/assets', express.static(path.join(__dirname, 'client/dist/assets')));

// Root route with extensive debugging
app.get('/', (req, res) => {
  console.log('=== ROOT ROUTE HIT ===');
  console.log('Request path:', req.path);
  console.log('Request URL:', req.url);
  console.log('Headers:', req.headers);
  
  if (!fs.existsSync(indexPath)) {
    console.error('ERROR: index.html not found at:', indexPath);
    return res.status(500).send('BUILD FILES NOT FOUND - Railway deployment issue');
  }
  
  const htmlContent = fs.readFileSync(indexPath, 'utf8');
  console.log('HTML content length:', htmlContent.length);
  console.log('HTML contains "Legal Notice":', htmlContent.includes('Legal Notice'));
  console.log('HTML contains "I Acknowledge":', htmlContent.includes('I Acknowledge'));
  
  res.send(htmlContent);
});

// Handle all other routes - NO FALLBACK HTML
app.get('*', (req, res) => {
  console.log('=== WILDCARD ROUTE HIT ===');
  console.log('Request path:', req.path);
  console.log('Request URL:', req.url);
  
  // Skip API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/healthz')) {
    return res.status(404).json({
      success: false,
      message: `Endpoint ${req.originalUrl} not found`,
      availableEndpoints: [
        'GET /',
        'GET /healthz',
        'GET /api/status',
        'POST /api/verify-pin'
      ]
    });
  }
  
  // FORCE FAILURE if build files don't exist
  if (!fs.existsSync(indexPath)) {
    console.error('ERROR: Build files missing for wildcard route');
    return res.status(500).send('BUILD FILES MISSING - Check Railway deployment');
  }
  
  const htmlContent = fs.readFileSync(indexPath, 'utf8');
  console.log('Wildcard serving HTML with Legal Notice:', htmlContent.includes('Legal Notice'));
  res.send(htmlContent);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Disney Pin Authenticator API server started`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`API Key Status: ${process.env.MOBILE_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`Master API: https://master.pinauth.com/mobile-upload`);
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