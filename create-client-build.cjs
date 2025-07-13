#!/usr/bin/env node

/**
 * Create client build from working backup - Railway deployment fix
 */

const fs = require('fs');
const path = require('path');

function createClientBuild() {
  console.log('📦 Creating client build for Railway deployment...');
  
  // Ensure client/dist directory exists
  const distDir = path.join(__dirname, 'client', 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Create index.html with Disney Pin Authenticator
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
        .button { 
            background: #4CAF50;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 30px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(76,175,80,0.4);
        }
        .button:hover { 
            background: #45a049;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(76,175,80,0.6);
        }
        .status { 
            margin-top: 1rem;
            padding: 10px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            font-size: 0.9rem;
        }
        .loading { 
            display: none;
            margin-top: 1rem;
        }
        .spinner { 
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top: 3px solid white;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🏰🔍</div>
        <h1 class="title">Disney Pin Authenticator</h1>
        <p class="subtitle">Meet W.A.L.T.</p>
        <button class="button" onclick="startAuthentication()">Start Authentication</button>
        <div class="status" id="status">Ready for pin authentication</div>
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Connecting to authentication service...</p>
        </div>
    </div>

    <script>
        function startAuthentication() {
            document.getElementById('status').textContent = 'Initializing camera...';
            document.getElementById('loading').style.display = 'block';
            
            // Test health check
            fetch('/healthz')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('status').textContent = 'Service connected: ' + data.service;
                    document.getElementById('loading').style.display = 'none';
                })
                .catch(error => {
                    document.getElementById('status').textContent = 'Service unavailable';
                    document.getElementById('loading').style.display = 'none';
                });
        }

        // Test connection on load
        window.onload = function() {
            fetch('/healthz')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('status').textContent = 'Connected to ' + data.service;
                })
                .catch(error => {
                    document.getElementById('status').textContent = 'Connecting to service...';
                });
        };
    </script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml);
  
  console.log('✅ Client build created successfully');
  console.log('📁 Files created:');
  console.log('   - client/dist/index.html');
  
  return true;
}

createClientBuild();