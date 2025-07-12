#!/usr/bin/env node

/**
 * Unified Disney Pin Authenticator Server
 * Handles both development and production deployments
 * Fixed to properly serve static files from client/dist
 */

import express from 'express';
import FormData from 'form-data';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT) || 5000;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Configure middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CRITICAL: Serve static files FIRST with proper configuration
app.use(express.static(path.join(__dirname, 'client/dist'), {
  index: false, // Don't auto-serve index.html for directories
  setHeaders: (res, filePath) => {
    // Ensure proper content types for static assets
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Disney Pin Authenticator',
    version: '1.0.0',
    mode: isDevelopment ? 'development' : 'production'
  });
});

// API endpoint for pin verification
app.post('/api/verify-pin', async (req, res) => {
  try {
    const { frontImage, backImage, angledImage } = req.body;
    
    if (!frontImage) {
      return res.status(400).json({
        success: false,
        message: 'Front image is required'
      });
    }

    // Create form data for the API request
    const formData = new FormData();
    
    // Convert base64 images to buffers and add to form data
    if (frontImage) {
      const frontBuffer = Buffer.from(frontImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      formData.append('frontImage', frontBuffer, {
        filename: 'front.jpg',
        contentType: 'image/jpeg'
      });
    }
    
    if (backImage) {
      const backBuffer = Buffer.from(backImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      formData.append('backImage', backBuffer, {
        filename: 'back.jpg',
        contentType: 'image/jpeg'
      });
    }
    
    if (angledImage) {
      const angledBuffer = Buffer.from(angledImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      formData.append('angledImage', angledBuffer, {
        filename: 'angled.jpg',
        contentType: 'image/jpeg'
      });
    }

    // Add API key
    formData.append('apiKey', process.env.MOBILE_API_KEY || 'pim_0w3nfrt5ahgc');

    // Make request to PIM API
    const response = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders(),
        'Accept': 'application/json'
      }
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
      message: 'Pin verification service temporarily unavailable',
      error: isDevelopment ? error.message : undefined
    });
  }
});

