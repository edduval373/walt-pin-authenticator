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
  recordNumber?: number;
  recordId?: number;
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
        log(`API Response record fields: recordNumber=${data.recordNumber}, recordId=${data.recordId}, sessionId=${data.sessionId}`, 'express');
        log(`Full API Response: ${JSON.stringify(data, null, 2).substring(0, 500)}...`, 'express');
        
        // Map the response to include necessary fields for our app
        const response: PimStandardResponse = {
          success: data.success,
          message: data.message || "Verification completed",
          sessionId: data.sessionId || `session_${Date.now()}`,
          recordNumber: data.recordNumber || data.recordId,
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
    
    // Return a clear error response indicating API unavailability
    return {
      success: false,
      message: "External authentication API currently unavailable. Please contact support for manual verification.",
      authentic: false,
      authenticityRating: 0,
      analysis: "Unable to process - External API service unavailable",
      identification: "Service unavailable",
      pricing: "Unable to determine",
      sessionId: `error_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
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
  
  // Mobile API endpoints for app integration
  
  // POST /api/mobile/verify-pin - Submit images, get pin IDs + analysis
  app.post('/api/mobile/verify-pin', async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] || `session_${Date.now()}`;
      const requestId = `req_${Date.now()}`;
      
      log(`Processing mobile pin verification - Session: ${sessionId}, Request: ${requestId}`);
      
      // Extract image data from request
      const { frontImageBase64, backImageBase64, angledImageBase64 } = req.body;
      
      // Validate front image is provided
      if (!frontImageBase64) {
        return res.status(400).json({
          success: false,
          message: "Front image is required for verification",
          requestId,
          sessionId
        });
      }
      
      log(`Processing images - Front: ${frontImageBase64.length.toString().substring(0, 6)} chars`);
      
      // Call the PIM Standard API to analyze the images
      const analysisResult: PimStandardResponse = await analyzeImageForPin(
        frontImageBase64,
        backImageBase64,
        angledImageBase64
      );
      
      // If the API call failed, don't proceed with database storage
      if (!analysisResult.success) {
        return res.status(503).json({
          success: false,
          message: analysisResult.message,
          errorCode: "external_api_unavailable",
          sessionId,
          requestId
        });
      }
      
      // Create a provisional pin record with analysis results
      const pinId = analysisResult.sessionId || `pin_${Date.now()}`;
      
      // Store the pin with provisional status and get the actual database record
      const createdPin = await storage.createPin({
        pinId,
        name: `Mobile Analysis ${pinId}`,
        series: 'Mobile App Results',
        releaseYear: new Date().getFullYear(),
        imageUrl: '',
        dominantColors: [],
        similarPins: []
      });
      
      // The ID is the actual database ID
      const id = createdPin.id;
      
      // Create analysis record
      await storage.createAnalysis({
        imageBlob: frontImageBase64.substring(0, 1000), // Store truncated for record keeping
        pinId,
        confidence: analysisResult.authenticityRating || 0,
        factors: { analysis: analysisResult.analysis || '' },
        colorMatchPercentage: 75,
        databaseMatchCount: 1,
        imageQualityScore: 85
      });
      
      log(`Created pin record: ${pinId} with ID: ${id}`);
      
      return res.json({
        success: true,
        pinId,
        id,
        sessionId,
        requestId,
        authentic: analysisResult.authentic,
        authenticityRating: analysisResult.authenticityRating,
        analysis: analysisResult.analysis,
        identification: analysisResult.identification,
        pricing: analysisResult.pricing,
        message: "Pin analysis complete - awaiting user confirmation"
      });
      
    } catch (error: any) {
      log(`Error in mobile pin verification: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: "Verification failed",
        errorCode: "processing_error"
      });
    }
  });

  // POST /api/mobile/confirm-pin - Confirm or reject provisional pins using ID
  app.post('/api/mobile/confirm-pin', async (req, res) => {
    try {
      const { id, pinId, userAgreement, feedbackComment } = req.body;
      const sessionId = req.headers['x-session-id'];
      
      log(`Processing pin confirmation - ID: ${id}, Pin: ${pinId}, Agreement: ${userAgreement}`);
      
      // Validate required fields
      if (!id || !pinId || !userAgreement) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: id, pinId, and userAgreement are required"
        });
      }

      // Validate userAgreement value
      if (userAgreement !== 'agree' && userAgreement !== 'disagree') {
        return res.status(400).json({
          success: false,
          message: "userAgreement must be either 'agree' or 'disagree'"
        });
      }

      // Update pin with user feedback using ID (database ID) from master app
      const updatedPin = await storage.updatePinFeedbackById(id, userAgreement, feedbackComment);

      if (!updatedPin) {
        return res.status(404).json({
          success: false,
          message: `Pin not found for ID: ${id}`
        });
      }

      // Create feedback record with ID
      try {
        await storage.createUserFeedback({
          analysisId: id, // Use ID as analysis ID for mobile tracking
          pinId,
          userAgreement,
          feedbackComment: feedbackComment || null
        });
      } catch (feedbackError) {
        log(`Warning: Could not create feedback record for ID ${id}: ${feedbackError}`);
      }

      log(`Mobile user feedback confirmed - ID: ${id}, Agreement: ${userAgreement}`);

      return res.json({
        success: true,
        message: "Pin confirmation saved successfully",
        id,
        pinId: updatedPin.pinId,
        userAgreement: updatedPin.userAgreement,
        feedbackComment: updatedPin.feedbackComment,
        timestamp: updatedPin.feedbackSubmittedAt,
        sessionId
      });

    } catch (error: any) {
      log(`Error saving mobile pin confirmation: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: "Failed to save pin confirmation",
        error: error.message
      });
    }
  });

  // GET /api/mobile/provisional-pins - Retrieve pending pins for cleanup
  app.get('/api/mobile/provisional-pins', async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'];
      
      // Get all pins without user feedback (provisional pins)
      const allPins = await storage.getAllPins();
      const provisionalPins = allPins.filter(pin => !pin.userAgreement);
      
      log(`Retrieved ${provisionalPins.length} provisional pins for session: ${sessionId}`);
      
      return res.json({
        success: true,
        provisionalPins: provisionalPins.map(pin => ({
          pinId: pin.pinId,
          recordNumber: pin.id, // Use database ID as record number
          name: pin.name,
          createdAt: pin.createdAt,
          sessionId
        })),
        total: provisionalPins.length,
        sessionId
      });
      
    } catch (error: any) {
      log(`Error retrieving provisional pins: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve provisional pins",
        error: error.message
      });
    }
  });

  // Legacy endpoint for backward compatibility
  app.post('/api/mobile/direct-verify', async (req, res) => {
    try {
      // Redirect to new verify-pin endpoint
      req.url = '/api/mobile/verify-pin';
      return app._router.handle(req, res);
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

  // User Feedback endpoints for preserving agreement/disagreement with AI analysis
  app.post('/api/feedback', async (req, res) => {
    try {
      const { analysisId, pinId, userAgreement, feedbackComment } = req.body;
      
      // Validate required fields
      if (!pinId || !userAgreement) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: pinId and userAgreement are required"
        });
      }

      // Validate userAgreement value
      if (userAgreement !== 'agree' && userAgreement !== 'disagree') {
        return res.status(400).json({
          success: false,
          message: "userAgreement must be either 'agree' or 'disagree'"
        });
      }

      // Check if pin exists, if not create it
      let existingPin = await storage.getPinById(pinId);
      
      if (!existingPin) {
        // Create a new pin record for this analysis session
        const newPin = await storage.createPin({
          pinId,
          name: `Analysis Session ${pinId}`,
          series: 'Analysis Results',
          releaseYear: new Date().getFullYear(),
          imageUrl: '',
          dominantColors: [],
          similarPins: []
        });
        log(`Created new pin record for feedback: ${pinId}`);
        existingPin = newPin;
      }

      // Update pin with feedback
      const updatedPin = await storage.updatePinFeedback(pinId, userAgreement, feedbackComment);

      if (!updatedPin) {
        return res.status(500).json({
          success: false,
          message: "Failed to update pin with feedback"
        });
      }

      // Also create a feedback record in the user_feedback table for analytics
      try {
        await storage.createUserFeedback({
          analysisId: parseInt(analysisId) || 0,
          pinId,
          userAgreement,
          feedbackComment: feedbackComment || null
        });
      } catch (feedbackError) {
        log(`Warning: Could not create feedback record: ${feedbackError}`);
      }

      log(`User feedback saved: ${userAgreement} for pin ${pinId}`);

      res.json({
        success: true,
        message: "Feedback saved successfully",
        pinId: updatedPin.pinId,
        userAgreement: updatedPin.userAgreement,
        feedbackComment: updatedPin.feedbackComment,
        timestamp: updatedPin.feedbackSubmittedAt
      });

    } catch (error: any) {
      log(`Error saving user feedback: ${error.message}`);
      res.status(500).json({
        success: false,
        message: "Failed to save feedback",
        error: error.message
      });
    }
  });

  // Get feedback for a specific analysis
  app.get('/api/feedback/analysis/:analysisId', async (req, res) => {
    try {
      const analysisId = parseInt(req.params.analysisId);
      const feedback = await storage.getFeedbackByAnalysisId(analysisId);
      
      res.json({
        success: true,
        feedback,
        count: feedback.length
      });
    } catch (error: any) {
      log(`Error retrieving feedback: ${error.message}`);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve feedback",
        error: error.message
      });
    }
  });

  // Get all user feedback (for admin/analytics)
  app.get('/api/feedback/all', async (req, res) => {
    try {
      const allFeedback = await storage.getAllUserFeedback();
      
      res.json({
        success: true,
        feedback: allFeedback,
        total: allFeedback.length,
        agreementStats: {
          agree: allFeedback.filter(f => f.userAgreement === 'agree').length,
          disagree: allFeedback.filter(f => f.userAgreement === 'disagree').length
        }
      });
    } catch (error: any) {
      log(`Error retrieving all feedback: ${error.message}`);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve feedback",
        error: error.message
      });
    }
  });

  // Get all pins with feedback data (for viewing pin feedback)
  app.get('/api/pins/all', async (req, res) => {
    try {
      const allPins = await storage.getAllPins();
      
      res.json({
        success: true,
        pins: allPins,
        total: allPins.length,
        feedbackStats: {
          withFeedback: allPins.filter(p => p.userAgreement).length,
          agree: allPins.filter(p => p.userAgreement === 'agree').length,
          disagree: allPins.filter(p => p.userAgreement === 'disagree').length
        }
      });
    } catch (error: any) {
      log(`Error retrieving all pins: ${error.message}`);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve pins",
        error: error.message
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