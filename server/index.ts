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

  

  
  // Mobile upload endpoint is now handled by production-server.ts - no interference

  // Register ALL API routes first with explicit middleware
  app.use('/api/*', (req, res, next) => {
    // Set headers for API responses
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // Add health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'walt-pin-authenticator',
      timestamp: new Date().toISOString(),
      port: process.env.PORT || 5000
    });
  });

  // Add API health endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
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

  // Add missing health proxy endpoint
  app.get('/api/proxy/health', async (req, res) => {
    try {
      const fetch = (await import('node-fetch')).default;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://master.pinauth.com/health', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        res.json(data);
      } else {
        res.status(response.status).json({
          status: 'error',
          message: `Master server health check failed with status ${response.status}`
        });
      }
    } catch (error) {
      res.status(503).json({
        status: 'error',
        message: 'Unable to reach master server',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Mobile detection and routing - must be before other middleware
  app.get('/', (req, res, next) => {
    const userAgent = req.get('user-agent') || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    if (isMobile) {
      return res.redirect('/mobile-app.html');
    }
    
    // Continue to React app for desktop
    next();
  });

  // Serve mobile HTML directly
  app.get('/mobile-app.html', async (req, res) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Try multiple possible paths for the mobile HTML file
      const possiblePaths = [
        path.resolve(process.cwd(), 'dist', 'public', 'mobile-app.html'),
        path.resolve(process.cwd(), 'dist', 'mobile-app.html'),
        path.resolve(process.cwd(), 'mobile-app.html'),
        path.resolve(__dirname, '..', 'dist', 'public', 'mobile-app.html')
      ];
      
      let mobileHtml = null;
      let foundPath = null;
      
      for (const filePath of possiblePaths) {
        try {
          mobileHtml = await fs.promises.readFile(filePath, 'utf-8');
          foundPath = filePath;
          break;
        } catch (e) {
          continue;
        }
      }
      
      if (mobileHtml) {
        log(`Mobile HTML served from: ${foundPath}`);
        res.set('Content-Type', 'text/html').send(mobileHtml);
      } else {
        throw new Error('Mobile HTML file not found in any expected location');
      }
    } catch (error: any) {
      log(`Mobile HTML error: ${error?.message || 'Unknown error'}`);
      res.status(404).send('Mobile interface not available');
    }
  });

  // Add mobile verify endpoint before production server
  app.post('/api/verify', async (req, res) => {
    try {
      const { frontImage, backImage, angledImage } = req.body;
      
      if (!frontImage) {
        return res.status(400).json({
          success: false,
          message: "Front image is required for analysis"
        });
      }
      
      log(`Processing mobile pin verification`);
      
      // Make request to master.pinauth.com
      const FormData = (await import('form-data')).default;
      const fetch = (await import('node-fetch')).default;
      
      const formData = new FormData();
      
      // Convert base64 to buffer and append to form
      const frontBuffer = Buffer.from(frontImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      formData.append('front_image', frontBuffer, 'front.jpg');
      
      if (backImage) {
        const backBuffer = Buffer.from(backImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
        formData.append('back_image', backBuffer, 'back.jpg');
      }
      
      if (angledImage) {
        const angledBuffer = Buffer.from(angledImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
        formData.append('angled_image', angledBuffer, 'angled.jpg');
      }

      const response = await fetch('https://master.pinauth.com/mobile-upload', {
        method: 'POST',
        headers: {
          'User-Agent': 'Disney-Pin-Auth-Mobile/1.0',
          'Accept': 'application/json',
          'X-API-Key': process.env.VITE_MOBILE_API_KEY || 'pim_0w3nfrt5ahgc',
          ...formData.getHeaders()
        },
        body: formData
      });

      const result = await response.json() as any;
      log(`Mobile verification complete: ${result.success ? 'success' : 'failed'}`);
      
      res.json(result);
      
    } catch (error: any) {
      log(`Error in mobile verification: ${error.message}`);
      res.status(500).json({
        success: false,
        message: "Verification failed",
        error: error.message
      });
    }
  });
  
  // Keep other API routes for web app functionality
  app.use('/mobile', mobileApiRouter);
  app.use('/api/mobile', mobileApiRouter);
  
  // Import production server as middleware
  const productionApp = (await import("./production-server")).default;
  app.use(productionApp);
  
  // Create HTTP server
  const { createServer } = await import("http");
  const server = createServer(app);
  
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
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();