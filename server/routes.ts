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

// Import centralized API configuration
import { API_BASE_URL, API_KEY, FALLBACK_URLS, API_ENDPOINTS } from "./config";

// Use centralized configuration instead of duplicating it here
const PIM_API_BASE_URL = API_BASE_URL;
const PIM_API_KEY = API_KEY;

// Log configuration from centralized config
log(`Using PIM API environment: ${process.env.API_ENVIRONMENT || process.env.NODE_ENV || 'development'}`, 'express');
log(`API base URL: ${PIM_API_BASE_URL}`, 'express');

// Create endpoint URLs using centralized configuration
const PIM_STANDARD_API_URLS = [PIM_API_BASE_URL]; // Single endpoint from centralized config
const PIM_STANDARD_DEBUG_API_URL = `${PIM_API_BASE_URL.replace('/mobile-upload', '')}/api/status`;
const PIM_STANDARD_OLD_API_URL = `${PIM_API_BASE_URL.replace('/mobile-upload', '')}/api/mobile/minimal/verify`;

// Log API key status at startup
if (PIM_API_KEY) {
  log("PIM Standard API key configured successfully", 'express');
} else {
  log("WARNING: PIM Standard API key not configured", 'express');
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
  if (!PIM_API_KEY) {
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
    log(`API Key from secrets: ${PIM_API_KEY ? PIM_API_KEY.substring(0, 10) + '...' : 'NOT FOUND'}`, 'express');
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
            'x-api-key': PIM_API_KEY
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
            Headers: Content-Type: application/json, X-API-Key: ${PIM_API_KEY}
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
      environment: process.env.API_ENVIRONMENT || process.env.NODE_ENV || 'development',
      baseUrl: PIM_API_BASE_URL,
      endpoints: {
        directVerify: '/mobile-upload',
        status: '/api/status'
      },
      hasApiKey: !!PIM_API_KEY
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
      
      // Create a provisional pin record with analysis results
      const pinId = analysisResult.sessionId || `pin_${Date.now()}`;
      const recordNumber = Date.now(); // Unique record number for tracking
      
      // Store the pin with provisional status
      await storage.createPin({
        pinId,
        name: `Mobile Analysis ${pinId}`,
        series: 'Mobile App Results',
        releaseYear: new Date().getFullYear(),
        imageUrl: '',
        dominantColors: [],
        similarPins: []
      });
      
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
      
      log(`Created provisional pin record: ${pinId} with record number: ${recordNumber}`);
      
      return res.json({
        success: true,
        pinId,
        recordNumber,
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

  // POST /api/mobile/confirm-pin - Confirm or reject provisional pins using record number
  app.post('/api/mobile/confirm-pin', async (req, res) => {
    try {
      const { recordNumber, pinId, userAgreement, feedbackComment } = req.body;
      const sessionId = req.headers['x-session-id'];
      
      log(`Processing pin confirmation - Record: ${recordNumber}, Pin: ${pinId}, Agreement: ${userAgreement}`);
      
      // Validate required fields
      if (!recordNumber || !pinId || !userAgreement) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: recordNumber, pinId, and userAgreement are required"
        });
      }

      // Validate userAgreement value
      if (userAgreement !== 'agree' && userAgreement !== 'disagree') {
        return res.status(400).json({
          success: false,
          message: "userAgreement must be either 'agree' or 'disagree'"
        });
      }

      // Update pin with user feedback using record number for tracking
      const updatedPin = await storage.updatePinFeedback(pinId, userAgreement, feedbackComment);

      if (!updatedPin) {
        return res.status(404).json({
          success: false,
          message: "Pin record not found"
        });
      }

      // Create feedback record with record number
      try {
        await storage.createUserFeedback({
          analysisId: recordNumber, // Use record number as analysis ID for mobile tracking
          pinId,
          userAgreement,
          feedbackComment: feedbackComment || null
        });
      } catch (feedbackError) {
        log(`Warning: Could not create feedback record for record ${recordNumber}: ${feedbackError}`);
      }

      log(`Mobile user feedback confirmed - Record: ${recordNumber}, Agreement: ${userAgreement}`);

      return res.json({
        success: true,
        message: "Pin confirmation saved successfully",
        recordNumber,
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

  // Frontend API endpoint for pin analysis
  app.post('/api/analyze', async (req, res) => {
    try {
      const { frontImage, backImage, angledImage } = req.body;
      
      // Validate front image is provided
      if (!frontImage) {
        return res.status(400).json({
          success: false,
          message: "Front image is required for analysis"
        });
      }
      
      log(`Processing pin analysis - Front image: ${frontImage.length} chars`);
      
      // Call the PIM Standard API to analyze the images
      const analysisResult: PimStandardResponse = await analyzeImageForPin(
        frontImage,
        backImage,
        angledImage
      );
      
      // Create a pin record for tracking using existing Railway table structure
      const pinId = analysisResult.sessionId || `pin_${Date.now()}`;
      
      // Store directly in the Railway pins table
      await storage.createPin({
        pinId,
        name: `Analysis ${pinId}`,
        series: 'Frontend Analysis',
        releaseYear: new Date().getFullYear(),
        imageUrl: '',
        dominantColors: [],
        similarPins: []
      });
      
      log(`Analysis complete for pin: ${pinId}`);
      
      return res.json({
        success: true,
        pinId,
        sessionId: analysisResult.sessionId,
        authentic: analysisResult.authentic,
        authenticityRating: analysisResult.authenticityRating,
        analysis: analysisResult.analysis,
        identification: analysisResult.identification,
        pricing: analysisResult.pricing,
        analysisReport: analysisResult.analysisReport,
        message: analysisResult.message || "Pin analysis complete"
      });
      
    } catch (error: any) {
      log(`Error in pin analysis: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: "Analysis failed",
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
  
  // Mobile Upload Endpoint - Exact specification from host
  app.post('/mobile-upload', async (req, res) => {
    try {
      const { sessionId, frontImageData, backImageData, angledImageData } = req.body;
      
      // Validate API key
      const apiKey = req.headers['x-api-key'];
      if (apiKey !== 'pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g') {
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
      
      // Validate session ID format (12-digit)
      if (!/^\d{12}$/.test(sessionId)) {
        return res.status(400).json({
          success: false,
          error: "Session ID must be 12-digit format"
        });
      }
      
      // Extract base64 data (remove data URI prefix if present)
      const cleanFrontImage = frontImageData.replace(/^data:image\/[a-z]+;base64,/, '');
      const cleanBackImage = backImageData ? backImageData.replace(/^data:image\/[a-z]+;base64,/, '') : undefined;
      const cleanAngledImage = angledImageData ? angledImageData.replace(/^data:image\/[a-z]+;base64,/, '') : undefined;
      
      // Call external API for analysis
      const analysisResult = await analyzeImageForPin(cleanFrontImage, cleanBackImage, cleanAngledImage);
      
      // Create database record BEFORE sending response
      const pinId = `pin_${sessionId}`;
      const pin = await storage.createPin({
        pinId,
        name: `Mobile Analysis ${sessionId}`,
        series: 'Mobile Upload',
        releaseYear: new Date().getFullYear(),
        imageUrl: '',
        dominantColors: [],
        similarPins: []
      });
      
      // Return response with database ID
      return res.json({
        success: true,
        message: "Pin analysis completed successfully",
        sessionId,
        id: pin.id, // Primary database ID
        timestamp: new Date().toISOString(),
        authentic: analysisResult.authentic,
        authenticityRating: analysisResult.authenticityRating,
        analysis: analysisResult.analysis,
        identification: analysisResult.identification,
        pricing: analysisResult.pricing
      });
      
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // API Test Endpoint
  app.get('/api/test-connection', async (req, res) => {
    try {
      // Make a simple request to the API status endpoint
      const response = await fetch(PIM_STANDARD_DEBUG_API_URL, {
        headers: {
          'X-API-Key': PIM_API_KEY || ''
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