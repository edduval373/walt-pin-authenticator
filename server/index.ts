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

  

  
  // Keep other API routes for web app functionality
  app.use('/mobile', mobileApiRouter);
  
  // Add mobile documentation endpoint
  app.get('/api/mobile/docs', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(generateMobileApiDocs());
  });
  




  // Add health check endpoint for mobile connectivity testing
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      port: 5000,
      timestamp: new Date().toISOString(),
      endpoint: '/mobile-upload'
    });
  });

  // Add additional compatibility routes
  app.use('/api/mobile', mobileApiRouter);
  
  // Register API routes next to ensure they take precedence over web routes
  const server = await registerRoutes(app);

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

    res.status(status).json({ message });
    throw err;
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