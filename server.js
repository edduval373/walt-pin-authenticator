


/**
 * Disney Pin Authenticator Production Server
 * Serves the working React app with camera functionality
 */

import express from 'express';
import FormData from 'form-data';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT) || 5000;

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
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
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
        return React.createElement('div', { 
          className: 'min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white' 
        },
          React.createElement('div', { className: 'max-w-md text-center' },
            React.createElement('div', { className: 'mb-8' },
              React.createElement('div', { 
                className: 'w-24 h-24 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center' 
              },
                React.createElement('span', { 
                  className: 'text-3xl text-white font-bold' 
                }, 'W')
              )
            ),
            React.createElement('h1', { 
              className: 'text-3xl font-bold text-gray-900 mb-2' 
            }, 'Disney Pin Authenticator'),
            React.createElement('p', { 
              className: 'text-lg text-blue-600 font-semibold mb-6' 
            }, 'W.A.L.T.'),
            React.createElement('p', { 
              className: 'text-sm text-gray-500 mb-8' 
            }, 'World-class Authentication and Lookup Tool'),
            React.createElement('div', { className: 'space-y-4 mb-8 text-left' },
              React.createElement('div', { className: 'flex items-start space-x-3' },
                React.createElement('div', { className: 'w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0' }),
                React.createElement('p', { className: 'text-sm text-gray-600' }, 'Advanced AI-powered authentication')
              ),
              React.createElement('div', { className: 'flex items-start space-x-3' },
                React.createElement('div', { className: 'w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0' }),
                React.createElement('p', { className: 'text-sm text-gray-600' }, 'Multi-angle image analysis')
              ),
              React.createElement('div', { className: 'flex items-start space-x-3' },
                React.createElement('div', { className: 'w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0' }),
                React.createElement('p', { className: 'text-sm text-gray-600' }, 'Comprehensive authenticity scoring')
              )
            ),
            React.createElement('button', {
              className: 'w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg',
              onClick: onNext
            }, 'Start Authentication'),
            React.createElement('p', { 
              className: 'text-xs text-gray-400 mt-4' 
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
            React.createElement('div', { className: 'flex space-x-4' },
              React.createElement('button', {
                className: 'flex-1 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors',
                onClick: onBack
              }, 'Back to Camera'),
              React.createElement('button', {
                className: 'flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors',
                onClick: () => window.location.reload()
              }, 'Analyze Another Pin')
            )
          )
        );
      }
      
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
    </script>
  </body>
</html>
`);
});

// Start server
console.log('Starting Disney Pin Authenticator server...');
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Disney Pin Authenticator running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/healthz`);
  console.log(`🔗 API endpoint: https://master.pinauth.com/mobile-upload`);
});
