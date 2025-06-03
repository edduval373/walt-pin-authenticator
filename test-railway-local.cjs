// Test the railway-simple.js locally on port 3001
const express = require('express');
const https = require('https');
const http = require('http');

const app = express();

// Parse JSON with large payload support for images
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));

// CORS for mobile app
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Basic logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const responseTime = Date.now() - start;
    console.log(`${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode} ${responseTime}ms`);
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Disney Pin Checker Mobile API (Local Test)',
    version: '1.0.0'
  });
});

// Helper function to make HTTP requests
function makeRequest(url, options, postData) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Main mobile API endpoint for pin verification
app.post('/mobile-upload', async (req, res) => {
  try {
    const { frontImageBase64, backImageBase64, angledImageBase64 } = req.body;
    
    if (!frontImageBase64) {
      return res.status(400).json({ 
        success: false, 
        message: 'Front image is required' 
      });
    }

    console.log('Processing pin verification request...');
    
    // Prepare data for PIM API
    const pimData = {
      frontImageBase64,
      backImageBase64: backImageBase64 || null,
      angledImageBase64: angledImageBase64 || null
    };

    // Call PIM service
    const pimUrl = 'https://pim-master-library-production.up.railway.app/mobile-upload';
    const apiKey = process.env.PIM_STANDARD_API_KEY || 'pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g';
    
    console.log(`Calling PIM service at: ${pimUrl}`);
    
    const result = await makeRequest(pimUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      }
    }, JSON.stringify(pimData));

    if (result.status === 200 && result.data.success) {
      console.log('PIM verification successful');
      res.json(result.data);
    } else {
      console.log('PIM verification failed:', result.status, result.data);
      res.status(500).json({
        success: false,
        message: 'Pin verification service temporarily unavailable',
        details: result.data
      });
    }

  } catch (error) {
    console.error('Mobile upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during pin verification',
      error: error.message
    });
  }
});

// Start server on port 3001 for testing
const port = 3001;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Test server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
});

server.on('error', (error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});