#!/usr/bin/env node

/**
 * Clean Disney Pin Authenticator Server
 * Core functionality: Camera access + API communication
 * No database complexity - just what's needed
 */

import express from 'express';
import FormData from 'form-data';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT) || 5000;

// Configure middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'disney-pin-authenticator',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'disney-pin-authenticator', 
    timestamp: new Date().toISOString()
  });
});

// API endpoint for pin analysis
app.post('/api/analyze', async (req, res) => {
  try {
    const { frontImage, backImage, angledImage } = req.body;
    
    if (!frontImage) {
      return res.status(400).json({
        success: false,
        message: 'Front image is required'
      });
    }

    // Create form data for the external API
    const formData = new FormData();
    
    // Convert base64 to buffer and append to form
    const frontBuffer = Buffer.from(frontImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
    formData.append('frontImage', frontBuffer, 'front.jpg');
    
    if (backImage) {
      const backBuffer = Buffer.from(backImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      formData.append('backImage', backBuffer, 'back.jpg');
    }
    
    if (angledImage) {
      const angledBuffer = Buffer.from(angledImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      formData.append('angledImage', angledBuffer, 'angled.jpg');
    }

    // Call the external API
    const apiUrl = process.env.PIM_API_URL || 'https://master.pinauth.com/mobile-upload';
    const apiKey = process.env.MOBILE_API_KEY || 'pim_0w3nfrt5ahgc';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'Disney-Pin-Authenticator/1.0'
      },
      timeout: 30000
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    res.json({
      success: true,
      message: 'Analysis completed successfully',
      ...result
    });

  } catch (error) {
    console.error('Analysis API error:', error);
    res.status(500).json({
      success: false,
      message: 'Analysis failed. Please try again.',
      error: error.message
    });
  }
});

// Serve static files from client/dist
app.use(express.static(path.join(__dirname, 'client/dist')));

// Serve the main app for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'client/dist/index.html');
  res.sendFile(indexPath);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Disney Pin Authenticator running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoint: ${process.env.PIM_API_URL || 'https://master.pinauth.com/mobile-upload'}`);
});