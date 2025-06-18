// Simple production server for Railway deployment
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Increase JSON body size limit for image uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'walt-pin-authenticator',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000
  });
});

// Mobile upload endpoint - direct proxy to master server
app.post('/mobile-upload', async (req, res) => {
  try {
    const { sessionId, frontImageData, backImageData, angledImageData } = req.body;
    
    if (!sessionId || !frontImageData) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: sessionId and frontImageData"
      });
    }
    
    // Validate session ID format (12-digit)
    if (!/^\d{12}$/.test(sessionId)) {
      return res.status(400).json({
        success: false,
        error: "Session ID must be 12-digit format"
      });
    }
    
    // Prepare request to master server
    const requestBody: any = {
      sessionId,
      frontImageData
    };
    
    if (backImageData) {
      requestBody.backImageData = backImageData;
    }
    
    if (angledImageData) {
      requestBody.angledImageData = angledImageData;
    }
    
    // Forward to master server
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VITE_MOBILE_API_KEY || 'pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g'
      },
      body: JSON.stringify(requestBody)
    });
    
    const result = await response.json();
    res.json(result);
  } catch (error: any) {
    console.error('Mobile upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during pin analysis'
    });
  }
});

// Serve static files from dist/public
const distPath = path.resolve(__dirname, '..', 'dist', 'public');
app.use(express.static(distPath));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const port = parseInt(process.env.PORT || '5000', 10);
app.listen(port, '0.0.0.0', () => {
  console.log(`Production server running on port ${port}`);
});