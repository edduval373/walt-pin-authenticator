// Server startup - override environment variables to use correct URLs
// Force override Replit secrets that may have outdated URLs
process.env.PIM_API_URL = "https://master.pinauth.com";
process.env.HEALTH_CHECK_URL = "https://master.pinauth.com/health";

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import mobileApiRouter from "./mobile-api";
import { generateMobileApiDocs } from "./mobile-docs";

const app = express();
// Increase JSON body size limit to handle larger image payloads (100MB)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  res.on("finish", () => {
    const responseTime = Date.now() - start;
    const contentLength = res.get("content-length") || "unknown";
    
    const statusCode = res.statusCode;
    const statusColor = statusCode >= 500
      ? "\x1b[31m" // Red
      : statusCode >= 400
        ? "\x1b[33m" // Yellow
        : statusCode >= 300
          ? "\x1b[36m" // Cyan
          : "\x1b[32m"; // Green
    
    let logLine = `${req.method} ${path} ${statusColor}${statusCode}\x1b[0m in ${responseTime}ms :: ${contentLength}`;
    
    if (req.method === "POST" && req.path.includes("/api")) {
      try {
        // Show sample of request body for debugging API calls
        const bodyStr = JSON.stringify(req.body).substring(0, 30);
        logLine += ` :: ${bodyStr}...`;
      } catch (e) {
        // Ignore serialization errors
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {

  

  
  // Register the mobile-upload endpoint FIRST before any middleware
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
      
      // Send images to master app server
      const fetch = (await import('node-fetch')).default;
      
      const requestBody: any = {
        sessionId,
        frontImageData: `data:image/png;base64,${cleanFrontImage}`
      };
      
      if (cleanBackImage) {
        requestBody.backImageData = `data:image/png;base64,${cleanBackImage}`;
      }
      
      if (cleanAngledImage) {
        requestBody.angledImageData = `data:image/png;base64,${cleanAngledImage}`;
      }
      
      // Create database record immediately for mobile app response
      const { storage } = await import('./storage');
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

      // Send to master server with timeout handling
      console.log(`[mobile-upload] Sending request to master server with sessionId: ${sessionId}`);
      
      // Start master server request without blocking response
      const masterRequest = fetch('https://master.pinauth.com/mobile-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g'
        },
        body: JSON.stringify(requestBody)
      });

      // Try for quick response (15 seconds)
      try {
        const response = await Promise.race([
          masterRequest,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Quick timeout')), 8000)
          )
        ]) as any;
        
        console.log(`[mobile-upload] Master server quick response: ${response.status}`);
        const jsonResponse = await response.json();
        
        return res.json({
          success: true,
          message: "Pin analysis completed successfully",
          sessionId,
          id: pin.id,
          timestamp: new Date().toISOString(),
          authentic: jsonResponse.authentic || false,
          authenticityRating: jsonResponse.authenticityRating || 0,
          analysis: jsonResponse.analysis || '',
          identification: jsonResponse.identification || '',
          pricing: jsonResponse.pricing || ''
        });
        
      } catch (error: any) {
        console.log(`[mobile-upload] Using processing response for mobile app`);
        
        // Continue processing in background but respond immediately
        masterRequest.then(async (response) => {
          if (response.ok) {
            const data = await response.json();
            console.log(`[mobile-upload] Background processing completed for ${sessionId}`);
            // Could update database record here if needed
          }
        }).catch(err => {
          console.log(`[mobile-upload] Background processing failed: ${err.message}`);
        });
        
        // Return immediate response for mobile app
        return res.json({
          success: true,
          message: "Pin analysis in progress",
          sessionId,
          id: pin.id,
          timestamp: new Date().toISOString(),
          authentic: null,
          authenticityRating: null,
          analysis: "Analysis in progress with authentic Perplexity API",
          identification: "Processing...",
          pricing: "Processing...",
          status: "processing"
        });
      }
      
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Register API routes AFTER the mobile-upload endpoint
  const server = await registerRoutes(app);
  
  // Keep other API routes for web app functionality
  app.use('/mobile', mobileApiRouter);
  
  // Add mobile documentation endpoint
  app.get('/api/mobile/docs', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(generateMobileApiDocs());
  });
  
  // Add health check endpoint for Railway deployment
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'walt-pin-authenticator',
      timestamp: new Date().toISOString(),
      port: process.env.PORT || 5000
    });
  });

  // Add additional compatibility routes
  app.use('/api/mobile', mobileApiRouter);

  // Add a specific route to return API information for the web app
  app.get('/api/info', (req, res) => {
    res.json({
      version: "1.0.0",
      endpoints: {
        verify: "/api/mobile/simple-verify",
        status: "/api/status"
      },
      apiKeyHeader: "X-API-Key",
      requiredApiKey: "mobile-test-key",
      timestamp: new Date().toISOString()
    });
  });

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    log(`Error ${status}: ${message}`, 'server');
    
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // Set up web application routes AFTER API routes
  // This ensures API routes are prioritized over the SPA routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use Railway's PORT environment variable in production, fallback to 5000 for development
  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();