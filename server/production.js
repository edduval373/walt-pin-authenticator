import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

// Polyfill fetch for Node.js
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

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

// API proxy endpoints for mobile app integration
app.post('/api/proxy/mobile-upload', async (req, res) => {
  try {
    const apiKey = process.env.MOBILE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'API key not configured'
      });
    }

    const response = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        success: false,
        message: `Master server error: ${response.status}`,
        error: errorText
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Connection to master server failed',
      error: errorMessage
    });
  }
});

// Health check proxy endpoint
app.get('/api/proxy/health', async (req, res) => {
  try {
    const response = await fetch('https://master.pinauth.com/health', {
      method: 'GET',
      headers: {
        'User-Agent': 'Disney-Pin-Auth-Mobile/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        success: false,
        message: `Health check failed: ${response.status}`,
        error: errorText,
        timestamp: new Date().toISOString()
      });
    }

    const data = await response.json();
    res.json({
      ...data,
      timestamp: new Date().toISOString(),
      proxyStatus: 'healthy'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Cannot connect to master server',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple mobile app interface
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Disney Pin Authenticator</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .status { padding: 20px; border-radius: 8px; margin: 20px 0; }
        .success { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .info { background-color: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        .endpoint { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .code { font-family: monospace; background-color: #e9ecef; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏰 Disney Pin Authenticator</h1>
        <p>Mobile API Server - Production Environment</p>
    </div>
    
    <div class="status success">
        <strong>✓ Server Status:</strong> Online and ready for mobile app connections
    </div>
    
    <div class="status info">
        <strong>📱 Mobile App Integration:</strong> This server provides API endpoints for the Disney Pin Authenticator mobile application.
    </div>
    
    <h3>Available Endpoints:</h3>
    
    <div class="endpoint">
        <strong>POST /api/proxy/mobile-upload</strong><br>
        Submit Disney pin images for authentication<br>
        <em>Requires x-api-key header and image data</em>
    </div>
    
    <div class="endpoint">
        <strong>GET /api/proxy/health</strong><br>
        Check master server connectivity status
    </div>
    
    <div class="endpoint">
        <strong>POST /mobile-upload</strong><br>
        Direct mobile upload endpoint<br>
        <em>Compatible with master.pinauth.com API format</em>
    </div>
    
    <h3>API Configuration:</h3>
    <p>API Key: ${process.env.MOBILE_API_KEY ? '✓ Configured' : '✗ Missing'}</p>
    <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
    <p>Server Time: ${new Date().toISOString()}</p>
    
    <div class="status info">
        <strong>📋 For Mobile Developers:</strong><br>
        Use endpoint <span class="code">POST /api/proxy/mobile-upload</span> for pin authentication.<br>
        Include session ID and base64 image data in request body.<br>
        Server forwards requests to master.pinauth.com and returns authentic results.
    </div>
</body>
</html>
  `);
});

// Handle all other routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/mobile-upload')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Redirect to home page for any unmatched route
  res.redirect('/');
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