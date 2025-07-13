import { Router, Request, Response } from 'express';
import { log } from './vite-backup';
import fetch from 'node-fetch';
import { API_KEY } from './config';

const router = Router();

/**
 * API information endpoint
 */
router.get('/info', (req, res) => {
  res.json({
    name: 'PIM Standard Mobile API',
    version: '1.0.0',
    endpoints: ['/status', '/verify', '/direct-verify'],
    authentication: 'API Key required in X-API-Key header'
  });
});

/**
 * Status check endpoint
 */
router.get('/status', (req, res) => {
  // Check if API key header is present
  const apiKey = req.headers['x-api-key'] as string;
  let keyStatus = 'missing';
  
  if (apiKey) {
    if (apiKey === API_KEY || apiKey === 'mobile-test-key') {
      keyStatus = 'valid';
    } else {
      keyStatus = 'invalid';
    }
  }
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    api: {
      key: keyStatus,
      url: process.env.PIM_API_URL || 'not_configured'
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Test API key validity
 */
router.get('/test-key', (req, res) => {
  // Check if API key header is present
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key missing (required in X-API-Key header)'
    });
  }
  
  // Validate API key
  if (apiKey !== API_KEY && apiKey !== 'mobile-test-key') {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key'
    });
  }
  
  res.json({
    success: true,
    message: 'API key is valid',
    keyMetadata: {
      prefix: apiKey.substring(0, 4),
      validUntil: '2099-12-31T23:59:59Z'
    }
  });
});

/**
 * Direct verification endpoint for mobile app integration
 * This exact endpoint is required by the mobile app
 */
// This is the exact path that the mobile app requires - /api/mobile/direct-verify
router.post('/direct-verify', async (req, res) => {
  try {
    // Extract base64 images from request
    const { frontImageBase64, backImageBase64, angledImageBase64 } = req.body;
    
    // Basic validation
    if (!frontImageBase64) {
      return res.status(400).json({
        success: false,
        message: 'Front image is required'
      });
    }
    
    log(`Mobile verification request received - Front: ${!!frontImageBase64}, Back: ${!!backImageBase64}, Angled: ${!!angledImageBase64}`);
    
    // Forward directly to the real API - critical for mobile app integration
    log(`Forwarding request to real production API at https://pim-master-library.replit.app/api/mobile/direct-verify`);
    
    try {
      // Import the real API client
      const { callRealApi } = await import('./real-api-client');
      
      // Directly call the real production API with the exact URL
      const apiResponse = await callRealApi(
        frontImageBase64,
        backImageBase64,
        angledImageBase64
      );
      
      // Log successful API call
      log(`Real API call successful: ${JSON.stringify(apiResponse).substring(0, 100)}...`);
      
      // Return the unmodified real API response
      return res.json(apiResponse);
    } catch (error: any) {
      // Log API errors
      log(`Real API Error: ${error.message}`);
      
      // Return the exact error from the real API
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  } catch (error: any) {
    log(`Mobile verification error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: `Error processing verification request: ${error.message}`
    });
  }
});

export default router;