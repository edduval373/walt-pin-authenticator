#!/usr/bin/env node

/**
 * Disney Pin Authenticator - Railway Cache Bypass Server
 * Forces fresh content delivery on every request
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

// Aggressive anti-cache middleware for ALL requests
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Last-Modified', new Date().toUTCString());
  res.setHeader('ETag', `"${Date.now()}-${Math.random()}"`);
  res.setHeader('X-Accel-Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

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

// Generate complete Disney Pin Authenticator HTML
function generateDisneyPinAuthenticatorHTML() {
  const timestamp = new Date().toISOString();
  const randomId = Math.random().toString(36).substring(7);
  
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>Disney Pin Authenticator - W.A.L.T.</title>
    <meta name="description" content="Authenticate your Disney pins with advanced AI image recognition technology" />
    <!-- Cache Buster: ${timestamp} - ID: ${randomId} -->
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { width: 100%; height: 100%; font-family: system-ui, -apple-system, sans-serif; }
      .app-container { 
        position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
        display: flex; flex-direction: column; align-items: center; justify-content: flex-start; 
        background: linear-gradient(to bottom, #eef2ff, #e0e7ff); 
        overflow-y: auto; z-index: 50; padding: 20px;
      }
      .content-wrapper { 
        text-align: center; padding: 0 1rem; max-width: 100%; width: 100%; 
        min-height: 100vh; display: flex; flex-direction: column; 
        justify-content: space-between;
      }
      .logo-section { margin-bottom: 1rem; flex-shrink: 0; }
      .logo { 
        width: 120px; height: 120px; background: #4f46e5; border-radius: 50%; 
        margin: 0 auto 1rem auto; display: flex; align-items: center; justify-content: center; 
        color: white; font-size: 24px; font-weight: bold; 
        position: relative;
      }
      .logo::before {
        content: '';
        position: absolute;
        top: -10px; right: -10px;
        width: 40px; height: 40px;
        background: #fbbf24;
        border-radius: 50%;
        border: 3px solid #4f46e5;
      }
      .logo::after {
        content: '🏰';
        position: absolute;
        top: -8px; right: -8px;
        font-size: 20px;
        z-index: 1;
      }
      .text-content { flex: 1; display: flex; flex-direction: column; justify-content: center; min-height: 300px; }
      .tagline { margin-bottom: 1.5rem; text-align: center; }
      .meet-walt { 
        color: #4f46e5; font-size: 2rem; line-height: 2.5rem; 
        font-weight: 500; margin-bottom: 1rem; 
      }
      .description { 
        color: #4f46e5; font-size: 1.125rem; line-height: 1.75rem; 
        margin-bottom: 1rem;
      }
      .title-section { margin-bottom: 2rem; text-align: center; }
      .app-title { 
        font-size: 2.25rem; line-height: 2.75rem; font-weight: 700; 
        color: #4338ca; letter-spacing: -0.025em; margin-bottom: 0.75rem; 
      }
      .version { 
        font-size: 1rem; line-height: 1.5rem; color: #4f46e5; 
        font-weight: 600; margin-bottom: 1rem;
      }
      .legal-section { 
        margin-top: 2rem; padding: 1.5rem; background: rgba(255,255,255,0.8); 
        border-radius: 12px; flex-shrink: 0; border: 1px solid rgba(79, 70, 229, 0.2);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .legal-title { 
        color: #374151; font-weight: 700; margin-bottom: 1rem; 
        font-size: 1.125rem; line-height: 1.75rem; display: flex; align-items: center; gap: 0.5rem;
      }
      .legal-text { 
        color: #4f46e5; font-size: 1rem; line-height: 1.5rem; 
        margin-bottom: 0.75rem; font-weight: 600; text-align: center;
      }
      .warning { 
        color: #4f46e5; font-weight: 600; margin-bottom: 1.5rem; 
        font-size: 1rem; text-align: center;
      }
      .acknowledge-btn { 
        background: #4f46e5; color: white; border: none; 
        padding: 16px 32px; border-radius: 25px; font-size: 1.1rem; 
        font-weight: 600; cursor: pointer; margin-top: 1.5rem; width: 100%;
        transition: all 0.2s; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
      }
      .acknowledge-btn:hover { 
        background: #4338ca; transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
      }
      .legal-details {
        background: rgba(255,255,255,0.6); border-radius: 8px; 
        padding: 1rem; margin: 1rem 0; text-align: left; 
        font-size: 0.875rem; line-height: 1.5; color: #374151;
        border: 1px solid rgba(79, 70, 229, 0.1);
      }
      .legal-summary {
        cursor: pointer; color: #4f46e5; font-weight: 600; 
        margin-bottom: 1rem; padding: 0.5rem; text-align: center;
        border-radius: 6px; background: rgba(79, 70, 229, 0.1);
        transition: background-color 0.2s;
      }
      .legal-summary:hover {
        background: rgba(79, 70, 229, 0.2);
      }

      /* Mobile responsive adjustments */
      @media (max-width: 480px) {
        .app-container { padding: 10px; }
        .content-wrapper { padding: 0 0.5rem; }
        .logo { 
          width: 100px; height: 100px; font-size: 18px; 
        }
        .logo::before { 
          width: 30px; height: 30px; top: -8px; right: -8px; 
        }
        .logo::after { 
          font-size: 16px; top: -6px; right: -6px; 
        }
        .meet-walt { font-size: 1.5rem; line-height: 2rem; }
        .description { font-size: 1rem; line-height: 1.5rem; }
        .app-title { font-size: 1.75rem; line-height: 2.25rem; }
        .version { font-size: 0.875rem; }
        .legal-section { padding: 1rem; margin-top: 1rem; }
        .legal-title { font-size: 1rem; }
        .legal-text { font-size: 0.875rem; line-height: 1.25rem; }
        .acknowledge-btn { padding: 14px 28px; font-size: 1rem; }
      }
    </style>
  </head>
  <body>
    <div class="app-container">
      <div class="content-wrapper">
        <div class="logo-section">
          <div class="logo">W.A.L.T.</div>
        </div>
        <div class="text-content">
          <div class="tagline">
            <p class="meet-walt">Meet W.A.L.T.</p>
            <p class="description">the World-class Authentication and Lookup Tool</p>
          </div>
          <div class="title-section">
            <h1 class="app-title">W.A.L.T. Mobile App</h1>
            <p class="version">BETA Version 1.4.0 - Live ${timestamp.substring(11, 19)}</p>
          </div>
          <div class="legal-section">
            <h2 class="legal-title">⚠️ IMPORTANT LEGAL NOTICE</h2>
            <p class="legal-text">FOR ENTERTAINMENT PURPOSES ONLY</p>
            <p class="warning">This AI application is unreliable and should not be used for financial decisions.</p>
            <details style="margin: 1rem 0;">
              <summary class="legal-summary">Read Full Legal Notice ⌄</summary>
              <div class="legal-details">
                <p style="margin-bottom: 1rem;"><strong>DISCLAIMER OF WARRANTIES:</strong> This application is provided "as is" without warranty of any kind. The AI analysis may contain errors and should not be relied upon for purchasing decisions.</p>
                <p style="margin-bottom: 1rem;"><strong>LIMITATION OF LIABILITY:</strong> We are not responsible for any financial losses resulting from the use of this application.</p>
                <p style="margin-bottom: 1rem;"><strong>ENTERTAINMENT ONLY:</strong> This tool is designed for entertainment and educational purposes. Any authentication results are estimates only.</p>
                <p><strong>DATA PRIVACY:</strong> Images uploaded may be processed by third-party AI services. Do not upload sensitive personal information.</p>
              </div>
            </details>
            <button class="acknowledge-btn" onclick="window.location.href='/overview'">I Acknowledge →</button>
          </div>
        </div>
      </div>
    </div>
    <!-- Render ID: ${randomId} at ${timestamp} -->
  </body>
