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

// Add Railway health check endpoint FIRST - before any middleware
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Disney Pin Authenticator',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Add root health check as backup
app.get('/', (req, res) => {
  if (req.headers['user-agent']?.includes('railway')) {
    // Railway's health check sometimes hits root
    res.status(200).json({
      status: 'healthy',
      service: 'Disney Pin Authenticator',
      timestamp: new Date().toISOString()
    });
  } else {
    // Regular users get redirected to the app
    res.redirect('/app');
  }
});

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
      const expectedApiKey = process.env.MOBILE_API_KEY || 'pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g';
      if (apiKey !== expectedApiKey) {
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
      
      // Send to master app server with timeout handling
      console.log(`[mobile-upload] Sending request to master server with sessionId: ${sessionId}`);
      let analysisResult;
      try {
        const response = await Promise.race([
          fetch('https://master.pinauth.com/mobile-upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.MOBILE_API_KEY || 'pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g'
            },
            body: JSON.stringify(requestBody)
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Master server timeout')), 30000)
          )
        ]) as any;
        
        console.log(`[mobile-upload] Master server response status: ${response.status}`);
        
        // Parse JSON response from production server
        const jsonResponse = await response.json();
        
        // Extract analysis data from production JSON response
        analysisResult = {
          authentic: jsonResponse.authentic || false,
          authenticityRating: jsonResponse.authenticityRating || 0,
          analysis: jsonResponse.analysis || '',
          identification: jsonResponse.identification || '',
          pricing: jsonResponse.pricing || ''
        };
      } catch (error: any) {
        console.log(`[mobile-upload] Master server error: ${error.message}`);
        // Master server unavailable - return error instead of creating incomplete records
        return res.status(503).json({
          success: false,
          error: "Master server unavailable - authentic analysis service not accessible",
          message: "Please try again when the authentication service is available"
        });
      }
      
      // Import storage after dependencies are loaded
      const { storage } = await import('./storage');
      
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

  // Register ALL API routes first with explicit middleware
  app.use('/api/*', (req, res, next) => {
    // Set headers for API responses
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // Additional health check endpoints for different access patterns
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      service: 'Disney Pin Authenticator',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      service: 'Disney Pin Authenticator API',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Add API info endpoint
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

  // Register API routes BEFORE Vite middleware
  const server = await registerRoutes(app);
  
  // Keep other API routes for web app functionality
  app.use('/mobile', mobileApiRouter);
  app.use('/api/mobile', mobileApiRouter);
  
  // Add mobile documentation endpoint
  app.get('/api/mobile/docs', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(generateMobileApiDocs());
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

  // Set up web application routes AFTER ALL API routes
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