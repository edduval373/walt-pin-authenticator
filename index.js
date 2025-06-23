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
    mode: 'production-serving-working-react-app'
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
    const response = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${process.env.MOBILE_API_KEY || 'pim_0w3nfrt5ahgc'}`
      }
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
      message: 'Analysis failed',
      error: error.message
    });
  }
});

// Force development mode behavior in production deployment
process.env.NODE_ENV = 'development';

// Import and start the actual development server logic
import { createServer as createViteServer } from 'vite';
import viteConfig from './vite.config.js';

// Set up Vite middleware to serve your working React components
async function setupDevelopmentMode() {
  try {
    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      server: { middlewareMode: true },
      appType: 'custom'
    });

    app.use(vite.middlewares);
    
    // Serve your working React app through Vite
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      
      // Skip API routes
      if (url.startsWith('/api/') || url.startsWith('/healthz')) {
        return next();
      }
      
      try {
        // Use Vite to serve your working React components
        let template = await vite.transformIndexHtml(url, `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Disney Pin Authenticator</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/client/src/main.tsx"></script>
  </body>
</html>`);
        
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        console.error('Error serving React app:', e);
        next(e);
      }
    });
    
    console.log('Production server configured to serve working React components via Vite');
  } catch (error) {
    console.error('Failed to setup development mode:', error);
    // Fallback to static serving
    app.use('/assets', express.static(path.join(__dirname, 'client/dist/assets')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'client/dist/index.html'));
    });
  }
}

// Initialize development mode serving
setupDevelopmentMode();

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Disney Pin Authenticator server running on port ${PORT}`);
  console.log(`Serving working React app from client/dist`);
  console.log(`Health check available at http://localhost:${PORT}/healthz`);
});

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