import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import { log } from "./vite";

// Set up multer for file uploads
const storage_multer = multer.memoryStorage();
const upload = multer({ 
  storage: storage_multer,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// PIM Standard API configuration with environment support
const API_ENVIRONMENTS = {
  development: {
    // Try both known endpoints in development environment
    baseUrls: [
      "https://master.pinauth.com", // Use master.pinauth.com as primary
      "https://api.pinmaster.railway.app"       
    ],
    apiKey: "pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g"
  },
  production: {
    baseUrls: [
      process.env.PIM_API_URL || "https://master.pinauth.com",
      "https://api.pinmaster.railway.app"
    ],
    apiKey: process.env.PIM_API_KEY || "pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g"
  },
  testing: {
    baseUrls: ["https://master.pinauth.com"],
    apiKey: "pim_test_key"
  }
};

// Select the environment based on NODE_ENV or default to development
const currentEnv = (process.env.API_ENVIRONMENT || process.env.NODE_ENV || 'development') as keyof typeof API_ENVIRONMENTS;
const apiConfig = API_ENVIRONMENTS[currentEnv] || API_ENVIRONMENTS.development;

// Log which environment we're using
log(`Using PIM API environment: ${currentEnv}`, 'express');
log(`Available API base URLs: ${apiConfig.baseUrls.join(', ')}`, 'express');

// Create endpoint URLs (we'll try these in sequence if one fails)
const PIM_API_BASE_URLS = apiConfig.baseUrls;
const PIM_STANDARD_API_URLS = PIM_API_BASE_URLS.map(url => `${url}/mobile-upload`);
const PIM_STANDARD_DEBUG_API_URL = `${PIM_API_BASE_URLS[0]}/api/status`;
const PIM_STANDARD_OLD_API_URL = `${PIM_API_BASE_URLS[0]}/api/mobile/minimal/verify`;

// Use the API key from the selected environment or environment variable
const PIM_STANDARD_API_KEY = process.env.PIM_STANDARD_API_KEY || apiConfig.apiKey;



// Log API key status at startup
if (PIM_STANDARD_API_KEY) {
  log("PIM Standard API key configured successfully");
} else {
  log("WARNING: PIM Standard API key not configured");
}

// Timeout for API requests in ms (20 seconds)
const API_TIMEOUT = 20000;

interface PimStandardResponse {
  success: boolean;
  message: string;
  sessionId?: string;
  timestamp?: string;
  authentic?: boolean;
  authenticityRating?: number;
  analysis?: string;
  identification?: string;
  pricing?: string;
  // For backward compatibility
  pinId?: string;
  analysisReport?: string;
  aiFindings?: string;
  pinIdHtml?: string;
  pricingHtml?: string;
  [key: string]: any; // Allow for additional properties
}

/**
 * Analyze pin images using the PIM Standard API
 * Will try multiple endpoints if available
 */
async function analyzeImageForPin(frontImageBase64: string, backImageBase64?: string, angledImageBase64?: string): Promise<PimStandardResponse> {
  // Ensure API key is configured
  if (!PIM_STANDARD_API_KEY) {
    log(`ERROR: PIM Standard API key not configured`);
    throw new Error("PIM Standard API key not configured");
  }
  
  try {
    // Ensure the frontImageBase64 doesn't have the data prefix
    const cleanFrontImage = frontImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Generate session ID in YYMMDDHHMMSS format (12 digits)
    const now = new Date();
    const sessionId = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    // Prepare the request body according to deployed API format
    const requestBody: Record<string, any> = {
      sessionId: sessionId,
      frontImageData: cleanFrontImage
    };
    
    // Add back and angled images if provided
    if (backImageBase64) {
      requestBody.backImageData = backImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    }
    
    if (angledImageBase64) {
      requestBody.angledImageData = angledImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    }
    
    // Log the image sizes and data samples for debugging
    log(`Image sizes - Front: ${cleanFrontImage.length} chars, Back: ${requestBody.backImageData ? requestBody.backImageData.length : 'N/A'} chars, Angled: ${requestBody.angledImageData ? requestBody.angledImageData.length : 'N/A'} chars`, 'express');
    
    // Log sample of image data and API key being used
    log(`API Key from secrets: ${PIM_STANDARD_API_KEY ? PIM_STANDARD_API_KEY.substring(0, 10) + '...' : 'NOT FOUND'}`, 'express');
    log(`Front image data sample: ${cleanFrontImage.substring(0, 30)}...`, 'express');
    
    // Try each API endpoint in sequence until one succeeds
    let lastError: Error | null = null;
    
    for (const apiUrl of PIM_STANDARD_API_URLS) {
      try {
        log(`Trying API endpoint: ${apiUrl}`, 'express');
        log(`Session ID being sent: ${sessionId}`, 'express');
        log(`Request body: ${JSON.stringify(requestBody).substring(0, 200)}...`, 'express');
        
        // Make the API call to this endpoint
        const apiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': PIM_STANDARD_API_KEY
          },
          body: JSON.stringify(requestBody)
        });
        
        log(`Response status: ${apiResponse.status}`, 'express');
    
        // Check if the response is OK
        if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          log(`API Error (${apiResponse.status}): ${errorText}`, 'express');
          log(`API Request details:
            URL: ${apiUrl}
            Method: POST
            Headers: Content-Type: application/json, X-API-Key: ${PIM_STANDARD_API_KEY}
            Body keys: ${Object.keys(requestBody).join(', ')}
            Has image data: ${!!requestBody.frontImageBase64}
            Front image data length: ${requestBody.frontImageBase64?.length || 0}
          `, 'express');
          
          // Save this error but try the next endpoint
          lastError = new Error(`API Error: ${apiResponse.status} ${errorText}`);
          continue; // Try the next endpoint
        }
        
        // Parse the response
        const data = await apiResponse.json() as PimStandardResponse;
        log(`API Response success: ${data.success}, message: ${data.message}`, 'express');
        
        // Map the response to include necessary fields for our app
        const response: PimStandardResponse = {
          success: data.success,
          message: data.message || "Verification completed",
          sessionId: data.sessionId || `session_${Date.now()}`,
          timestamp: data.timestamp || new Date().toISOString(),
          authentic: typeof data.authentic === 'boolean' ? data.authentic : true,
          authenticityRating: data.authenticityRating !== undefined ? data.authenticityRating : 4,
          
          // Use provided data or fallback to formatting the response
          analysis: data.analysis || data.aiFindings || "",
          identification: data.identification || data.pinId || "",
          pricing: data.pricing || "",
          analysisReport: data.analysisReport || data.analysis || ""
        };
        
        // We got a successful response, return it
        return response;
        
      } catch (innerError: any) {
        // Log the error but continue to the next endpoint
        log(`Error with endpoint ${apiUrl}: ${innerError.message}`, 'express');
        lastError = innerError;
      }
    }
    
    // If we reach here, all endpoints failed
    if (lastError) {
      log(`All API endpoints failed. Last error: ${lastError.message}`, 'express');
      throw lastError;
    } else {
      throw new Error("All API endpoints failed with unknown errors");
    }
  } catch (error: any) {
    log(`Error in PIM API call: ${error.message || error}`, 'express');
    throw error;
  }
}

