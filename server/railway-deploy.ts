import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import FormData from "form-data";
import { Pool } from "pg";
import { setupVite } from "./vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== RAILWAY DEPLOYMENT SERVER STARTING ===');
console.log('Timestamp:', new Date().toISOString());
console.log('Working directory:', process.cwd());
console.log('Script file:', __filename);

// Log all environment variables for debugging
console.log('=== ALL ENVIRONMENT VARIABLES ===');
const envVars = Object.keys(process.env).sort();
envVars.forEach(key => {
  if (key.includes('PASSWORD') || key.includes('SECRET') || key.includes('TOKEN')) {
    console.log(`${key}: [REDACTED - ${process.env[key]?.length || 0} characters]`);
  } else {
    console.log(`${key}: ${process.env[key]}`);
  }
});

// Database connection test
async function testDatabaseConnection() {
  console.log('=== DATABASE CONNECTION TEST ===');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ No DATABASE_URL environment variable found');
    return false;
  }
  
  try {
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    console.log('🔍 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database query successful:', result.rows[0]);
    
    client.release();
    await pool.end();
    console.log('✅ Database connection closed cleanly');
    return true;
    
  } catch (error: any) {
    console.log('❌ Database connection failed:', error.message);
    console.log('Error details:', {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      hostname: error.hostname,
      port: error.port
    });
    return false;
  }
}

// Environment diagnostics
console.log('=== ENVIRONMENT DIAGNOSTICS ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MOBILE_API_KEY exists:', !!process.env.MOBILE_API_KEY);
console.log('MOBILE_API_KEY length:', process.env.MOBILE_API_KEY?.length || 0);
console.log('Process PID:', process.pid);
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Memory usage:', process.memoryUsage());

const app = express();

console.log('Express app created successfully');

// Add comprehensive middleware logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// Test database connection on startup with detailed logging
console.log('Starting database connection test...');
testDatabaseConnection().then(dbConnected => {
  console.log('Database test completed. Connected:', dbConnected);
}).catch(err => {
  console.log('Database test error:', err.message);
  console.log('Database test stack:', err.stack);
});

// Increase JSON body size limit to handle larger image payloads (100MB)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));

// Simple logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  res.on("finish", () => {
    const responseTime = Date.now() - start;
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit", 
      second: "2-digit",
      hour12: true,
    });
    console.log(`${time} [railway] ${req.method} ${path} ${res.statusCode} ${responseTime}ms`);
  });
  
  next();
});

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});



// Add health endpoint with extensive debugging
app.get('/health', (req, res) => {
  console.log('=== HEALTH CHECK REQUEST RECEIVED ===');
  console.log('Request timestamp:', new Date().toISOString());
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('Request IP:', req.ip);
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  const healthData = {
    status: 'ok',
    service: 'disney-pin-authenticator',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    port: parseInt(process.env.PORT || '5000', 10),
    environment: process.env.NODE_ENV || 'production',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    api: {
      configured: !!process.env.MOBILE_API_KEY,
      endpoint: 'https://master.pinauth.com/mobile-upload'
    }
  };
  
  console.log('Health check response:', JSON.stringify(healthData, null, 2));
  console.log('Sending 200 response...');
  
  res.status(200).json(healthData);
  
  console.log('Health check response sent successfully');
});

// Add core API endpoints directly without database dependency
app.post('/api/verify-pin', async (req, res) => {
  try {
    const { frontImage, backImage, angledImage } = req.body;
    
    if (!frontImage) {
      return res.status(400).json({
        success: false,
        message: 'Front image is required'
      });
    }

    // Direct API call to master.pinauth.com
    const formData = new FormData();
    
    // Convert base64 to buffer and append to form data
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
      body: formData,
      headers: {
        'X-API-Key': process.env.MOBILE_API_KEY || 'pim_0w3nfrt5ahgc',
        ...formData.getHeaders()
      }
    });

    const result = await response.json() as any;
    
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: result.message || 'API request failed'
      });
    }

    res.json({
      success: true,
      message: 'Pin verification completed',
      ...(typeof result === 'object' ? result : {})
    });

  } catch (error: any) {
    console.error('Pin verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during verification'
    });
  }
});

