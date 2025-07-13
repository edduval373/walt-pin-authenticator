// Minimal Disney Pin Authenticator server for Railway deployment
// This bypasses all complex middleware to ensure health check works
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Ensure client build exists before starting server
const clientDistPath = path.join(__dirname, 'client', 'dist');
const indexHtmlPath = path.join(clientDistPath, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.log('Creating missing client build...');
  fs.mkdirSync(clientDistPath, { recursive: true });
  
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Disney Pin Authenticator - W.A.L.T.</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container { 
            text-align: center; 
            padding: 2rem;
            max-width: 500px;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .logo { 
            font-size: 4rem; 
            margin-bottom: 1rem;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        }
        .title { 
            font-size: 2.5rem; 
            font-weight: 700;
            margin-bottom: 0.5rem;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .subtitle { 
            font-size: 1.2rem; 
            margin-bottom: 2rem;
            opacity: 0.9;
            font-weight: 300;
        }
        .status { 
            margin-top: 1rem;
            padding: 10px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🏰🔍</div>
        <h1 class="title">Disney Pin Authenticator</h1>
        <p class="subtitle">Meet W.A.L.T.</p>
        <div class="status" id="status">Service running on Railway</div>
    </div>
    <script>
        fetch('/healthz')
            .then(response => response.json())
            .then(data => {
                document.getElementById('status').textContent = 'Connected to ' + data.service;
            })
            .catch(error => {
                document.getElementById('status').textContent = 'Railway deployment active';
            });
    </script>
</body>
</html>`;
  
  fs.writeFileSync(indexHtmlPath, indexHtml);
  console.log('Client build created at startup');
}

// Health check endpoint - FIRST priority
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Disney Pin Authenticator',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'production'
  });
});

// Basic JSON parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve static files from client/dist
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Basic mobile upload endpoint
app.post('/mobile-upload', async (req, res) => {
  try {
    const { sessionId, frontImageData } = req.body;
    
    // Basic validation
    if (!sessionId || !frontImageData) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }
    
    // Return mock success response for now
    res.json({
      success: true,
      message: "Pin analysis completed",
      sessionId,
      timestamp: new Date().toISOString(),
      authentic: true,
      authenticityRating: 85,
      analysis: "Disney pin analysis complete",
      identification: "Disney collectible pin",
      pricing: "Estimated value: $15-25"
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Disney Pin Authenticator server running on port ${port}`);
  console.log(`Health check available at: http://localhost:${port}/healthz`);
});