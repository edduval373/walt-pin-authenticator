import express from "express";
import path from "path";

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API endpoints
app.use(express.json({ limit: '50mb' }));

app.post('/api/verify-pin', async (req, res) => {
  try {
    const { frontImage, backImage, angledImage } = req.body;
    
    if (!frontImage) {
      return res.status(400).json({
        success: false,
        message: 'Front image is required'
      });
    }

    const FormData = require('form-data');
    const fetch = require('node-fetch');
    
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

    const result = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: result.message || 'API request failed'
      });
    }

    res.json({
      success: true,
      message: 'Pin verification completed',
      ...result
    });

  } catch (error) {
    console.error('Pin verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during verification'
    });
  }
});

// Serve the React app as a complete HTML page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Disney Pin Authenticator</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .container { 
            max-width: 400px; 
            margin: 0 auto; 
            padding: 20px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        h1 { font-size: 28px; margin-bottom: 10px; }
        .subtitle { opacity: 0.9; margin-bottom: 30px; }
        .btn {
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px 0;
            width: 100%;
            transition: transform 0.2s;
        }
        .btn:hover { transform: translateY(-2px); }
        .status {
            background: rgba(76, 175, 80, 0.2);
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            border: 1px solid rgba(76, 175, 80, 0.3);
        }
        #camera-container {
            position: relative;
            width: 100%;
            max-width: 300px;
            margin: 20px auto;
            display: none;
        }
        #camera-video {
            width: 100%;
            border-radius: 15px;
            transform: scaleX(-1);
        }
        #capture-btn {
            position: absolute;
            bottom: -20px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #ff6b6b;
            border: 3px solid white;
            cursor: pointer;
        }
        .processing {
            display: none;
            text-align: center;
            padding: 30px;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .results {
            display: none;
            text-align: left;
        }
        .result-item {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            margin: 10px 0;
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div id="intro" class="card">
            <h1>Disney Pin Authenticator</h1>
            <p class="subtitle">Professional pin authentication powered by AI</p>
            <div class="status">
                <strong>Service Active</strong><br>
                Ready to authenticate Disney pins
            </div>
            <button class="btn" onclick="startCamera()">Start Pin Analysis</button>
            <button class="btn" onclick="showApiTest()">API Test Portal</button>
        </div>

        <div id="camera-page" style="display: none;">
            <div class="card">
                <h2>Capture Pin Images</h2>
                <p>Position your Disney pin clearly in the camera view</p>
                <div id="camera-container">
                    <video id="camera-video" autoplay muted playsinline></video>
                    <button id="capture-btn" onclick="captureImage()"></button>
                </div>
                <button class="btn" onclick="goBack()">Back to Home</button>
            </div>
        </div>

        <div id="processing" class="processing">
            <div class="card">
                <h2>Analyzing Pin</h2>
                <div class="spinner"></div>
                <p>AI is authenticating your Disney pin...</p>
                <p style="font-size: 14px; opacity: 0.8; margin-top: 10px;">
                    This may take a few moments
                </p>
            </div>
        </div>

        <div id="results" class="results">
            <div class="card">
                <h2>Authentication Results</h2>
                <div id="results-content"></div>
                <button class="btn" onclick="goHome()">Analyze Another Pin</button>
            </div>
        </div>

        <div id="api-test" style="display: none;">
            <div class="card">
                <h2>API Test Portal</h2>
                <p>Test the authentication service</p>
                <button class="btn" onclick="testApiConnection()">Test Connection</button>
                <div id="api-results" style="margin-top: 20px;"></div>
                <button class="btn" onclick="goBack()">Back to Home</button>
            </div>
        </div>
    </div>

    <script>
        let currentStream = null;
        let capturedImage = null;

        function startCamera() {
            document.getElementById('intro').style.display = 'none';
            document.getElementById('camera-page').style.display = 'block';
            
            navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            })
            .then(stream => {
                currentStream = stream;
                const video = document.getElementById('camera-video');
                video.srcObject = stream;
                document.getElementById('camera-container').style.display = 'block';
            })
            .catch(err => {
                alert('Camera access denied. Please enable camera permissions.');
                goBack();
            });
        }

        function captureImage() {
            const video = document.getElementById('camera-video');
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const ctx = canvas.getContext('2d');
            ctx.scale(-1, 1);
            ctx.drawImage(video, -canvas.width, 0);
            
            capturedImage = canvas.toDataURL('image/jpeg', 0.8);
            
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
            
            processPin();
        }

        function processPin() {
            document.getElementById('camera-page').style.display = 'none';
            document.getElementById('processing').style.display = 'block';
            
            fetch('/api/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ frontImage: capturedImage })
            })
            .then(response => response.json())
            .then(data => {
                showResults(data);
            })
            .catch(error => {
                showResults({
                    success: false,
                    message: 'Connection error: ' + error.message
                });
            });
        }

        function showResults(data) {
            document.getElementById('processing').style.display = 'none';
            document.getElementById('results').style.display = 'block';
            
            const content = document.getElementById('results-content');
            
            if (data.success) {
                content.innerHTML = \`
                    <div class="result-item">
                        <strong>Authentication: \${data.authentic ? 'AUTHENTIC' : 'QUESTIONABLE'}</strong>
                    </div>
                    <div class="result-item">
                        <strong>Confidence:</strong> \${data.authenticityRating || 'N/A'}%
                    </div>
                    <div class="result-item">
                        <strong>Analysis:</strong><br>
                        \${data.analysis || data.identification || 'Analysis completed'}
                    </div>
                    <div class="result-item">
                        <strong>Estimated Value:</strong><br>
                        \${data.pricing || 'Contact expert for valuation'}
                    </div>
                \`;
            } else {
                content.innerHTML = \`
                    <div class="result-item">
                        <strong>Error:</strong><br>
                        \${data.message}
                    </div>
                \`;
            }
        }

        function showApiTest() {
            document.getElementById('intro').style.display = 'none';
            document.getElementById('api-test').style.display = 'block';
        }

        function testApiConnection() {
            const results = document.getElementById('api-results');
            results.innerHTML = '<div class="spinner"></div><p>Testing connection...</p>';
            
            fetch('/health')
            .then(response => response.json())
            .then(data => {
                results.innerHTML = \`
                    <div class="result-item">
                        <strong>Health Check:</strong> \${data.status}<br>
                        <strong>Server Time:</strong> \${new Date(data.timestamp).toLocaleString()}
                    </div>
                \`;
            })
            .catch(error => {
                results.innerHTML = \`
                    <div class="result-item">
                        <strong>Connection Failed:</strong><br>
                        \${error.message}
                    </div>
                \`;
            });
        }

        function goBack() {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
            document.getElementById('camera-page').style.display = 'none';
            document.getElementById('api-test').style.display = 'none';
            document.getElementById('intro').style.display = 'block';
        }

        function goHome() {
            document.getElementById('results').style.display = 'none';
            document.getElementById('intro').style.display = 'block';
        }
    </script>
</body>
</html>
  `);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Disney Pin Authenticator serving on port ${port}`);
});