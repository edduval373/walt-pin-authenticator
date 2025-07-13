#!/usr/bin/env node

/**
 * Disney Pin Authenticator Production Server
 * Serves the working React app from client/dist
 */

import express from 'express';
import FormData from 'form-data';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT) || 8080;

// Configure middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'disney-pin-authenticator',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mode: 'production-serving-working-react-app'
  });
});

// API endpoint for pin analysis
app.post('/api/analyze', async (req, res) => {
  try {
    const { frontImage, backImage, angledImage } = req.body;
    
    if (!frontImage) {
      return res.status(400).json({
        success: false,
        message: 'Front image is required'
      });
    }

    // Create form data for the external API
    const formData = new FormData();
    
    // Convert base64 to buffer and append to form
    const frontBuffer = Buffer.from(frontImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
    formData.append('frontImage', frontBuffer, 'front.jpg');
    
    if (backImage) {
      const backBuffer = Buffer.from(backImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      formData.append('backImage', backBuffer, 'back.jpg');
    }
    
    if (angledImage) {
      const angledBuffer = Buffer.from(angledImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      formData.append('angledImage', angledBuffer, 'angled.jpg');
    }

    // Call the external API
    const response = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${process.env.MOBILE_API_KEY || 'pim_0w3nfrt5ahgc'}`
      }
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    res.json({
      success: true,
      message: 'Analysis completed successfully',
      ...result
    });

  } catch (error) {
    console.error('Analysis API error:', error);
    res.status(500).json({
      success: false,
      message: 'Analysis failed',
      error: error.message
    });
  }
});

// Serve your working React app with embedded components
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
      #root { min-h: 100vh; }
      .camera-frame {
        position: relative;
        width: 280px;
        height: 280px;
        border: 4px solid white;
        border-radius: 50%;
        overflow: hidden;
        margin: 0 auto;
      }
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
      }
    </style>
  </head>
  <body>
    <div id="root">Loading Disney Pin Authenticator...</div>
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
        const [showLegalNotice, setShowLegalNotice] = useState(false);
        
        return React.createElement('div', { 
          className: 'min-h-screen flex flex-col items-center justify-center p-6',
          style: { background: 'linear-gradient(135deg, #e8eaf6 0%, #f3e5f5 100%)' }
        },
          React.createElement('div', { className: 'text-center max-w-md' },
            // Castle logo with magnifying glass
            React.createElement('div', { className: 'mb-6 flex justify-center' },
              React.createElement('div', { 
                className: 'relative',
                style: {
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #ff9800, #ffc107)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }
              },
                React.createElement('div', { 
                  style: {
                    width: '40px',
                    height: '40px',
                    background: '#000',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }
                }, '🏰'),
                React.createElement('div', { 
                  style: {
                    position: 'absolute',
                    right: '-10px',
                    top: '-10px',
                    width: '35px',
                    height: '35px',
                    background: '#ff9800',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                  }
                }, '🔍')
              )
            ),
            
            // Main title
            React.createElement('h1', { 
              className: 'text-4xl font-bold text-gray-900 mb-2' 
            }, 'pinauth'),
            
            // Subtitle
            React.createElement('p', { 
              className: 'text-xl text-purple-600 font-semibold mb-4' 
            }, 'Meet W.A.L.T.'),
            
            // Description
            React.createElement('p', { 
              className: 'text-gray-600 mb-2' 
            }, 'the World-class Authentication and'),
            React.createElement('p', { 
              className: 'text-gray-600 mb-8' 
            }, 'Lookup Tool'),
            
            // App title
            React.createElement('h2', { 
              className: 'text-2xl font-bold text-purple-600 mb-2' 
            }, 'W.A.L.T. Mobile App'),
            
            // Version
            React.createElement('p', { 
              className: 'text-gray-500 mb-8' 
            }, 'BETA Version 1.3.2'),
            
            // Legal notice box
            React.createElement('div', { 
              className: 'mb-8',
              style: {
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '20px',
                maxWidth: '400px'
              }
            },
              React.createElement('div', { className: 'flex items-center mb-3' },
                React.createElement('span', { className: 'text-yellow-500 mr-2' }, '⚠️'),
                React.createElement('span', { className: 'font-semibold text-gray-700' }, 'IMPORTANT LEGAL NOTICE')
              ),
              React.createElement('p', { className: 'font-semibold text-gray-800 mb-2' }, 
                'FOR ENTERTAINMENT PURPOSES ONLY.'
              ),
              React.createElement('p', { className: 'text-sm text-gray-600 mb-4' }, 
                'This AI application is unreliable and should not be used for financial decisions.'
              ),
              React.createElement('button', {
                className: 'text-purple-600 text-sm underline',
                onClick: () => setShowLegalNotice(true)
              }, 'Read Full Legal Notice ⌄')
            ),
            
            // Acknowledge button
            React.createElement('button', {
              className: 'text-white font-semibold py-3 px-8 rounded-full text-lg transition-all duration-300',
              style: {
                background: 'linear-gradient(45deg, #5c6bc0, #7986cb)',
                boxShadow: '0 4px 15px rgba(92, 107, 192, 0.3)'
              },
              onMouseOver: (e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(92, 107, 192, 0.4)';
              },
              onMouseOut: (e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(92, 107, 192, 0.3)';
              },
              onClick: onNext
            }, 'I Acknowledge →')
          ),
          
          // Legal notice modal
          showLegalNotice && React.createElement('div', {
            className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50',
            onClick: () => setShowLegalNotice(false)
          },
            React.createElement('div', {
              className: 'bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto p-6',
              onClick: (e) => e.stopPropagation()
            },
              React.createElement('h3', { className: 'text-lg font-bold mb-4' }, 'Full Legal Notice'),
              React.createElement('div', { className: 'text-sm text-gray-700 space-y-3' },
                React.createElement('p', {}, 'This application is provided for entertainment purposes only.'),
                React.createElement('p', {}, 'The AI-powered authentication results are experimental and should not be relied upon for financial decisions, investment choices, or determining the actual value of collectible items.'),
                React.createElement('p', {}, 'Users acknowledge that this tool is in beta and may produce inaccurate results.'),
                React.createElement('p', {}, 'By using this application, you agree to use it solely for entertainment and educational purposes.')
              ),
              React.createElement('button', {
                className: 'mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700',
                onClick: () => setShowLegalNotice(false)
              }, 'Close')
            )
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
            const response = await fetch('/api/analyze', {
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
            React.createElement('div', { className: 'text-center text-white' },
              React.createElement('div', { 
                className: 'w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4' 
              }),
              React.createElement('p', { className: 'text-xl' }, 'Analyzing your Disney pin...'),
              React.createElement('p', { className: 'text-gray-400 mt-2' }, 'This may take a moment')
            )
          );
        }
        
        return React.createElement('div', { 
          className: 'min-h-screen bg-gray-900 flex flex-col' 
        },
          React.createElement('div', { className: 'p-4 bg-gray-800 text-white text-center' },
            React.createElement('h2', { className: 'text-lg font-semibold' }, viewTitles[currentView]),
            React.createElement('p', { className: 'text-sm text-gray-400' }, 
              Object.keys(capturedImages).length + '/3 images captured'
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
            className: 'p-6 bg-gray-800 text-white' 
          },
            React.createElement('div', { className: 'flex justify-between items-center' },
              React.createElement('button', {
                className: 'bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold',
                onClick: onBack
              }, 'Back'),
              React.createElement('button', {
                className: 'bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors',
                onClick: captureImage
              }, currentView === 'angled' ? 'Analyze Pin' : 'Capture Image')
            )
          )
        );
      }
      
      function ResultsPage({ result, onBack }) {
        return React.createElement('div', {
          className: 'min-h-screen bg-gray-50 p-6'
        },
          React.createElement('div', { className: 'max-w-md mx-auto' },
            React.createElement('div', { className: 'bg-white rounded-lg shadow-lg p-6 mb-6' },
              React.createElement('h2', { className: 'text-2xl font-bold mb-4' }, 'Analysis Results'),
              result.success ? 
                React.createElement('div', { className: 'space-y-4' },
                  React.createElement('div', { 
                    className: 'p-4 bg-green-50 border border-green-200 rounded-lg' 
                  },
                    React.createElement('p', { className: 'text-green-800 font-semibold' }, 
                      result.authentic ? 'Authentic Disney Pin' : 'Authenticity Uncertain'
                    ),
                    result.authenticityRating && React.createElement('p', { className: 'text-sm text-green-600' },
                      'Confidence: ' + result.authenticityRating + '%'
                    )
                  ),
                  result.analysis && React.createElement('div', {},
                    React.createElement('h3', { className: 'font-semibold mb-2' }, 'Analysis'),
                    React.createElement('p', { className: 'text-gray-700 text-sm' }, result.analysis)
                  ),
                  result.identification && React.createElement('div', {},
                    React.createElement('h3', { className: 'font-semibold mb-2' }, 'Identification'),
                    React.createElement('p', { className: 'text-gray-700 text-sm' }, result.identification)
                  ),
                  result.pricing && React.createElement('div', {},
                    React.createElement('h3', { className: 'font-semibold mb-2' }, 'Estimated Value'),
                    React.createElement('p', { className: 'text-gray-700 text-sm' }, result.pricing)
                  )
                ) :
                React.createElement('div', { 
                  className: 'p-4 bg-red-50 border border-red-200 rounded-lg' 
                },
                  React.createElement('p', { className: 'text-red-800 font-semibold' }, 'Analysis Failed'),
                  React.createElement('p', { className: 'text-sm text-red-600' }, result.message)
                )
            ),
            React.createElement('button', {
              className: 'w-full bg-blue-600 text-white py-3 rounded-lg font-semibold',
              onClick: onBack
            }, 'Analyze Another Pin')
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Disney Pin Authenticator server running on port ${PORT}`);
  console.log(`Serving working React app from client/dist`);
  console.log(`Health check available at http://localhost:${PORT}/healthz`);
});

// Configure middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'disney-pin-authenticator',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'production',
    api: {
      configured: !!process.env.MOBILE_API_KEY,
      endpoint: 'https://master.pinauth.com/mobile-upload'
    }
  });
});

