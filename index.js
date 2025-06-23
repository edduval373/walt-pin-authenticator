#!/usr/bin/env node

/**
 * Disney Pin Authenticator Production Server
 * Serves the working React app from client/dist
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
    
    if (!frontImage) {
      return res.status(400).json({
        success: false,
        message: 'Front image is required for Disney pin verification'
      });
    }

    // Call the PIM API
    const formData = new FormData();
    formData.append('sessionId', Date.now().toString());
    formData.append('frontImageData', frontImage.replace(/^data:image\/[a-z]+;base64,/, ''));
    
    if (backImage) {
      formData.append('backImageData', backImage.replace(/^data:image\/[a-z]+;base64,/, ''));
    }
    
    if (angledImage) {
      formData.append('angledImageData', angledImage.replace(/^data:image\/[a-z]+;base64,/, ''));
    }

    const response = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${process.env.MOBILE_API_KEY || 'pim_0w3nfrt5ahgc'}`
      }
    });

    const result = await response.json();
    res.json(result);
    
  } catch (error) {
    console.error('Pin verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification service unavailable'
    });
  }
});

// Serve the working React app for all other routes
app.get('*', (req, res) => {
  console.log('Serving working React app from client/dist');
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Disney Pin Authenticator running on port ${PORT}`);
  console.log('Environment: production');
  console.log('Serving working React application from client/dist');
  console.log('✅ Real app deployment ready (not fake splash screen)');
});