// Serve the complete React application (only for HTML routes, not static assets)
app.get('*', (req, res) => {
  // Check if client/dist/index.html exists, if so, serve that instead
  const indexPath = path.join(__dirname, 'client/dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
    return;
  }
  
  // Fallback to embedded HTML for development or when dist doesn't exist
  res.send(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Disney Pin Authenticator - W.A.L.T.</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
      body { 
        margin: 0; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        background: #f8fafc;
      }
      #root { min-height: 100vh; }
      .capture-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 300px;
        height: 300px;
        border: 3px solid rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        pointer-events: none;
        z-index: 10;
      }
      .gradient-bg {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      .loading-spinner {
        border: 4px solid #f3f4f6;
        border-top: 4px solid #3b82f6;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="min-h-screen flex items-center justify-center">
        <div class="loading-spinner"></div>
      </div>
    </div>
    <script type="text/babel">
      const { useState, useEffect, useRef } = React;
      
      function App() {
        const [currentPage, setCurrentPage] = useState('intro');
        const [analysisResult, setAnalysisResult] = useState(null);
        
        return React.createElement('div', { className: 'min-h-screen' },
          currentPage === 'intro' && React.createElement(IntroPage, { 
            onNext: () => setCurrentPage('camera') 
          }),
          currentPage === 'camera' && React.createElement(CameraPage, { 
            onBack: () => setCurrentPage('intro'),
            onCapture: (result) => {
              setAnalysisResult(result);
              setCurrentPage('results');
            }
          }),
          currentPage === 'results' && React.createElement(ResultsPage, {
            result: analysisResult,
            onBack: () => setCurrentPage('camera')
          })
        );
      }
      
      function IntroPage({ onNext }) {
        return React.createElement('div', { 
          className: 'min-h-screen gradient-bg flex flex-col items-center justify-center p-6 text-white' 
        },
          React.createElement('div', { className: 'max-w-md text-center' },
            React.createElement('div', { className: 'mb-8' },
              React.createElement('div', { 
                className: 'w-32 h-32 mx-auto mb-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm' 
              },
                React.createElement('span', { 
                  className: 'text-4xl font-bold' 
                }, 'W')
              )
            ),
            React.createElement('h1', { 
              className: 'text-4xl font-bold mb-3' 
            }, 'Disney Pin Authenticator'),
            React.createElement('p', { 
              className: 'text-xl font-semibold mb-2 text-blue-100' 
            }, 'W.A.L.T.'),
            React.createElement('p', { 
              className: 'text-sm opacity-90 mb-8' 
            }, 'World-class Authentication and Lookup Tool'),
            React.createElement('div', { className: 'space-y-4 mb-8 text-left' },
              React.createElement('div', { className: 'flex items-start space-x-3' },
                React.createElement('div', { className: 'w-2 h-2 bg-blue-200 rounded-full mt-2 flex-shrink-0' }),
                React.createElement('p', { className: 'text-sm opacity-90' }, 'Advanced AI-powered authentication')
              ),
              React.createElement('div', { className: 'flex items-start space-x-3' },
                React.createElement('div', { className: 'w-2 h-2 bg-blue-200 rounded-full mt-2 flex-shrink-0' }),
                React.createElement('p', { className: 'text-sm opacity-90' }, 'Multi-angle image analysis')
              ),
              React.createElement('div', { className: 'flex items-start space-x-3' },
                React.createElement('div', { className: 'w-2 h-2 bg-blue-200 rounded-full mt-2 flex-shrink-0' }),
                React.createElement('p', { className: 'text-sm opacity-90' }, 'Comprehensive authenticity scoring')
              )
            ),
            React.createElement('button', {
              className: 'w-full bg-white text-purple-700 py-4 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg',
              onClick: onNext
            }, 'Start Authentication'),
            React.createElement('p', { 
              className: 'text-xs opacity-70 mt-4' 
            }, 'By proceeding, you acknowledge the terms of service')
          )
        );
      }
      
      function CameraPage({ onBack, onCapture }) {
        const [stream, setStream] = useState(null);
        const [currentView, setCurrentView] = useState('front');
        const [capturedImages, setCapturedImages] = useState({});
        const [isProcessing, setIsProcessing] = useState(false);
        const videoRef = useRef(null);
        const canvasRef = useRef(null);
        
        useEffect(() => {
          startCamera();
          return () => {
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
            }
          };
        }, []);
        
        async function startCamera() {
          try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
              video: { 
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
              } 
            });
            setStream(mediaStream);
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
            }
          } catch (error) {
            console.error('Camera access error:', error);
          }
        }
        
        function captureImage() {
          if (!videoRef.current || !canvasRef.current) return;
          
          const canvas = canvasRef.current;
          const video = videoRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);
          
          const imageData = canvas.toDataURL('image/jpeg', 0.8);
          
          setCapturedImages(prev => ({
            ...prev,
            [currentView]: imageData
          }));
          
          // Move to next view or process
          if (currentView === 'front') {
            setCurrentView('back');
          } else if (currentView === 'back') {
            setCurrentView('angled');
          } else {
            processImages(imageData);
          }
        }
        
        async function processImages(finalImage) {
          setIsProcessing(true);
          
          try {
            const response = await fetch('/api/verify-pin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                frontImage: capturedImages.front,
                backImage: capturedImages.back,
                angledImage: finalImage
              })
            });
            
            const result = await response.json();
            onCapture(result);
          } catch (error) {
            console.error('Processing error:', error);
            onCapture({
              success: false,
              message: 'Analysis service temporarily unavailable'
            });
          }
        }
        
        const viewTitles = {
          front: 'Front View',
          back: 'Back View',
          angled: 'Angled View'
        };
        
        if (isProcessing) {
          return React.createElement('div', {
            className: 'min-h-screen bg-gray-900 flex items-center justify-center'
          },
            React.createElement('div', { className: 'text-center text-white p-8' },
              React.createElement('div', { 
                className: 'loading-spinner mx-auto mb-6' 
              }),
              React.createElement('h2', { className: 'text-2xl font-bold mb-2' }, 'Analyzing Disney Pin'),
              React.createElement('p', { className: 'text-gray-400' }, 'AI authentication in progress...')
            )
          );
        }
        
        return React.createElement('div', { 
          className: 'min-h-screen bg-gray-900 flex flex-col' 
        },
          React.createElement('div', { className: 'p-4 bg-gray-800 text-white text-center border-b border-gray-700' },
            React.createElement('h2', { className: 'text-xl font-bold' }, viewTitles[currentView]),
            React.createElement('p', { className: 'text-sm text-gray-400 mt-1' }, 
              'Step ' + (Object.keys(capturedImages).length + 1) + ' of 3'
            )
          ),
          React.createElement('div', { className: 'flex-1 relative overflow-hidden' },
            React.createElement('video', {
              ref: videoRef,
              autoPlay: true,
              playsInline: true,
              muted: true,
              className: 'w-full h-full object-cover'
            }),
            React.createElement('div', { className: 'capture-overlay' }),
            React.createElement('canvas', {
              ref: canvasRef,
              style: { display: 'none' }
            })
          ),
          React.createElement('div', { 
            className: 'p-6 bg-gray-800 border-t border-gray-700' 
          },
            React.createElement('div', { className: 'flex justify-between items-center max-w-md mx-auto' },
              React.createElement('button', {
                className: 'bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-500 transition-colors',
                onClick: onBack
              }, 'Back'),
              React.createElement('button', {
                className: 'bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg',
                onClick: captureImage
              }, currentView === 'angled' ? 'Analyze Pin' : 'Capture ' + viewTitles[currentView])
            )
          )
        );
      }
      
      function ResultsPage({ result, onBack }) {
        return React.createElement('div', {
          className: 'min-h-screen bg-gray-50 p-6'
        },
          React.createElement('div', { className: 'max-w-lg mx-auto' },
            React.createElement('div', { className: 'bg-white rounded-2xl shadow-xl p-8 mb-6' },
              React.createElement('h2', { className: 'text-3xl font-bold text-center mb-6 text-gray-900' }, 'Authentication Results'),
              result.success ? 
                React.createElement('div', { className: 'space-y-6' },
                  React.createElement('div', { 
                    className: result.authentic ? 'p-6 bg-green-50 border border-green-200 rounded-xl' : 'p-6 bg-yellow-50 border border-yellow-200 rounded-xl'
                  },
                    React.createElement('h3', { 
                      className: result.authentic ? 'text-green-800 font-bold text-xl text-center' : 'text-yellow-800 font-bold text-xl text-center'
                    }, result.authentic ? '✓ Authentic Disney Pin' : '⚠ Authenticity Uncertain'),
                    result.authenticityRating && React.createElement('p', { 
                      className: result.authentic ? 'text-center text-green-600 font-semibold mt-2' : 'text-center text-yellow-600 font-semibold mt-2'
                    }, 'Confidence Score: ' + result.authenticityRating + '%')
                  ),
                  result.analysis && React.createElement('div', { className: 'bg-gray-50 p-4 rounded-lg' },
                    React.createElement('h4', { className: 'font-bold mb-2 text-gray-900' }, 'Analysis'),
                    React.createElement('p', { className: 'text-gray-700 text-sm leading-relaxed' }, result.analysis)
                  ),
                  result.identification && React.createElement('div', { className: 'bg-blue-50 p-4 rounded-lg' },
                    React.createElement('h4', { className: 'font-bold mb-2 text-blue-900' }, 'Pin Identification'),
                    React.createElement('p', { className: 'text-blue-800 text-sm leading-relaxed' }, result.identification)
                  ),
                  result.pricing && React.createElement('div', { className: 'bg-purple-50 p-4 rounded-lg' },
                    React.createElement('h4', { className: 'font-bold mb-2 text-purple-900' }, 'Estimated Value'),
                    React.createElement('p', { className: 'text-purple-800 text-sm leading-relaxed' }, result.pricing)
                  )
                ) :
                React.createElement('div', { 
                  className: 'p-6 bg-red-50 border border-red-200 rounded-xl text-center' 
                },
                  React.createElement('h3', { className: 'text-red-800 font-bold text-xl mb-2' }, '✗ Analysis Failed'),
                  React.createElement('p', { className: 'text-red-600' }, result.message || 'Unable to process pin images')
                )
            ),
            React.createElement('button', {
              className: 'w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg',
              onClick: onBack
            }, 'Authenticate Another Pin')
          )
        );
      }
      
      // Start the app
      const root = ReactDOM.createRoot(document.getElementById('root'));
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
    message: 'Internal server error',
    error: isDevelopment ? err.message : undefined
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Disney Pin Authenticator (${isDevelopment ? 'Development' : 'Production'}) running on port ${PORT}`);
  console.log('Server ready for requests');
});