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

  // Serve mobile HTML directly - embedded to avoid file system issues
  app.get('/mobile-app.html', (req, res) => {
    const mobileHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Disney Pin Authenticator</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏰</text></svg>">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: white;
      overflow-x: hidden;
    }
    .container { 
      padding: 20px;
      max-width: 400px;
      margin: 0 auto;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-top: 20px;
    }
    .logo { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 1.8rem; margin-bottom: 0.5rem; font-weight: 700; }
    .subtitle { opacity: 0.9; font-size: 1rem; margin-bottom: 2rem; }
    
    .screen {
      display: none;
      flex: 1;
      flex-direction: column;
    }
    .screen.active { display: flex; }
    
    .steps {
      background: rgba(255,255,255,0.1);
      border-radius: 15px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .step {
      display: flex;
      align-items: center;
      margin: 15px 0;
      font-size: 16px;
    }
    .step-icon {
      background: #4f46e5;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      font-weight: bold;
      font-size: 14px;
    }
    
    .btn {
      background: #4f46e5;
      color: white;
      padding: 16px 32px;
      border: none;
      border-radius: 50px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      margin: 10px 0;
      transition: all 0.3s ease;
      width: 100%;
    }
    .btn:hover { background: #3730a3; transform: translateY(-2px); }
    .btn:active { transform: translateY(0); }
    
    .btn-secondary {
      background: rgba(255,255,255,0.2);
      color: white;
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.3); }
    
    .camera-container {
      position: relative;
      width: 100%;
      max-width: 320px;
      margin: 0 auto 20px auto;
      background: rgba(0,0,0,0.3);
      border-radius: 15px;
      overflow: hidden;
    }
    
    #camera {
      width: 100%;
      height: 240px;
      object-fit: cover;
      transform: scaleX(-1);
    }
    
    .capture-btn {
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 50%;
      width: 70px;
      height: 70px;
      font-size: 28px;
      cursor: pointer;
      margin: 20px auto;
      display: block;
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
    }
    
    .upload-area {
      border: 2px dashed rgba(255,255,255,0.5);
      border-radius: 15px;
      padding: 40px 20px;
      text-align: center;
      cursor: pointer;
      margin: 20px 0;
      transition: all 0.3s ease;
    }
    .upload-area:hover { background: rgba(255,255,255,0.1); }
    
    .result-container {
      background: rgba(255,255,255,0.1);
      border-radius: 15px;
      padding: 25px;
      margin: 20px 0;
      text-align: center;
    }
    
    .authenticity-badge {
      font-size: 2.5rem;
      font-weight: bold;
      margin: 20px 0;
      padding: 15px;
      border-radius: 15px;
    }
    .authentic { background: rgba(16, 185, 129, 0.3); color: #10b981; }
    .not-authentic { background: rgba(239, 68, 68, 0.3); color: #ef4444; }
    
    .confidence-score {
      font-size: 1.5rem;
      margin: 15px 0;
      opacity: 0.9;
    }
    
    .analysis-details {
      text-align: left;
      font-size: 14px;
      line-height: 1.6;
      margin: 20px 0;
    }
    
    .loading {
      text-align: center;
      padding: 60px 20px;
    }
    
    .spinner {
      border: 4px solid rgba(255,255,255,0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px auto;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .error-message {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.5);
      border-radius: 10px;
      padding: 15px;
      margin: 20px 0;
      color: #fbbf24;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🏰</div>
      <h1>Disney Pin Authenticator</h1>
      <p class="subtitle">Authentic Disney pin verification</p>
    </div>
    
    <!-- Welcome Screen -->
    <div id="welcome-screen" class="screen active">
      <div class="steps">
        <div class="step">
          <div class="step-icon">1</div>
          Take photo or upload image of your Disney pin
        </div>
        <div class="step">
          <div class="step-icon">2</div>
          AI analyzes authenticity and details
        </div>
        <div class="step">
          <div class="step-icon">3</div>
          Get confidence score and pricing info
        </div>
      </div>
      
      <button class="btn" onclick="startCamera()">Start Camera</button>
      <button class="btn btn-secondary" onclick="showUpload()">Upload Photo</button>
    </div>
    
    <!-- Camera Screen -->
    <div id="camera-screen" class="screen">
      <div class="camera-container">
        <video id="camera" autoplay playsinline muted></video>
        <canvas id="canvas" style="display: none;"></canvas>
      </div>
      <button class="capture-btn" onclick="capturePhoto()">📷</button>
      <button class="btn btn-secondary" onclick="goBack()">Back</button>
    </div>
    
    <!-- Upload Screen -->
    <div id="upload-screen" class="screen">
      <div class="upload-area" onclick="document.getElementById('fileInput').click()">
        <div style="font-size: 3rem; margin-bottom: 15px;">📁</div>
        <p style="font-size: 18px; margin-bottom: 10px;">Tap to select photo</p>
        <p style="font-size: 14px; opacity: 0.8;">JPG, PNG files accepted</p>
        <input type="file" id="fileInput" accept="image/*" style="display: none;" onchange="handleFileSelect(event)">
      </div>
      <button class="btn btn-secondary" onclick="goBack()">Back</button>
    </div>
    
    <!-- Processing Screen -->
    <div id="processing-screen" class="screen">
      <div class="loading">
        <div class="spinner"></div>
        <h2 style="margin: 20px 0;">Analyzing Your Pin</h2>
        <p>Connecting to master.pinauth.com...</p>
        <p style="font-size: 14px; opacity: 0.7; margin-top: 10px;">This may take a few seconds</p>
      </div>
    </div>
    
    <!-- Results Screen -->
    <div id="results-screen" class="screen">
      <div class="result-container">
        <div id="authenticity-result" class="authenticity-badge"></div>
        <div id="confidence-result" class="confidence-score"></div>
        <div id="analysis-result" class="analysis-details"></div>
      </div>
      <button class="btn" onclick="goHome()">Analyze Another Pin</button>
    </div>
  </div>

  <script>
    let stream = null;
    let currentImageData = null;
    
    // Prevent all errors from displaying on screen
    window.addEventListener('error', function(e) {
      e.preventDefault();
      console.log('Error suppressed:', e.message);
      return false;
    });
    
    window.addEventListener('unhandledrejection', function(e) {
      e.preventDefault();
      console.log('Promise rejection suppressed:', e.reason);
      return false;
    });
    
    function showScreen(screenId) {
      document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
      });
      document.getElementById(screenId).classList.add('active');
    }
    
    function goHome() {
      showScreen('welcome-screen');
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
    }
    
    function goBack() {
      showScreen('welcome-screen');
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
    }
    
    async function startCamera() {
      showScreen('camera-screen');
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        const video = document.getElementById('camera');
        video.srcObject = stream;
        
      } catch (error) {
        console.log('Camera access failed:', error);
        showError('Camera access denied. Please allow camera permission and try again.');
      }
    }
    
    function showUpload() {
      showScreen('upload-screen');
    }
    
    function capturePhoto() {
      const video = document.getElementById('camera');
      const canvas = document.getElementById('canvas');
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Flip image back to normal orientation
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      
      currentImageData = canvas.toDataURL('image/jpeg', 0.85);
      analyzePin(currentImageData);
    }
    
    function handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          currentImageData = e.target.result;
          analyzePin(currentImageData);
        };
        reader.readAsDataURL(file);
      }
    }
    
    async function analyzePin(imageData) {
      showScreen('processing-screen');
      
      // Stop camera if running
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
      
      try {
        const response = await fetch('/api/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            frontImage: imageData
          })
        });
        
        if (!response.ok) {
          throw new Error(\`Server error: \${response.status}\`);
        }
        
        const result = await response.json();
        displayResults(result);
        
      } catch (error) {
        console.log('Analysis error:', error);
        showError('Network connection failed. Please check your internet and try again.');
      }
    }
    
    function displayResults(result) {
      showScreen('results-screen');
      
      const authenticityEl = document.getElementById('authenticity-result');
      const confidenceEl = document.getElementById('confidence-result');
      const analysisEl = document.getElementById('analysis-result');
      
      if (result.success && result.authentic !== undefined) {
        const isAuthentic = result.authentic;
        const rating = result.authenticityRating || 0;
        
        authenticityEl.textContent = isAuthentic ? 'AUTHENTIC' : 'NOT AUTHENTIC';
        authenticityEl.className = \`authenticity-badge \${isAuthentic ? 'authentic' : 'not-authentic'}\`;
        
        confidenceEl.textContent = \`Confidence: \${rating}%\`;
        
        let analysisHtml = '';
        if (result.identification) {
          analysisHtml += \`<div><strong>Pin ID:</strong> \${result.identification}</div>\`;
        }
        if (result.analysis) {
          analysisHtml += \`<div style="margin-top: 15px;"><strong>Analysis:</strong> \${result.analysis}</div>\`;
        }
        if (result.pricing) {
          analysisHtml += \`<div style="margin-top: 15px;"><strong>Pricing:</strong> \${result.pricing}</div>\`;
        }
        
        analysisEl.innerHTML = analysisHtml || '<div>Analysis completed successfully</div>';
        
      } else {
        authenticityEl.textContent = 'ANALYSIS FAILED';
        authenticityEl.className = 'authenticity-badge not-authentic';
        confidenceEl.textContent = 'Unable to determine authenticity';
        analysisEl.innerHTML = \`<div>Error: \${result.message || 'Unknown error occurred'}</div>\`;
      }
    }
    
    function showError(message) {
      showScreen('results-screen');
      
      document.getElementById('authenticity-result').textContent = 'CONNECTION ISSUE';
      document.getElementById('authenticity-result').className = 'authenticity-badge not-authentic';
      document.getElementById('confidence-result').textContent = 'Please try again';
      document.getElementById('analysis-result').innerHTML = \`<div class="error-message">\${message}</div>\`;
    }
    
    // Initialize mobile app
    console.log('Disney Pin Authenticator - Mobile Version Ready');
    console.log('Device:', navigator.userAgent);
    console.log('Screen:', window.innerWidth + 'x' + window.innerHeight);
  </script>
</body>
</html>`;
    
    log('Mobile HTML served directly from server');
    res.set('Content-Type', 'text/html').send(mobileHtml);
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