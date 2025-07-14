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

// API proxy health check endpoint
app.get('/api/proxy/health', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://master.pinauth.com/health', {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      res.json(data);
    } else {
      res.status(response.status).json({
        status: 'error',
        message: `Master server health check failed with status ${response.status}`
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Unable to reach master server',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
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
    
    // Remove data URI prefixes from base64 strings as required by master server
    const cleanFrontImage = frontImageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const cleanBackImage = backImageData ? backImageData.replace(/^data:image\/[a-z]+;base64,/, '') : null;
    const cleanAngledImage = angledImageData ? angledImageData.replace(/^data:image\/[a-z]+;base64,/, '') : null;
    
    // Prepare request exactly as specified by master app
    const requestBody = {
      sessionId,
      frontImageData: cleanFrontImage,
      backImageData: cleanBackImage,
      angledImageData: cleanAngledImage,
      requireApproval: false,
      prompts: {}
    };
    
    // Forward to master server with streaming support and end-of-transmission protocol
    const fetch = (await import('node-fetch')).default;
    
    // Set up streaming response with 180-second timeout as specified by master app
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout for AI processing
    
    try {
      const response = await fetch('https://master.pinauth.com/mobile-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.VITE_MOBILE_API_KEY || 'pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g',
          'Accept': 'application/json',
          'Connection': 'keep-alive'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Master server responded with status ${response.status}`);
      }
      
      // Wait for complete response - master server will send EOT marker when done
      const result = await response.json();
      
      // Log the complete response for debugging
      console.log('Master server complete response:', JSON.stringify(result, null, 2));
      
      res.json(result);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error: any) {
    console.error('Mobile upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during pin analysis'
    });
  }
});

// Serve static files from the correct Vite build directory
app.use(express.static(path.join(__dirname, '../dist/public')));

// Catch-all handler for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public', 'index.html'));
});

// Start server if this file is run directly (for Railway deployment)
if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = parseInt(process.env.PORT || '5000', 10);
  app.listen(PORT, () => {
    console.log(`Production server running on port ${PORT}`);
  });
}

// Also export as middleware for development
export default app;