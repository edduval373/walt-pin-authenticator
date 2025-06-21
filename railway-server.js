#!/usr/bin/env node

/**
 * Railway-specific Disney Pin Authenticator Server
 * Forces correct content delivery regardless of other configurations
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

// Disney Pin Authenticator HTML content
const DISNEY_PIN_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>Disney Pin Authenticator - W.A.L.T.</title>
    <meta name="description" content="Authenticate your Disney pins with advanced AI image recognition technology" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { width: 100%; height: 100%; font-family: system-ui, -apple-system, sans-serif; }
      #root { width: 100%; height: 100vh; display: flex; justify-content: center; align-items: center; background: linear-gradient(to bottom, #eef2ff, #e0e7ff); }
      .intro-container { position: fixed; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 0px; transform: translateY(-110px); }
      .content-wrapper { text-align: center; padding: 0 1rem; max-width: 24rem; width: 100%; padding-top: 0.5rem; min-height: 100vh; display: flex; flex-direction: column; }
      .logo-container { margin-bottom: 0.5rem; }
      .logo { width: 437px; height: 437px; object-fit: contain; margin: 0 auto; display: block; }
      .text-content { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; transform: translateY(-146px); }
      .tagline { margin-bottom: 0.75rem; text-align: center; }
      .meet-walt { color: #4f46e5; font-size: 1.875rem; line-height: 2.25rem; font-weight: 500; margin-bottom: 0.75rem; }
      .description { color: #4f46e5; font-size: 1.25rem; line-height: 1.75rem; }
      .title-section { margin-bottom: 1rem; text-align: center; }
      .app-title { font-size: 1.875rem; line-height: 2.25rem; font-weight: 700; color: #4338ca; letter-spacing: -0.025em; margin-bottom: 0.5rem; }
      .version { font-size: 0.875rem; line-height: 1.25rem; color: #4f46e5; font-weight: 600; }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="intro-container">
        <div class="content-wrapper">
          <div class="logo-container">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="W.A.L.T. Logo" class="logo" />
          </div>
          <div class="text-content">
            <div class="tagline">
              <p class="meet-walt">Meet W.A.L.T.</p>
              <p class="description">the World-class Authentication and Lookup Tool</p>
            </div>
            <div class="title-section">
              <h1 class="app-title">W.A.L.T. Mobile App</h1>
              <p class="version">BETA Version 1.3.2</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;

// Force serve Disney Pin Authenticator for ALL routes
app.get('*', (req, res) => {
  console.log(\`Serving Disney Pin Authenticator for: \${req.path}\`);
  
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Always serve Disney Pin Authenticator
  res.send(DISNEY_PIN_HTML);
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

    // Prepare API request
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
        'User-Agent': 'Disney-Pin-Authenticator/1.0.0',
        ...formData.getHeaders()
      }
    });
    
    const responseData = await apiResponse.json();
    
    res.status(200).json({
      success: true,
      message: 'Disney pin verification completed',
      sessionId: \`250621\${Math.floor(Date.now() / 1000)}\`,
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

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Disney Pin Authenticator Server Started\`);
  console.log(\`Port: \${PORT}\`);
  console.log(\`Environment: \${process.env.NODE_ENV || 'production'}\`);
  console.log(\`API Status: \${process.env.MOBILE_API_KEY ? 'Configured' : 'Missing'}\`);
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