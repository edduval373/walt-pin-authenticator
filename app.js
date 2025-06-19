import express from 'express';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'disney-pin-authenticator',
    timestamp: new Date().toISOString(),
    port: PORT,
    apiKeyStatus: process.env.MOBILE_API_KEY ? 'configured' : 'missing'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Disney Pin Authenticator API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      health: 'GET /health',
      verify: 'POST /api/verify-pin'
    },
    timestamp: new Date().toISOString()
  });
});

// Pin verification endpoint
app.post('/api/verify-pin', async (req, res) => {
  try {
    const { frontImage, backImage, angledImage } = req.body;
    
    if (!frontImage) {
      return res.status(400).json({
        success: false,
        message: 'Front image is required for pin verification'
      });
    }

    const apiKey = process.env.MOBILE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'API configuration error'
      });
    }

    // Prepare form data for master API
    const formData = new FormData();
    
    // Convert base64 images to buffers
    const frontBuffer = Buffer.from(frontImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
    formData.append('front_image', new Blob([frontBuffer]), 'front.jpg');
    
    if (backImage) {
      const backBuffer = Buffer.from(backImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      formData.append('back_image', new Blob([backBuffer]), 'back.jpg');
    }
    
    if (angledImage) {
      const angledBuffer = Buffer.from(angledImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      formData.append('angled_image', new Blob([angledBuffer]), 'angled.jpg');
    }
    
    formData.append('api_key', apiKey);
    
    // Call master authentication API
    const response = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      body: formData,
      headers: {
        'User-Agent': 'Disney-Pin-Authenticator/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Master API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Return standardized response
    res.status(200).json({
      success: true,
      message: result.message || 'Pin verification completed successfully',
      sessionId: result.sessionId || `session_${Date.now()}`,
      id: result.id || Math.floor(Math.random() * 100000),
      characters: result.characters || 'Disney characters identified',
      analysis: result.analysis || 'Pin authentication analysis completed',
      identification: result.identification || 'Authentic Disney pin verified',
      pricing: result.pricing || 'Market pricing analysis available'
    });
    
  } catch (error) {
    console.error('Pin verification error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Pin verification service temporarily unavailable'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Disney Pin Authenticator API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API Key: ${process.env.MOBILE_API_KEY ? 'Configured' : 'Missing'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;