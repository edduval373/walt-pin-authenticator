import express from "express";
import { setupVite } from "./vite";
import { createServer } from "http";

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

// Minimal health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic pin verification endpoint with real API integration
app.use(express.json({ limit: '50mb' }));
app.post('/api/verify-pin', async (req, res) => {
  try {
    const { frontImage, backImage, angledImage } = req.body;
    
    if (!frontImage) {
      return res.status(400).json({
        success: false,
        message: 'Front image is required'
      });
    }

    // Import FormData and fetch for API call
    const FormData = require('form-data');
    const fetch = require('node-fetch');
    
    const formData = new FormData();
    const frontBuffer = Buffer.from(frontImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
    formData.append('front_image', frontBuffer, 'front.jpg');
    
    if (backImage) {
      const backBuffer = Buffer.from(backImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      formData.append('back_image', backBuffer, 'back.jpg');
    }
    
    if (angledImage) {
      const angledBuffer = Buffer.from(angledImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      formData.append('angled_image', angledBuffer, 'angled.jpg');
    }

    const response = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      body: formData,
      headers: {
        'X-API-Key': process.env.MOBILE_API_KEY || 'pim_0w3nfrt5ahgc',
        ...formData.getHeaders()
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: result.message || 'API request failed'
      });
    }

    res.json({
      success: true,
      message: 'Pin verification completed',
      ...result
    });

  } catch (error) {
    console.error('Pin verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during verification'
    });
  }
});

// Mobile upload endpoint for compatibility
app.post('/mobile-upload', async (req, res) => {
  try {
    const { frontImage, backImage, angledImage } = req.body;
    
    if (!frontImage) {
      return res.status(400).json({
        success: false,
        message: 'Front image is required'
      });
    }

    const FormData = require('form-data');
    const fetch = require('node-fetch');
    
    const formData = new FormData();
    const frontBuffer = Buffer.from(frontImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
    formData.append('front_image', frontBuffer, 'front.jpg');
    
    if (backImage) {
      const backBuffer = Buffer.from(backImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      formData.append('back_image', backBuffer, 'back.jpg');
    }
    
    if (angledImage) {
      const angledBuffer = Buffer.from(angledImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      formData.append('angled_image', angledBuffer, 'angled.jpg');
    }

    const response = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      body: formData,
      headers: {
        'X-API-Key': process.env.MOBILE_API_KEY || 'pim_0w3nfrt5ahgc',
        ...formData.getHeaders()
      }
    });

    const result = await response.json();
    res.json(result);

  } catch (error) {
    console.error('Mobile upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

const server = createServer(app);

// Setup Vite to serve React UI
setupVite(app, server).catch(() => {
  // Fallback to simple HTML if Vite fails
  app.get('/', (req, res) => {
    res.send(`
      <html>
      <head><title>Disney Pin Checker</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>Disney Pin Checker</h1>
        <p>API Status: Active</p>
        <p>Ready to authenticate Disney pins</p>
      </body>
      </html>
    `);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});