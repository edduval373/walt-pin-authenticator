/**
 * Simplified Disney Pin Authenticator Server
 * Core functionality: Camera access + API communication
 * No complex database operations
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'client/dist')));

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/healthz', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Main API endpoint for pin analysis
app.post('/api/analyze-pin', async (req, res) => {
  try {
    const { frontImage, backImage, angledImage } = req.body;
    
    if (!frontImage) {
      return res.status(400).json({ 
        success: false, 
        message: 'Front image is required' 
      });
    }

    // Call the real authentication API
    const apiResponse = await callAuthenticationAPI(frontImage, backImage, angledImage);
    
    res.json(apiResponse);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Analysis failed. Please try again.' 
    });
  }
});

// Function to call the real authentication API
async function callAuthenticationAPI(frontImage, backImage, angledImage) {
  const fetch = (await import('node-fetch')).default;
  
  const apiUrl = process.env.PIM_API_URL || 'https://master.pinauth.com/mobile-upload';
  const apiKey = process.env.MOBILE_API_KEY || 'pim_0w3nfrt5ahgc';
  
  const payload = {
    frontImage: frontImage,
    backImage: backImage || null,
    angledImage: angledImage || null,
    apiKey: apiKey,
    timestamp: new Date().toISOString()
  };
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Disney-Pin-Authenticator/1.0'
      },
      body: JSON.stringify(payload),
      timeout: 30000
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const result = await response.json();
    
    // Return standardized response
    return {
      success: true,
      message: result.message || 'Analysis completed successfully',
      authentic: result.authentic || false,
      authenticityRating: result.authenticityRating || 0,
      analysis: result.analysis || 'Analysis completed',
      identification: result.identification || 'Disney Pin',
      pricing: result.pricing || 'Value assessment unavailable',
      sessionId: result.sessionId || `session_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('API call failed:', error);
    
    // Return fallback response
    return {
      success: false,
      message: 'Unable to connect to authentication service. Please try again later.',
      error: error.message
    };
  }
}

// Serve the React app for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'client/dist/index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application not found. Please ensure the build files exist.');
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

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Disney Pin Authenticator running on port ${port}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔗 API endpoint: ${process.env.PIM_API_URL || 'https://master.pinauth.com/mobile-upload'}`);
});