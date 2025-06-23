import { useState, useRef, useEffect } from "react";
import { RiFocus3Line } from "react-icons/ri";
import { useCamera } from "@/hooks/use-camera";
import { Button } from "@/components/ui/button";

interface CameraViewProps {
  onCapture: (imageData: string) => void;
}

export default function CameraView({ onCapture }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { 
    stream, 
    error, 
    startCamera, 
    stopCamera, 
    isCameraReady 
  } = useCamera(videoRef);

  // State variables for component functionality
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCameraHelp, setShowCameraHelp] = useState(false);
  
  // Immediately provide a simple test function for demo mode
  // This ensures the app is usable even if camera access is completely blocked
  useEffect(() => {
    // Attach a global function for demo mode
    (window as any).triggerDemoCapture = () => {
      // Create a simple colored rectangle as fallback for testing
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0070d1'; // Disney blue
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = 'white';
          ctx.font = '20px Arial';
          ctx.fillText('Demo Mode - No Camera', 180, 240);
          
          const testImage = canvas.toDataURL('image/jpeg');
          onCapture(testImage);
        }
      }
    };
    
    return () => {
      // Clean up the global function
      delete (window as any).triggerDemoCapture;
    };
  }, [onCapture]);
  
  // Set a timer to show help message if camera doesn't initialize quickly (after 3 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isCameraReady && !error) {
        console.log("Camera taking too long to initialize, showing help");
        setShowCameraHelp(true);
      }
    }, 3000);
    
    // Clear the timer if camera becomes ready
    if (isCameraReady || error) {
      clearTimeout(timer);
    }
    
    return () => clearTimeout(timer);
  }, [isCameraReady, error]);

  // Simplified camera initialization with direct approach
  useEffect(() => {
    console.log("Initializing camera with direct approach");
    
    // Start the camera immediately
    startCamera();
    
    // Set up a simple retry if the camera doesn't initialize within 5 seconds
    const retryTimeout = setTimeout(() => {
      if (!isCameraReady && !error) {
        console.log("Camera not initialized after timeout, attempting one retry");
        stopCamera();
        
        setTimeout(() => {
          console.log("Retrying camera initialization...");
          startCamera();
        }, 1000);
      }
    }, 5000);
    
    // Return cleanup function
    return () => {
      console.log("Stopping camera on unmount");
      clearTimeout(retryTimeout);
      stopCamera();
    };
  }, [startCamera, stopCamera, isCameraReady, error]);

  const capturePhoto = () => {
    console.log("Capture photo button clicked");
    
    // Prevent multiple rapid captures
    if (isCapturing) {
      console.log("Already capturing an image");
      return;
    }
    
    setIsCapturing(true);
    
    if (!isCameraReady) {
      console.log("Camera not ready yet");
      setIsCapturing(false);
      return;
    }
    
    if (!videoRef.current) {
      console.log("Video ref not available");
      setIsCapturing(false);
      return;
    }
    
    if (!canvasRef.current) {
      console.log("Canvas ref not available");
      setIsCapturing(false);
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    console.log("Video dimensions:", video.videoWidth, video.videoHeight);
    
    // If video dimensions are invalid, use the video element's display dimensions
    const width = video.videoWidth || video.clientWidth || 640;
    const height = video.videoHeight || video.clientHeight || 480;
    
    console.log("Using dimensions:", width, height);
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Draw the video frame to the canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      try {
        // Try to draw the current frame
        ctx.drawImage(video, 0, 0, width, height);
        
        // Convert canvas to data URL
        const imageData = canvas.toDataURL('image/jpeg');
        console.log("Image captured successfully");
        
        // If we got here, we successfully captured an image
        onCapture(imageData);
      } catch (error) {
        console.error("Error capturing image:", error);
        
        // If drawing fails, try a fallback approach - create a dummy colored image
        try {
          // Create a simple colored rectangle as fallback for testing
          ctx.fillStyle = '#0070d1'; // Disney blue
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = 'white';
          ctx.font = '20px Arial';
          ctx.fillText('Camera capture simulation', 20, height/2);
          
          const fallbackImage = canvas.toDataURL('image/jpeg');
          console.log("Generated fallback image");
          onCapture(fallbackImage);
        } catch (fallbackError) {
          console.error("Fallback image also failed:", fallbackError);
        }
      } finally {
        setIsCapturing(false);
      }
    } else {
      console.log("Could not get canvas context");
      setIsCapturing(false);
    }
  };

  return (
    <div className="relative flex-grow flex flex-col bg-black">
      <div className="relative flex-grow flex items-center justify-center overflow-hidden">
        {/* Camera feed */}
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          {error ? (
            <div className="text-white text-center p-4 max-w-sm">
              <p className="mb-2 text-base font-medium">Camera Access Error</p>
              <p className="text-sm opacity-80 mb-4">{error}</p>
              <div className="flex flex-col items-center space-y-3">
                <button 
                  onClick={() => {
                    // Clear error and try again
                    console.log("Retrying camera access...");
                    startCamera();
                  }}
                  className="px-4 py-2 bg-white text-disneyBlue rounded-full text-sm font-medium"
                >
                  Retry Camera Access
                </button>
                <p className="text-xs opacity-70 mt-2">
                  Your browser or device might be blocking camera access. 
                  Check your permissions and try again.
                </p>
              </div>
            </div>
          ) : !isCameraReady ? (
            <div className="text-white flex flex-col items-center justify-center">
              <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full mb-3" />
              <p className="text-base mb-1">Accessing camera...</p>
              <p className="text-xs opacity-70">This may take a moment. Please allow camera access if prompted.</p>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="min-w-full min-h-full object-cover"
            />
          )}
        </div>
        
        {/* Hidden canvas for capturing images */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Camera guide overlay */}
        <div className="camera-guide w-64 h-64 rounded-full relative z-10">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <RiFocus3Line className="text-5xl mb-2 pulse" />
            </div>
          </div>
        </div>
        
        {/* Camera guides */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="bg-black bg-opacity-50 text-white text-xs px-3 py-2 rounded-full">
            Hold steady • Center pin • Good lighting
          </div>
        </div>
        
        {/* Camera help overlay - shows after 5 seconds if camera isn't loading */}
        {showCameraHelp && !isCameraReady && !error && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg p-5 mx-4 max-w-sm text-center">
              <h3 className="font-bold text-gray-900 text-lg mb-2">Camera Troubleshooting</h3>
              <p className="text-gray-700 text-sm mb-3">
                Camera initialization is taking longer than expected. Here are some things to try:
              </p>
              
              <ul className="text-left text-sm text-gray-700 mb-4 space-y-1">
                <li className="flex items-start">
                  <svg className="h-4 w-4 text-disneyBlue mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Check if your browser has camera permissions
                </li>
                <li className="flex items-start">
                  <svg className="h-4 w-4 text-disneyBlue mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Make sure no other applications are using your camera
                </li>
                <li className="flex items-start">
                  <svg className="h-4 w-4 text-disneyBlue mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Try using a different browser (Chrome works best)
                </li>
                <li className="flex items-start">
                  <svg className="h-4 w-4 text-disneyBlue mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Some browsers require HTTPS for camera access
                </li>
              </ul>
              
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={() => {
                    // Try restarting the camera
                    setShowCameraHelp(false);
                    stopCamera();
                    setTimeout(() => {
                      startCamera();
                    }, 500);
                  }}
                  className="px-4 py-2 bg-disneyBlue rounded-lg text-white text-sm font-medium flex-1"
                >
                  Retry Camera
                </button>
                
                <button
                  onClick={() => {
                    // Create a demo image if user wants to skip troubleshooting
                    const canvas = canvasRef.current;
                    if (canvas) {
                      canvas.width = 640;
                      canvas.height = 480;
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        // Create a gradient background 
                        const bgGradient = ctx.createLinearGradient(0, 0, 0, 480);
                        bgGradient.addColorStop(0, '#1a237e');  // Dark blue
                        bgGradient.addColorStop(1, '#0070d1');  // Disney blue
                        ctx.fillStyle = bgGradient;
                        ctx.fillRect(0, 0, 640, 480);
                        
                        // Draw Mickey silhouette
                        ctx.beginPath();
                        ctx.arc(320, 240, 100, 0, Math.PI * 2); // Main head
                        ctx.arc(250, 170, 60, 0, Math.PI * 2); // Left ear
                        ctx.arc(390, 170, 60, 0, Math.PI * 2); // Right ear
                        ctx.fillStyle = 'black';
                        ctx.fill();
                        
                        // Demo text
                        ctx.fillStyle = 'white';
                        ctx.font = 'bold 32px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('Disney Pin Demo', 320, 380);
                        
                        const testImage = canvas.toDataURL('image/jpeg');
                        onCapture(testImage);
                      }
                    }
                  }}
                  className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700 text-sm font-medium flex-1"
                >
                  Use Demo Mode
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Camera Controls */}
      <div className="bg-black p-6 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <button
            onClick={() => {
              console.log("Capture button clicked directly");
              capturePhoto();
            }}
            disabled={!isCameraReady || isCapturing}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center focus:outline-none hover:bg-white hover:bg-opacity-20 transition bg-disneyBlue disabled:opacity-50"
            aria-label="Capture photo"
          >
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-disneyBlue"></div>
            </div>
          </button>
          
          {/* Fallback button - more prominent */}
          <div className="mt-3 w-full flex flex-col items-center">
            <div className="mt-2 w-full border-t border-gray-700 pt-4 pb-1 text-center">
              <p className="mb-3 text-sm text-white font-medium">
                Camera troubleshooting
              </p>
              
              <div className="text-xs text-white/80 mb-4">
                <p className="mb-1">• Allow camera permissions in browser settings</p>
                <p className="mb-1">• Try using another browser (Chrome recommended)</p>
                <p className="mb-1">• Make sure no other apps are using your camera</p>
                <p className="mb-1">• Try refreshing the page</p>
              </div>
              
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => {
                    // Clear any errors and retry camera access
                    console.log("Retry camera access from button");
                    startCamera();
                  }}
                  className="px-4 py-2 bg-white text-disneyBlue text-sm font-medium rounded hover:bg-gray-100 transition-colors"
                >
                  Retry Camera
                </button>
                
                <button
                  onClick={() => {
                    console.log("Demo button clicked");
                    // Create a detailed Disney-themed test image
                    const canvas = canvasRef.current;
                    if (canvas) {
                      canvas.width = 640;
                      canvas.height = 480;
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        // Create a gradient background 
                        const bgGradient = ctx.createLinearGradient(0, 0, 0, 480);
                        bgGradient.addColorStop(0, '#1a237e');  // Dark blue
                        bgGradient.addColorStop(1, '#0070d1');  // Disney blue
                        ctx.fillStyle = bgGradient;
                        ctx.fillRect(0, 0, 640, 480);
                        
                        // Draw Mickey silhouette
                        ctx.beginPath();
                        ctx.arc(320, 240, 100, 0, Math.PI * 2); // Main head
                        ctx.arc(250, 170, 60, 0, Math.PI * 2); // Left ear
                        ctx.arc(390, 170, 60, 0, Math.PI * 2); // Right ear
                        ctx.fillStyle = 'black';
                        ctx.fill();
                        
                        // Demo text
                        ctx.fillStyle = 'white';
                        ctx.font = 'bold 32px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('Disney Pin Demo', 320, 380);
                        
                        const testImage = canvas.toDataURL('image/jpeg');
                        onCapture(testImage);
                      }
                    }
                  }}
                  className="px-4 py-2 bg-disneyBlue text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                >
                  Use Demo Mode
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Debug Status Indicator (small and unobtrusive) */}
      <div className="absolute bottom-24 right-4 text-[10px] bg-black bg-opacity-40 text-white/60 p-1 rounded-sm">
        {isCameraReady ? '✓' : '✗'}
      </div>
    </div>
  );
}