/**
 * Register all routes for the Express application
 */
export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Simple health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  });
  
  // Add endpoint to get current API configuration (without exposing the actual key)
  app.get('/api/config', (req, res) => {
    res.json({
      environment: currentEnv,
      baseUrl: PIM_API_BASE_URLS[0],
      endpoints: {
        directVerify: '/mobile-upload',
        status: '/api/status'
      },
      hasApiKey: !!PIM_STANDARD_API_KEY
    });
  });
  
  // Verify pin using PIM Standard API - Direct endpoint
  app.post('/api/mobile/direct-verify', async (req, res) => {
    try {
      // Log request details
      const requestId = `req_${Date.now()}`;
      log(`Processing pin verification request`);
      log(`Request ID: ${requestId}, Source: ${req.query.source || 'api'}`);
      
      // Extract image data from request
      const { frontImageBase64, backImageBase64, angledImageBase64 } = req.body;
      
      // Validate front image is provided
      if (!frontImageBase64) {
        return res.status(400).json({
          success: false,
          message: "Front image is required for verification",
          requestId
        });
      }
      
      log(`Processing images - Front: ${frontImageBase64.length.toString().substring(0, 6)} chars, Back: ${backImageBase64 ? 'Provided' : 'N/A'}, Angled: ${angledImageBase64 ? 'Provided' : 'N/A'}`);
      
      // Call the PIM Standard API to analyze the images
      try {
        const analysisResult: PimStandardResponse = await analyzeImageForPin(
          frontImageBase64,
          backImageBase64,
          angledImageBase64
        );
        
        return res.json({
          ...analysisResult,
          requestId
        });
      } catch (error: any) {
        log(`Error in pin authentication: ${error.message}`);
        return res.status(500).json({
          success: false,
          message: "Verification completed unsuccessfully",
          errorCode: "processing_error",
          requestId
        });
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Server error processing verification request",
        errorCode: "server_error"
      });
    }
  });
  
  // API Test Endpoint
  app.get('/api/test-connection', async (req, res) => {
    try {
      // Make a simple request to the API status endpoint
      const response = await fetch(PIM_STANDARD_DEBUG_API_URL, {
        headers: {
          'X-API-Key': PIM_STANDARD_API_KEY
        }
      });
      
      if (response.ok) {
        return res.json({
          success: true,
          message: "Successfully connected to PIM Standard API",
          statusCode: response.status,
          endpoint: PIM_STANDARD_DEBUG_API_URL
        });
      } else {
        return res.json({
          success: false,
          message: `Failed to connect to PIM Standard API: ${response.status} ${response.statusText}`,
          statusCode: response.status,
          endpoint: PIM_STANDARD_DEBUG_API_URL
        });
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: `Error testing API connection: ${error.message}`,
        endpoint: PIM_STANDARD_DEBUG_API_URL
      });
    }
  });
  
  // Setup global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    log(`ERROR: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  });
  
  return httpServer;
}