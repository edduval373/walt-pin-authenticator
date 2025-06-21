const express = require('express');
const { createServer } = require('http');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const host = '0.0.0.0';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-session-id, x-api-key');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Root route serves the application, not health check
app.get('/healthz', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Disney Pin Authenticator',
    timestamp: new Date().toISOString(),
    port: port
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: port,
    database: !!process.env.DATABASE_URL,
    apiKey: !!process.env.MOBILE_API_KEY
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// API configuration endpoint
app.get('/api/config', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || 'production',
    baseUrl: 'https://master.pinauth.com',
    endpoints: {
      directVerify: '/mobile-upload',
      status: '/api/status'
    },
    hasApiKey: !!process.env.MOBILE_API_KEY
  });
});

// Pin verification endpoint - calls master.pinauth.com directly
app.post('/api/mobile/verify-pin', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || `session_${Date.now()}`;
    const { frontImageBase64, backImageBase64, angledImageBase64 } = req.body;
    
    if (!frontImageBase64) {
      return res.status(400).json({
        success: false,
        message: "Front image is required for verification"
      });
    }

    // Generate session ID
    const now = new Date();
    const apiSessionId = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    const cleanFrontImage = frontImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const requestBody = {
      sessionId: apiSessionId,
      frontImageData: cleanFrontImage
    };

    if (backImageBase64) {
      requestBody.backImageData = backImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    }
    
    if (angledImageBase64) {
      requestBody.angledImageData = angledImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    }

    // Call master.pinauth.com API
    const fetch = (await import('node-fetch')).default;
    const apiResponse = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.MOBILE_API_KEY || 'pim_0w3nfrt5ahgc'
      },
      body: JSON.stringify(requestBody)
    });

    if (!apiResponse.ok) {
      throw new Error(`API Error: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    const recordNumber = Date.now();

    // Store pin record in database
    try {
      await pool.query(
        'INSERT INTO pins (pin_id, name, series, release_year, image_url, dominant_colors, similar_pins) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [data.sessionId || apiSessionId, `Mobile Analysis ${data.sessionId || apiSessionId}`, 'Mobile App Results', new Date().getFullYear(), '', '{}', '{}']
      );
    } catch (dbError) {
      console.log('Database insert warning:', dbError.message);
    }

    return res.json({
      success: true,
      pinId: data.sessionId || apiSessionId,
      recordNumber,
      sessionId,
      authentic: data.authentic,
      authenticityRating: data.authenticityRating,
      analysis: data.analysis,
      identification: data.identification,
      pricing: data.pricing,
      message: "Pin analysis complete - awaiting user confirmation"
    });

  } catch (error) {
    console.error('Verification error:', error.message);
    return res.status(500).json({
      success: false,
      message: "Verification failed",
      errorCode: "processing_error"
    });
  }
});

// Pin confirmation endpoint
app.post('/api/mobile/confirm-pin', async (req, res) => {
  try {
    const { recordNumber, pinId, userAgreement, feedbackComment } = req.body;
    
    if (!recordNumber || !pinId || !userAgreement) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: recordNumber, pinId, and userAgreement are required"
      });
    }

    if (userAgreement !== 'agree' && userAgreement !== 'disagree') {
      return res.status(400).json({
        success: false,
        message: "userAgreement must be either 'agree' or 'disagree'"
      });
    }

    // Update pin with feedback
    try {
      await pool.query(
        'UPDATE pins SET user_agreement = $1, feedback_comment = $2, feedback_submitted_at = NOW() WHERE pin_id = $3',
        [userAgreement, feedbackComment, pinId]
      );

      // Store in user_feedback table
      await pool.query(
        'INSERT INTO user_feedback (analysis_id, pin_id, user_agreement, feedback_comment) VALUES ($1, $2, $3, $4)',
        [recordNumber, pinId, userAgreement, feedbackComment]
      );
    } catch (dbError) {
      console.log('Database update warning:', dbError.message);
    }

    return res.json({
      success: true,
      message: "Pin confirmation saved successfully",
      recordNumber,
      pinId,
      userAgreement,
      feedbackComment
    });

  } catch (error) {
    console.error('Confirmation error:', error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to save pin confirmation",
      error: error.message
    });
  }
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all handler for SPA - but exclude API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes or health checks
  if (req.path.startsWith('/api/') || req.path === '/health' || req.path === '/healthz') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  const indexPath = path.join(__dirname, '../dist/index.html');
  console.log(`Serving frontend for route: ${req.path}, index.html path: ${indexPath}`);
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      // Fallback: serve a simple HTML page if dist files aren't available
      res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Disney Pin Authenticator</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
            .container { max-width: 500px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; }
            h1 { margin-bottom: 20px; }
            p { margin-bottom: 30px; }
            .status { background: rgba(0,255,0,0.2); padding: 15px; border-radius: 10px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Disney Pin Authenticator</h1>
            <div class="status">
              <h3>Server Status: Active</h3>
              <p>API endpoints are running and connected to master.pinauth.com</p>
            </div>
            <p>The application server is running successfully on Railway.</p>
            <p>Frontend build deployment in progress...</p>
            <p><strong>API Health:</strong> <a href="/api/health" style="color: lightblue;">/api/health</a></p>
            <p><strong>System Health:</strong> <a href="/healthz" style="color: lightblue;">/healthz</a></p>
          </div>
        </body>
        </html>
      `);
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const server = createServer(app);

server.listen(port, host, () => {
  console.log(`Disney Pin Authenticator server running on ${host}:${port}`);
  console.log(`Health check: http://${host}:${port}/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Database URL configured: ${!!process.env.DATABASE_URL}`);
  console.log(`API Key configured: ${!!process.env.MOBILE_API_KEY}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool ended');
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool ended');
    });
  });
});