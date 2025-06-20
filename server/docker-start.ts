// Simplified server startup for Docker deployment
// This bypasses complex Vite setup that may fail in containerized environments

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import mobileApiRouter from "./mobile-api";
import { generateMobileApiDocs } from "./mobile-docs";

async function startServer() {
  const app = express();

  // Increase JSON body size limit to handle larger image payloads (100MB)
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: false, limit: '100mb' }));

  // Basic logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  // Health check endpoints
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'walt-pin-authenticator',
      timestamp: new Date().toISOString(),
      port: process.env.PORT || 5000
    });
  });

  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // API info endpoint for mobile apps
  app.get('/api/info', (req, res) => {
    res.json({
      service: "Disney Pin Authenticator API",
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

  // Register API routes
  const server = await registerRoutes(app);

  // Mobile API routes
  app.use('/mobile', mobileApiRouter);
  app.use('/api/mobile', mobileApiRouter);

  // Mobile documentation endpoint
  app.get('/api/mobile/docs', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(generateMobileApiDocs());
  });

  // Serve simple HTML for frontend (fallback)
  app.get('*', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Disney Pin Authenticator</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <div id="root">
            <h1>Disney Pin Authenticator API</h1>
            <p>Server is running successfully!</p>
            <p>API endpoints available at <a href="/api/info">/api/info</a></p>
            <p>Mobile API documentation at <a href="/api/mobile/docs">/api/mobile/docs</a></p>
          </div>
        </body>
      </html>
    `);
  });

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error(`Error ${status}: ${message}`);
    
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // Start server
  const port = parseInt(process.env.PORT || '5000');
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer().catch(console.error);