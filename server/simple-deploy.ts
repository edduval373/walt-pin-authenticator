import express from "express";
import { serveStatic } from "./vite";

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API endpoints
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

// Serve static files for production
serveStatic(app);

app.listen(port, '0.0.0.0', () => {
  console.log(`Disney Pin Authenticator serving on port ${port}`);
});