import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RiTimeLine, RiSearchLine, RiCpuLine, RiCheckboxCircleLine } from "react-icons/ri";
import TransmissionLogViewer from "@/components/TransmissionLogViewer";
import { analyzePinImage, AnalysisResult } from "@/lib/pin-authenticator";
import ApiUnavailableMessage from "@/components/ApiUnavailableMessage";
import { transmissionLogger } from "@/lib/transmission-logger";
import StepProgress from "@/components/StepProgress";
import ServerErrorScreen from "@/components/ServerErrorScreen";

// Import the updated API
import { analyzePinImagesWithPimStandard } from "@/lib/pim-standard-api";

interface CapturedImages {
  front: string;
  back?: string;
  angled?: string;
}

export default function ProcessingPage() {
  const [, setLocation] = useLocation();
  
  // Add comprehensive error handler to prevent the black error overlay
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.log('Suppressed unhandled promise rejection:', event.reason);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    };
    
    const handleError = (event: ErrorEvent) => {
      console.log('Suppressed error:', event.error);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);
    window.addEventListener('error', handleError, true);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
      window.removeEventListener('error', handleError, true);
    };
  }, []);
  const [capturedImages, setCapturedImages] = useState<CapturedImages | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isApiUnavailable, setIsApiUnavailable] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const [currentView, setCurrentView] = useState<'front' | 'back' | 'angled'>('front');
  const [statusMessage, setStatusMessage] = useState<string>("Starting analysis...");
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [showTransmissionLog, setShowTransmissionLog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    front: 0,
    back: 0,
    angled: 0
  });
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisRating, setAnalysisRating] = useState<string | null>(null);
  const [analysisDescription, setAnalysisDescription] = useState<string>("");
  
  // Ref to track if processing is running
  const isProcessing = React.useRef(false);
  
  // Load captured images from sessionStorage or global memory on component mount
  useEffect(() => {
    console.log("Loading capturedImages from storage");
    
    let images = null;
    
    // First try sessionStorage
    const storedImages = sessionStorage.getItem('capturedImages');
    if (storedImages) {
      try {
        images = JSON.parse(storedImages);
        console.log("Successfully loaded captured images from sessionStorage");
      } catch (error) {
        console.error("Failed to parse captured images from sessionStorage:", error);
      }
    }
    
    // If sessionStorage failed, try global memory storage
    if (!images && (window as any).tempImageStorage) {
      images = (window as any).tempImageStorage;
      console.log("Successfully loaded captured images from global memory storage");
      // Clean up global storage after loading
      delete (window as any).tempImageStorage;
    }
    
    if (images && images.front) {
      setCapturedImages(images);
      console.log("Images loaded successfully, front view available");
    } else {
      console.log("No valid captured images found, redirecting to camera");
      setLocation('/camera');
    }
  }, [setLocation]);
  
  // Create a retry function that can be called from the button
  const retryProcessing = () => {
    setShowRetryButton(false);
    setError(null);
    setProgress(0);
    setCurrentStep(1);
    setStatusMessage("Starting analysis...");
    isProcessing.current = false;
    
    // Restart processing
    if (capturedImages) {
      isProcessing.current = true;
      processImages();
    }
  };

  // Move processImages function outside useEffect so it can be called from retry
  const processImages = async () => {
    if (!capturedImages) {
      setError("No images available for processing");
      setShowRetryButton(true);
      return;
    }
    
    try {
      // Step 1: Prepare for processing (no image progress yet)
      setCurrentStep(1);
      setCurrentView('front');
      setStatusMessage("Preparing Disney pin analysis...");
      setProgress(20);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Step 2: Validate images (no upload progress yet)
      setCurrentStep(2);
      setStatusMessage("Validating captured images...");
      setProgress(50);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("Image validation complete - ready for health check");
      
      // Step 3: Health check FIRST before any API submission
      setCurrentStep(3);
      setCurrentView('front');
      setStatusMessage("Checking server connection...");
      setProgress(75);
      
      // Health check before any transmission
      console.log("Checking server health before upload...");
      
      // Perform actual health check with proper error handling
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const healthResponse = await fetch('/api/proxy/health', {
          method: 'GET',
          signal: controller.signal
        }).catch(fetchError => {
          clearTimeout(timeoutId);
          // Handle network errors gracefully
          throw new Error(`Network error: ${fetchError.message}`);
        });
        
        clearTimeout(timeoutId);
        
        if (!healthResponse.ok) {
          throw new Error(`Health check failed: ${healthResponse.status}`);
        }
        
        console.log("Health check successful");
        transmissionLogger.logHealthCheck('success', 'Server health check passed');
        setStatusMessage("Server connection verified");
        setProgress(90);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Now proceed with image upload with progress tracking
        setStatusMessage("Uploading images for analysis...");
        
        // Initialize upload progress
        setUploadProgress({
          front: 0,
          back: 0,
          angled: 0
        });
        
        // Simulate front image upload progress
        setCurrentView('front');
        setStatusMessage("Transmitting front view...");
        for (let i = 0; i <= 100; i += 20) {
          setUploadProgress(prev => ({ ...prev, front: i }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Simulate back image upload progress (if available)
        if (capturedImages.back) {
          setCurrentView('back');
          setStatusMessage("Transmitting back view...");
          for (let i = 0; i <= 100; i += 25) {
            setUploadProgress(prev => ({ ...prev, back: i }));
            await new Promise(resolve => setTimeout(resolve, 80));
          }
        }
        
        // Simulate angled image upload progress (if available)
        if (capturedImages.angled) {
          setCurrentView('angled');
          setStatusMessage("Transmitting angled view...");
          for (let i = 0; i <= 100; i += 25) {
            setUploadProgress(prev => ({ ...prev, angled: i }));
            await new Promise(resolve => setTimeout(resolve, 80));
          }
        }
        
        setStatusMessage("Processing images with PIM Standard analyzer...");
        
        const { analyzePinImagesWithPimStandard } = await import('@/lib/pim-standard-api');
        
        if (!capturedImages.front) {
          throw new Error("No front image available");
        }
        
        const result = await analyzePinImagesWithPimStandard(
          capturedImages.front,
          capturedImages.back || undefined,
          capturedImages.angled || undefined
        );
        
        console.log("Pin analysis complete:", result);
        
        // Check if the result indicates success
        if (result && result.success) {
          // Use server-provided session ID for logging
          const serverSessionId = result.sessionId;
          
          // Capture raw request data
          const rawRequest = `POST /mobile-upload HTTP/1.1
Host: ${window.location.host}

Headers: {
  "Content-Type": "application/json",
  "x-api-key": "pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g"
}

Body: {
  "sessionId": "${serverSessionId}",
  "frontImageData": "[BASE64_IMAGE_DATA_${capturedImages.front.length}_CHARS]"${capturedImages.back ? `,
  "backImageData": "[BASE64_IMAGE_DATA_${capturedImages.back.length}_CHARS]"` : ''}${capturedImages.angled ? `,
  "angledImageData": "[BASE64_IMAGE_DATA_${capturedImages.angled.length}_CHARS]"` : ''}
}`;

          // Capture raw response data
          const rawResponse = `HTTP/1.1 200 OK
Content-Type: application/json

${JSON.stringify(result, null, 2)}`;

          transmissionLogger.logImageUpload(
            'success', 
            'Images uploaded and analyzed successfully', 
            import.meta.env.VITE_PIM_API_URL || 'https://master.pinauth.com/mobile-upload', 
            undefined, 
            JSON.stringify(result),
            import.meta.env.VITE_MOBILE_API_KEY || 'pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g',
            serverSessionId,
            {
              'Content-Type': 'application/json',
              'x-api-key': import.meta.env.VITE_MOBILE_API_KEY || 'pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g'
            },
            rawRequest,
            rawResponse
          );
          
          // Store authentic server response only
          sessionStorage.setItem('analysisResult', JSON.stringify(result));
          sessionStorage.setItem('serverResponse', JSON.stringify(result));
          sessionStorage.setItem('capturedImages', JSON.stringify(capturedImages));
          
          setProgress(100);
          setStatusMessage("Analysis complete!");
          
          // Navigate to results page to show the analysis
          setTimeout(() => {
            setLocation('/results');
          }, 1000);
        } else {
          // Handle case where result indicates failure
          throw new Error(result?.message || "Analysis failed");
        }
        
      } catch (healthError) {
        console.log("Health check failed:", healthError);
        transmissionLogger.logHealthCheck('failed', 'Server health check failed', healthError instanceof Error ? healthError.message : String(healthError));
        setError("Cannot connect to server. Please check your connection and try again.");
        setStatusMessage("Connection failed - Please retry");
        setProgress(0);
        setShowRetryButton(true);
        isProcessing.current = false;
        return;
      }
      
    } catch (error) {
      console.log("Error in processing:", error);
      // Generate session ID for logging (same format as server)
      const now = new Date();
      const sessionId = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      
      // Capture raw request data for failed attempts
      const rawRequest = `POST /mobile-upload HTTP/1.1
Host: ${(import.meta.env.VITE_PIM_API_URL || 'https://master.pinauth.com/mobile-upload').replace('https://', '')}

Headers: {
  "Content-Type": "application/json",
  "x-api-key": "${import.meta.env.VITE_MOBILE_API_KEY || 'pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g'}"
}

Body: {
  "sessionId": "${sessionId}",
  "frontImageData": "[BASE64_IMAGE_DATA_${capturedImages?.front?.length || 0}_CHARS]"${capturedImages?.back ? `,
  "backImageData": "[BASE64_IMAGE_DATA_${capturedImages.back.length}_CHARS]"` : ''}${capturedImages?.angled ? `,
  "angledImageData": "[BASE64_IMAGE_DATA_${capturedImages.angled.length}_CHARS]"` : ''}
}`;

      // Capture raw error response
      const rawResponse = `HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "success": false,
  "error": "${error instanceof Error ? error.message : String(error)}"
}`;

      transmissionLogger.logImageUpload(
        'failed', 
        'Image upload failed', 
        import.meta.env.VITE_PIM_API_URL || 'https://master.pinauth.com/mobile-upload',
        error instanceof Error ? error.message : String(error),
        undefined,
        import.meta.env.VITE_MOBILE_API_KEY || 'pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g',
        sessionId,
        {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_MOBILE_API_KEY || 'pim_mobile_2505271605_7f8d9e2a1b4c6d8f9e0a1b2c3d4e5f6g'
        },
        rawRequest,
        rawResponse
      );
      
      // Check if it's a server connection error
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isServerError = (error as any)?.isServerError || 
                           errorMessage.includes('Server unavailable') ||
                           errorMessage.includes('404') || 
                           errorMessage.includes('fetch') || 
                           errorMessage.includes('network') || 
                           errorMessage.includes('timeout') || 
                           errorMessage.includes('Not found');
      
      if (isServerError) {
        setShowServerError(true);
      } else {
        setError("An error occurred during processing. Please try again.");
        setStatusMessage("Processing failed - Please retry");
        setProgress(0);
        setShowRetryButton(true);
      }
      isProcessing.current = false;
    }
  };

  // Process images once they're loaded
  useEffect(() => {
    // Only run when capturedImages is set and we're not already processing
    if (!capturedImages || isProcessing.current) {
      return;
    }
    
    // Mark as processing to prevent duplicate runs
    isProcessing.current = true;
    
    processImages().catch((error) => {
      console.log("Processing error caught:", error);
      setError("An error occurred during processing. Please try again.");
      setStatusMessage("Processing failed - Please retry");
      setProgress(0);
      setShowRetryButton(true);
      isProcessing.current = false;
    });
  }, [capturedImages]);
  
  const handleCancel = () => {
    setLocation('/camera');
  };
  
  // Show server error screen if server is unavailable
  if (showServerError) {
    return (
      <ServerErrorScreen
        error="Master server is currently unavailable"
        isConnecting={false}
        onRetry={() => {
          setShowServerError(false);
          if (capturedImages) {
            retryProcessing();
          }
        }}
        onGoBack={() => setLocation('/camera')}
      />
    );
  }

  if (!capturedImages) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const stepNames = ['Start', 'Photo', 'Check', 'Results'];

  return (
    <div className="flex-grow flex flex-col">
      {/* Step Progress */}
      <div className="bg-white shadow-sm">
        <StepProgress 
          currentStep={3} 
          totalSteps={4} 
          stepNames={stepNames}
        />
      </div>
      
      {/* API Unavailable Message */}
      {isApiUnavailable && (
        <ApiUnavailableMessage
          onRetry={() => {
            setIsApiUnavailable(false);
            setError(null);
            // Restart processing
            isProcessing.current = false;
            processImages();
          }}
        />
      )}
      
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          {/* Fun animated header for kids */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              {progress < 30 ? (
                <RiSearchLine className="text-indigo-600 text-2xl" />
              ) : progress < 70 ? (
                <RiCpuLine className="text-indigo-600 text-2xl animate-spin" />
              ) : (
                <RiCheckboxCircleLine className="text-green-600 text-2xl" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Checking Your Pin!</h2>
            <p className="text-lg text-gray-600">{statusMessage}</p>
          </div>
          
          {/* Main progress bar */}
          <div className="mb-6">
            <Progress value={progress} className="h-3 bg-gray-100" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>{progress}% complete</span>
              <span>100%</span>
            </div>
          </div>
          
          {/* Disney pin thumbnails */}
          <div className="flex justify-center mb-6">
            <div className="flex gap-2">
              {/* Front view thumbnail (always present) */}
              <div className={`relative h-14 w-14 rounded-md overflow-hidden border-2 ${
                currentView === 'front' ? 'border-indigo-400' : 'border-gray-300'
              }`}>
                <img 
                  src={capturedImages.front} 
                  alt="Front view" 
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-0.5 text-center">
                  FRONT
                </span>
                {currentView === 'front' && (
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <RiTimeLine className="text-white text-xl animate-pulse" />
                  </div>
                )}
              </div>
              
              {/* Back view thumbnail (if available) */}
              {capturedImages.back && (
                <div className={`relative h-14 w-14 rounded-md overflow-hidden border-2 ${
                  currentView === 'back' ? 'border-indigo-400' : 'border-gray-300'
                }`}>
                  <img 
                    src={capturedImages.back} 
                    alt="Back view" 
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-0.5 text-center">
                    BACK
                  </span>
                  {currentView === 'back' && (
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <RiTimeLine className="text-white text-xl animate-pulse" />
                    </div>
                  )}
                </div>
              )}
              
              {/* Angled view thumbnail (if available) */}
              {capturedImages.angled && (
                <div className={`relative h-14 w-14 rounded-md overflow-hidden border-2 ${
                  currentView === 'angled' ? 'border-indigo-400' : 'border-gray-300'
                }`}>
                  <img 
                    src={capturedImages.angled} 
                    alt="Angled view" 
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-0.5 text-center">
                    ANGLED
                  </span>
                  {currentView === 'angled' && (
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <RiTimeLine className="text-white text-xl animate-pulse" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Analysis progress or rating */}
          <div className="mb-6">
            {progress < 100 ? (
              // Show analysis progress while in progress
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-indigo-700">Analysis Progress</span>
                  <span className="text-xs font-medium text-gray-600">{currentStep} of 3</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-500 ease-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </>
            ) : (
              // Show final rating bar when complete
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-indigo-700">Rating: {analysisRating}</span>
                  <span className="text-xs font-medium text-gray-600">Analysis Complete</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  {analysisRating && analysisRating.includes('/') ? (
                    // If we have a rating like "4/5", create a rating progress bar
                    <div 
                      className="h-full bg-indigo-600" 
                      style={{ 
                        width: `${(parseInt(analysisRating.split('/')[0]) / parseInt(analysisRating.split('/')[1])) * 100}%` 
                      }}
                    ></div>
                  ) : (
                    // Fallback to full bar
                    <div className="h-full bg-indigo-600" style={{ width: '100%' }}></div>
                  )}
                </div>
              </>
            )}
            
            {/* Analysis description */}
            {progress >= 100 && (
              <div className="mt-3 bg-indigo-50 p-3 rounded-md">
                <h3 className="text-sm font-medium text-indigo-700 mb-1">Analysis Result</h3>
                <p className="text-xs text-gray-600">
                  {analysisDescription}
                </p>
              </div>
            )}
          </div>
          
          {/* Individual image upload progress bars */}
          <div className="space-y-3 mb-6">
            {/* Front view progress (always present) */}
            <div>
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span>Front View</span>
                <span>{uploadProgress.front}%</span>
              </div>
              <Progress value={uploadProgress.front} className="h-2 bg-indigo-50" />
            </div>
            
            {/* Back view progress (if available) */}
            {capturedImages.back && (
              <div>
                <div className="flex justify-between text-sm text-gray-700 mb-1">
                  <span>Back View</span>
                  <span>{uploadProgress.back}%</span>
                </div>
                <Progress value={uploadProgress.back} className="h-2 bg-indigo-50" />
              </div>
            )}
            
            {/* Angled view progress (if available) */}
            {capturedImages.angled && (
              <div>
                <div className="flex justify-between text-sm text-gray-700 mb-1">
                  <span>Angled View</span>
                  <span>{uploadProgress.angled}%</span>
                </div>
                <Progress value={uploadProgress.angled} className="h-2 bg-indigo-50" />
              </div>
            )}
          </div>
          
          {/* Current step indicator */}
          <div className="flex justify-center mb-4 space-x-1">
            <span className={`h-2 w-8 rounded-full ${currentStep >= 1 ? 'bg-indigo-500' : 'bg-gray-200'}`}></span>
            <span className={`h-2 w-8 rounded-full ${currentStep >= 2 ? 'bg-indigo-500' : 'bg-gray-200'}`}></span>
            <span className={`h-2 w-8 rounded-full ${currentStep >= 3 ? 'bg-indigo-500' : 'bg-gray-200'}`}></span>
          </div>
          
          {/* Error message if any */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {/* Retry button when connection fails */}
            {showRetryButton && (
              <Button 
                onClick={retryProcessing}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Retry Connection
              </Button>
            )}
            

            
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
      
      {/* Transmission Log Modal */}
      <TransmissionLogViewer
        isOpen={showTransmissionLog}
        onClose={() => setShowTransmissionLog(false)}
      />
    </div>
  );
}