</html>`;
}

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'disney-pin-authenticator',
    version: '1.4.0-nocache',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'production',
    api: {
      configured: !!process.env.MOBILE_API_KEY,
      endpoint: 'https://master.pinauth.com/mobile-upload'
    },
    cacheBuster: Math.random().toString(36).substring(7)
  });
});

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

    const apiKey = process.env.MOBILE_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        message: 'Authentication service configuration error'
      });
    }

    const formData = new FormData();
    
    const frontImageData = frontImage.replace(/^data:image\/[a-z]+;base64,/, '');
    const frontBuffer = Buffer.from(frontImageData, 'base64');
    formData.append('front_image', frontBuffer, {
      filename: 'front_image.jpg',
      contentType: 'image/jpeg'
    });
    
    if (backImage) {
      const backImageData = backImage.replace(/^data:image\/[a-z]+;base64,/, '');
      const backBuffer = Buffer.from(backImageData, 'base64');
      formData.append('back_image', backBuffer, {
        filename: 'back_image.jpg',
        contentType: 'image/jpeg'
      });
    }
    
    if (angledImage) {
      const angledImageData = angledImage.replace(/^data:image\/[a-z]+;base64,/, '');
      const angledBuffer = Buffer.from(angledImageData, 'base64');
      formData.append('angled_image', angledBuffer, {
        filename: 'angled_image.jpg',
        contentType: 'image/jpeg'
      });
    }
    
    formData.append('api_key', apiKey);
    
    const apiResponse = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      body: formData,
      headers: {
        'User-Agent': 'Disney-Pin-Authenticator/1.4.0',
        ...formData.getHeaders()
      }
    });
    
    const responseData = await apiResponse.json();
    
    res.status(200).json({
      success: true,
      message: 'Disney pin verification completed',
      sessionId: `250622${Math.floor(Date.now() / 1000)}`,
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
    version: '1.4.0-nocache',
    api: {
      configured: !!process.env.MOBILE_API_KEY,
      endpoint: 'https://master.pinauth.com/mobile-upload'
    },
    timestamp: new Date().toISOString(),
    cacheBuster: Math.random().toString(36).substring(7)
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

// Handle ALL routes - force serve complete Disney Pin Authenticator
app.get('*', (req, res) => {
  console.log(`Serving fresh Disney Pin Authenticator for route: ${req.path} at ${new Date().toISOString()}`);
  
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
  
  // Generate and serve fresh HTML content
  const htmlContent = generateDisneyPinAuthenticatorHTML();
  res.send(htmlContent);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Disney Pin Authenticator Cache-Bypass Server started`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`API Key Status: ${process.env.MOBILE_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`Master API: https://master.pinauth.com/mobile-upload`);
  console.log(`Cache Strategy: Aggressive bypass with dynamic content generation`);
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