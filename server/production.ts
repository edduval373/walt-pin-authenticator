// Production server - simplified version without Vite dependencies
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import mobileApiRouter from "./mobile-api";
import { generateMobileApiDocs } from "./mobile-docs";
import path from "path";
import fs from "fs";

const app = express();

// Increase JSON body size limit to handle larger image payloads (100MB)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  res.on("finish", () => {
    const responseTime = Date.now() - start;
    const statusCode = res.statusCode;
    const statusColor = statusCode >= 500
      ? "\x1b[31m" // Red
      : statusCode >= 400
        ? "\x1b[33m" // Yellow
        : statusCode >= 300
          ? "\x1b[36m" // Cyan
          : "\x1b[32m"; // Green
    
    console.log(`${statusColor}${statusCode}\x1b[0m ${path} - ${responseTime}ms`);
  });

  next();
});

(async () => {
  // Add health check endpoint for Railway deployment
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'walt-pin-authenticator',
      timestamp: new Date().toISOString(),
      port: process.env.PORT || 5000
    });
  });

  // Mobile API routes
  app.use('/mobile', mobileApiRouter);
  
  // Add mobile documentation endpoint
  app.get('/api/mobile/docs', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(generateMobileApiDocs());
  });

  // Register API routes
  const server = await registerRoutes(app);

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

  // Serve static files in production
  const distPath = path.resolve(process.cwd(), "dist", "public");
  
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    
    // Fallback to index.html for SPA routing
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  } else {
    console.error(`Build directory not found: ${distPath}`);
    app.use("*", (_req, res) => {
      res.status(500).json({ error: "Application not built properly" });
    });
  }

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(err);
  });

  // Use Railway's PORT environment variable in production
  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    console.log(`Production server running on port ${port}`);
  });
})();