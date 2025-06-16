import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Set production environment
process.env.NODE_ENV = "production";

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

// Mobile upload endpoint for direct API access
app.post('/mobile-upload', async (req, res) => {
  try {
    const { sessionId, frontImageData, backImageData, angledImageData } = req.body;
    
    // Validate API key
    const apiKey = req.headers['x-api-key'];
    const expectedApiKey = process.env.MOBILE_API_KEY;
    if (!expectedApiKey || apiKey !== expectedApiKey) {
      return res.status(401).json({
        success: false,
        error: "Invalid API key"
      });
    }
    
    // Validate required fields
    if (!sessionId || !frontImageData) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: sessionId and frontImageData"
      });
    }
    
    // Clean base64 data
    const cleanFrontImage = frontImageData.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const cleanBackImage = backImageData ? backImageData.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '') : null;
    const cleanAngledImage = angledImageData ? angledImageData.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '') : null;
    
    const requestBody = {
      sessionId,
      frontImageData: `data:image/png;base64,${cleanFrontImage}`
    };
    
    if (cleanBackImage) {
      requestBody.backImageData = `data:image/png;base64,${cleanBackImage}`;
    }
    
    if (cleanAngledImage) {
      requestBody.angledImageData = `data:image/png;base64,${cleanAngledImage}`;
    }
    
    // Forward to master server
    console.log(`[mobile-upload] Forwarding request to master server with sessionId: ${sessionId}`);
    
    try {
      const response = await Promise.race([
        fetch('https://master.pinauth.com/mobile-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': expectedApiKey
          },
          body: JSON.stringify(requestBody)
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Master server timeout')), 30000)
        )
      ]);
      
      console.log(`[mobile-upload] Master server response status: ${response.status}`);
      
      const jsonResponse = await response.json();
      
      // Return the master server response directly
      return res.json({
        success: true,
        message: "Pin analysis completed successfully",
        sessionId,
        id: jsonResponse.id || Date.now(),
        timestamp: new Date().toISOString(),
        authentic: jsonResponse.authentic || false,
        authenticityRating: jsonResponse.authenticityRating || 0,
        analysis: jsonResponse.analysis || '',
        identification: jsonResponse.identification || '',
        pricing: jsonResponse.pricing || ''
      });
      
    } catch (error) {
      console.log(`[mobile-upload] Master server error: ${error.message}`);
      return res.status(503).json({
        success: false,
        error: "Master server unavailable",
        message: "Please try again when the authentication service is available"
      });
    }
    
  } catch (error) {
    console.error('Mobile upload error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../dist/public')));

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (!res.headersSent) {
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Production server running on port ${port}`);
});