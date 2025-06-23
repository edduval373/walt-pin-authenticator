// Simplified production server for Railway deployment
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();

// Increase JSON body size limit to handle larger image payloads (100MB)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));

// Basic logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const responseTime = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${responseTime}ms`);
  });
  next();
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'walt-pin-authenticator',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000
  });
});

// Mobile upload endpoint - direct passthrough to production server
app.post('/mobile-upload', async (req, res) => {
  try {
    const { frontImageData, backImageData, angledImageData, sessionId } = req.body;
    
    if (!frontImageData || !sessionId) {
      return res.status(400).json({
        success: false,
        message: "Front image and session ID are required"
      });
    }

    // Use node-fetch via require for compatibility
    const fetch = require('node-fetch');
    
    const response = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.MOBILE_API_KEY || ''
      },
      body: JSON.stringify({
        frontImageData,
        backImageData,
        angledImageData,
        sessionId
      })
    });

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Mobile upload error:', error);
    res.status(500).json({
      success: false,
      message: "Server error during pin authentication"
    });
  }
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    version: "1.0.0",
    service: "W.A.L.T. Authentication Service",
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

// Use Railway's PORT environment variable
const port = parseInt(process.env.PORT || "5000", 10);
const server = createServer(app);

server.listen(port, "0.0.0.0", () => {
  console.log(`Production server running on port ${port}`);
});