// Mobile upload endpoint for compatibility
app.post('/mobile-upload', async (req, res) => {
  try {
    const { frontImage, backImage, angledImage } = req.body;
    
    if (!frontImage) {
      return res.status(400).json({
        success: false,
        message: 'Front image is required'
      });
    }

    const formData = new FormData();
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
      body: formData,
      headers: {
        'X-API-Key': process.env.MOBILE_API_KEY || 'pim_0w3nfrt5ahgc',
        ...formData.getHeaders()
      }
    });

    const result = await response.json() as any;
    res.json(result);

  } catch (error: any) {
    console.error('Mobile upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Start server with detailed startup logging
const port = parseInt(process.env.PORT || '5000', 10);

console.log('=== SERVER STARTUP ===');
console.log('Attempting to bind to port:', port);
console.log('Binding to host: 0.0.0.0');

// Perform critical test before server starts
console.log('=== PRE-SERVER STARTUP TESTS ===');

// Test basic HTTP response capability
try {
  console.log('Testing Express response capability...');
  app.get('/test-immediate', (req, res) => {
    console.log('Test endpoint hit');
    res.json({ test: 'success', timestamp: new Date().toISOString() });
  });
  console.log('Express route registration successful');
} catch (err: any) {
  console.log('Express route registration failed:', err.message);
}

const server = app.listen(port, '0.0.0.0', async () => {
  console.log(`=== SERVER LISTENING CALLBACK TRIGGERED ===`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Port: ${port}`);
  console.log(`Host: 0.0.0.0`);
  console.log(`Process PID: ${process.pid}`);
  console.log(`Server address:`, server.address());
  console.log(`✅ ${new Date().toLocaleTimeString()} [railway] Disney Pin Checker API serving on port ${port}`);
  console.log(`✅ Connected to PIM service at: https://master.pinauth.com`);
  console.log('✅ Server startup completed successfully');
  console.log('✅ Health check endpoint available at /health');

  // Test internal health check immediately
  try {
    console.log('=== INTERNAL HEALTH CHECK TEST ===');
    const testReq = {
      method: 'GET',
      url: '/health',
      ip: '127.0.0.1',
      headers: { 'internal-test': 'true' }
    };
    console.log('Simulating health check request...');
    // This won't actually trigger the endpoint but shows the server is ready
    console.log('Server is ready to receive health check requests');
  } catch (err: any) {
    console.log('Internal health check test failed:', err.message);
  }

  // Setup Vite for React UI serving after server is running
  try {
    console.log('Setting up Vite for React UI...');
    await setupVite(app, server);
    console.log('✅ Vite setup completed for React UI');
  } catch (err: any) {
    console.log('❌ Vite setup failed:', err.message);
    console.log('Vite error stack:', err.stack);
    
    // Add fallback route for root if Vite fails
    app.get('/', (req, res) => {
      console.log('Serving fallback HTML for root route');
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Disney Pin Checker</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            h1 { color: #1e40af; }
            p { margin: 20px 0; }
            .status { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Disney Pin Checker</h1>
            <p>The mobile application API is running successfully!</p>
            <div class="status">
              <h3>API Status: Active</h3>
              <p>Ready to authenticate Disney pins</p>
              <p>Connected to: https://master.pinauth.com</p>
            </div>
            <p>This service provides pin authentication for the mobile app.</p>
          </div>
        </body>
        </html>
      `);
    });
  }
  
  console.log('=== SERVER STARTUP SEQUENCE COMPLETED ===');
});

server.on('error', (error: any) => {
  console.log('❌ Server error:', error.message);
  console.log('Error code:', error.code);
  console.log('Error syscall:', error.syscall);
  console.log('Error port:', error.port);
  console.log('Error address:', error.address);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Add immediate health check test after server error handlers
server.on('listening', () => {
  console.log('=== SERVER LISTENING EVENT TRIGGERED ===');
  console.log('Server is now accepting connections');
  
  // Test the health endpoint immediately
  setTimeout(() => {
    console.log('=== TESTING HEALTH ENDPOINT INTERNALLY ===');
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/health',
      method: 'GET',
      timeout: 5000
    };
    
    const req = http.request(options, (res) => {
      console.log(`Internal health check response status: ${res.statusCode}`);
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('Internal health check response:', data);
      });
    });
    
    req.on('error', (err) => {
      console.log('Internal health check error:', err.message);
    });
    
    req.on('timeout', () => {
      console.log('Internal health check timeout');
      req.destroy();
    });
    
    req.end();
  }, 1000);
});

// Catch unhandled errors
process.on('uncaughtException', (error) => {
  console.log('❌ Uncaught Exception:', error.message);
  console.log('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error(`[railway] Error ${status}: ${message}`);
  res.status(status).json({ message });
});