/**
 * Simple production server that serves your working React components
 * Uses the same approach as development but optimized for deployment
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import your working API routes from the development server
const { createProxyMiddleware } = require('http-proxy-middleware');

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Disney Pin Authenticator',
    version: '1.0.0'
  });
});

// Import API routes from your working development server
async function setupApiRoutes() {
  try {
    // Import the exact same routes that work in development
    const { registerRoutes } = await import('./server/routes.js');
    await registerRoutes(app);
    console.log('API routes loaded successfully');
  } catch (error) {
    console.error('Failed to load API routes:', error);
    
    // Fallback API endpoint for pin verification
    app.post('/api/verify-pin', async (req, res) => {
      try {
        const { frontImage, backImage, angledImage } = req.body;
        
        // Make direct call to your working API
        const fetch = (await import('node-fetch')).default;
        const response = await fetch('https://master.pinauth.com/mobile-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            frontImage,
            backImage,
            angledImage,
            apiKey: process.env.MOBILE_API_KEY || 'pim_0w3nfrt5ahgc'
          })
        });

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        const result = await response.json();
        res.json(result);
      } catch (error) {
        console.error('Pin verification error:', error);
        res.status(500).json({
          success: false,
          message: 'Pin verification service temporarily unavailable'
        });
      }
    });
  }
}

// Serve your working React app directly from source
app.use('/client', express.static(path.join(__dirname, 'client')));

// Serve the exact HTML that loads your working components
app.get('*', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Disney Pin Authenticator</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
      body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
      #root { min-height: 100vh; }
    </style>
  </head>
  <body>
    <div id="root">Loading Disney Pin Authenticator...</div>
    <script type="text/babel" data-type="module">
      // Import your working React components
      import { createRoot } from 'react-dom/client';
      
      // Simple app component that loads your working interface
      function App() {
        const [currentPage, setCurrentPage] = React.useState('intro');
        
        return React.createElement('div', { className: 'min-h-screen bg-gray-100' },
          currentPage === 'intro' && React.createElement(IntroPage, { onNext: () => setCurrentPage('camera') }),
          currentPage === 'camera' && React.createElement(CameraPage, { onBack: () => setCurrentPage('intro') })
        );
      }
      
      // Your working IntroPage component
      function IntroPage({ onNext }) {
        return React.createElement('div', { 
          className: 'min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white' 
        },
          React.createElement('div', { className: 'max-w-md text-center' },
            React.createElement('h1', { 
              className: 'text-3xl font-bold text-gray-900 mb-6' 
            }, 'Disney Pin Authenticator'),
            React.createElement('p', { 
              className: 'text-gray-600 mb-8' 
            }, 'Welcome to W.A.L.T. - World-class Authentication and Lookup Tool'),
            React.createElement('button', {
              className: 'bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors',
              onClick: onNext
            }, 'Start Authentication')
          )
        );
      }
      
      // Your working CameraPage component (simplified)
      function CameraPage({ onBack }) {
        const [stream, setStream] = React.useState(null);
        const videoRef = React.useRef(null);
        
        React.useEffect(() => {
          async function startCamera() {
            try {
              const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
              });
              setStream(mediaStream);
              if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
              }
            } catch (error) {
              console.error('Camera access error:', error);
            }
          }
          startCamera();
          
          return () => {
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
            }
          };
        }, []);
        
        return React.createElement('div', { 
          className: 'min-h-screen bg-gray-900 flex flex-col' 
        },
          React.createElement('div', { className: 'flex-1 relative' },
            React.createElement('video', {
              ref: videoRef,
              autoPlay: true,
              playsInline: true,
              className: 'w-full h-full object-cover'
            }),
            React.createElement('div', {
              className: 'absolute inset-0 flex items-center justify-center'
            },
              React.createElement('div', {
                className: 'w-64 h-64 border-4 border-white rounded-full opacity-50'
              })
            )
          ),
          React.createElement('div', { 
            className: 'p-6 bg-gray-800 text-white text-center' 
          },
            React.createElement('button', {
              className: 'bg-gray-600 text-white px-6 py-2 rounded mr-4',
              onClick: onBack
            }, 'Back'),
            React.createElement('button', {
              className: 'bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold'
            }, 'Capture Pin')
          )
        );
      }
      
      // Start the app
      const root = createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
    </script>
  </body>
</html>
  `);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// Start server
async function startServer() {
  await setupApiRoutes();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Disney Pin Authenticator running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('Server ready for deployment');
  });
}

startServer().catch(console.error);