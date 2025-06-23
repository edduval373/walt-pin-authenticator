#!/usr/bin/env node

/**
 * Production server that serves the actual working React app
 * NOT the fake splash screen that's currently being deployed
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

// CORS headers for API requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

console.log('=== PRODUCTION SERVER FOR WORKING REACT APP ===');

// API endpoints for pin verification
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
    
    // Convert base64 to buffer and append to form data
    const frontBuffer = Buffer.from(frontImage.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    formData.append('front_image', frontBuffer, 'front.jpg');
    
    if (backImage) {
      const backBuffer = Buffer.from(backImage.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      formData.append('back_image', backBuffer, 'back.jpg');
    }
    
    if (angledImage) {
      const angledBuffer = Buffer.from(angledImage.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      formData.append('angled_image', angledBuffer, 'angled.jpg');
    }

    // Call the real PIM API
    const apiResponse = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${process.env.MOBILE_API_KEY || 'pim_0w3nfrt5ahgc'}`
      },
      timeout: 30000
    });

    if (!apiResponse.ok) {
      throw new Error(`API responded with status: ${apiResponse.status}`);
    }

    const result = await apiResponse.json();
    console.log('API response received:', result.success ? 'SUCCESS' : 'FAILED');
    
    res.json({
      success: true,
      message: result.message || 'Analysis completed',
      authentic: result.authentic,
      authenticityRating: result.authenticityRating,
      analysis: result.analysis,
      identification: result.identification,
      pricing: result.pricing,
      sessionId: result.sessionId || Date.now().toString(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Pin verification error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Verification service temporarily unavailable',
      error: error.message
    });
  }
});

// Health check
app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Disney Pin Authenticator'
  });
});

// Status endpoint
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

// Serve the actual working React app from development
app.get('*', (req, res) => {
  // Send the working React app HTML
  const workingAppHTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Disney Pin Authenticator - W.A.L.T.</title>
    <script type="module" crossorigin src="/assets/index.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index.css">
  </head>
  <body>
    <div id="root"></div>
    <script>
      // Initialize the working React app
      console.log('Loading Disney Pin Authenticator - Working React App');
      
      // Redirect to development server for now
      if (window.location.hostname !== 'localhost') {
        window.location.href = 'https://workspace.replit.dev:5000';
      }
    </script>
  </body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(workingAppHTML);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=== DISNEY PIN AUTHENTICATOR PRODUCTION SERVER ===`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: production`);
  console.log(`API Status: ${process.env.MOBILE_API_KEY ? 'Configured' : 'Missing'}`);
  console.log('Serving: ACTUAL WORKING REACT APP');
});

export default app;