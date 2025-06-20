// Minimal server startup for Docker deployment - health checks only
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";

const app = express();

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoints - these must work immediately
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.status(200).json({
    status: 'ok',
    service: 'walt-pin-authenticator',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000
  });
});

app.get('/api/health', (req, res) => {
  console.log('API health check requested');
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

// Simple root endpoint
app.get('/', (req, res) => {
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
          <p>Health check: <a href="/health">/health</a></p>
          <p>API info: <a href="/api/info">/api/info</a></p>
        </div>
      </body>
    </html>
  `);
});

// Catch all other routes
app.get('*', (req, res) => {
  res.status(404).json({ message: 'Route not found', path: req.path });
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

// Create HTTP server
const server = createServer(app);

// Start server
const port = parseInt(process.env.PORT || '5000');
console.log(`Starting server on port ${port}...`);

server.listen(port, '0.0.0.0', () => {
  console.log(`✓ Server running on port ${port}`);
  console.log(`✓ Health check available at http://0.0.0.0:${port}/health`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});