#!/usr/bin/env node

/**
 * Deploy fix for pinauth.com - ensures proper static file serving
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT) || 5000;

// Configure middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// IMPORTANT: Serve static files FIRST before any other routes
app.use(express.static(path.join(__dirname, 'client/dist'), {
  index: false, // Don't serve index.html for directories
  setHeaders: (res, filePath) => {
    // Ensure proper content types for static assets
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Health check
app.get('/healthz', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Disney Pin Authenticator'
  });
});

// API routes
app.post('/api/verify-pin', async (req, res) => {
  try {
    const { frontImage, backImage, angledImage } = req.body;
    
    if (!frontImage) {
      return res.status(400).json({
        success: false,
        message: 'Front image is required'
      });
    }

    // Mock response for now - will be replaced with real API call
    res.json({
      success: true,
      authentic: true,
      authenticityRating: 95,
      analysis: 'This appears to be an authentic Disney pin with proper construction and finishing.',
      identification: 'Disney Limited Edition Pin - Mickey Mouse 50th Anniversary',
      pricing: 'Estimated value: $25-45 based on current market conditions',
      sessionId: Date.now().toString()
    });
    
  } catch (error) {
    console.error('Pin verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Pin verification service temporarily unavailable'
    });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'client/dist/index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('App not found - build required');
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Disney Pin Authenticator running on port ${PORT}`);
  console.log(`Static files served from: ${path.join(__dirname, 'client/dist')}`);
  console.log(`Index.html exists: ${fs.existsSync(path.join(__dirname, 'client/dist/index.html'))}`);
});