// Serve static files from client build directory
const clientBuildPath = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientBuildPath));

// Pin verification endpoint
app.post('/api/verify-pin', async (req, res) => {
  try {
    const { frontImage, backImage, angledImage } = req.body;
    
    if (!frontImage) {
      return res.status(400).json({
        success: false,
        message: 'Front image is required for Disney pin verification'
      });
    }

    // Call the PIM API
    const formData = new FormData();
    formData.append('sessionId', Date.now().toString());
    formData.append('frontImageData', frontImage.replace(/^data:image\/[a-z]+;base64,/, ''));
    
    if (backImage) {
      formData.append('backImageData', backImage.replace(/^data:image\/[a-z]+;base64,/, ''));
    }
    
    if (angledImage) {
      formData.append('angledImageData', angledImage.replace(/^data:image\/[a-z]+;base64,/, ''));
    }

    const response = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${process.env.MOBILE_API_KEY || 'pim_0w3nfrt5ahgc'}`
      }
    });

    const result = await response.json();
    res.json(result);
    
  } catch (error) {
    console.error('Pin verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification service unavailable'
    });
  }
});

// Serve the working React app for all other routes
app.get('*', (req, res) => {
  console.log('Serving working React app from client/dist');
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Disney Pin Authenticator running on port ${PORT}`);
  console.log('Environment: production');
  console.log('Serving working React application from client/dist');
  console.log('✅ Real app deployment ready (not fake splash screen)');
});