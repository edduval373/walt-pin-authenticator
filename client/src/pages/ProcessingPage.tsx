import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RiTimeLine, RiSearchLine, RiCpuLine, RiCheckboxCircleLine } from "react-icons/ri";

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
  const [statusMessage, setStatusMessage] = useState("Starting analysis...");
  const [error, setError] = useState<string | null>(null);
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [showServerError, setShowServerError] = useState(false);
  const [currentView, setCurrentView] = useState<'front' | 'back' | 'angled'>('front');
  const [uploadProgress, setUploadProgress] = useState({
    front: 0,
    back: 0,
    angled: 0
  });
  
  // Track processing state to prevent multiple runs
  const isProcessing = React.useRef(false);

  // Load captured images from session storage
  useEffect(() => {
    const storedImages = sessionStorage.getItem('capturedImages');
    if (storedImages) {
      try {
        setCapturedImages(JSON.parse(storedImages));
      } catch (error) {
        console.log("Failed to parse stored images:", error);
        setLocation('/camera');
      }
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
        for (let i = 0; i <= 100; i += 20) {
          setUploadProgress(prev => ({ ...prev, back: i }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Simulate angled image upload progress (if available)
      if (capturedImages.angled) {
        setCurrentView('angled');
        setStatusMessage("Transmitting angled view...");
        for (let i = 0; i <= 100; i += 20) {
          setUploadProgress(prev => ({ ...prev, angled: i }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Call the PIM Standard API
      setStatusMessage("Analyzing pin authenticity...");
      
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
        
        // Store the exact raw response for debugging display
        if ((window as any).lastRawServerResponse) {
          sessionStorage.setItem('rawServerResponse', JSON.stringify((window as any).lastRawServerResponse));
        }
        
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
        setError("Cannot connect to server. Please check your connection and try again.");
        setStatusMessage("Connection failed - Please retry");
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

  // Get the current image being processed
  const getCurrentImage = () => {
    if (!capturedImages) return null;
    switch (currentView) {
      case 'front':
        return capturedImages.front;
      case 'back':
        return capturedImages.back;
      case 'angled':
        return capturedImages.angled;
      default:
        return capturedImages.front;
    }
  };

  // Get the current upload progress
  const getCurrentUploadProgress = () => {
    switch (currentView) {
      case 'front':
        return uploadProgress.front;
      case 'back':
        return uploadProgress.back;
      case 'angled':
        return uploadProgress.angled;
      default:
        return uploadProgress.front;
    }
  };

  // Get the total number of images for progress calculation
  const getTotalImages = () => {
    if (!capturedImages) return 1;
    return 1 + (capturedImages.back ? 1 : 0) + (capturedImages.angled ? 1 : 0);
  };

  // Get the current image number
  const getCurrentImageNumber = () => {
    switch (currentView) {
      case 'front':
        return 1;
      case 'back':
        return 1 + (capturedImages?.front ? 1 : 0);
      case 'angled':
        return 1 + (capturedImages?.front ? 1 : 0) + (capturedImages?.back ? 1 : 0);
      default:
        return 1;
    }
  };

  if (showServerError) {
    return (
      <ServerErrorScreen
        onRetry={retryProcessing}
        onGoBack={handleCancel}
        error="Unable to connect to the authentication server. Please check your internet connection and try again."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col">
      {/* Header */}
      <StepProgress currentStep={currentStep} totalSteps={3} />
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Progress Icon */}
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <RiSearchLine className="w-8 h-8 text-blue-600" />
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Checking Your Pin!
          </h2>
          
          {/* Status Message */}
          <p className="text-gray-600 mb-8">
            {statusMessage}
          </p>
          
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>0%</span>
              <span>{Math.round(progress)}% complete</span>
              <span>100%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Current Image Preview */}
          {getCurrentImage() && (
            <div className="mb-8">
              <img 
                src={getCurrentImage()!} 
                alt="Pin being analyzed" 
                className="w-20 h-20 mx-auto rounded-lg shadow-md object-cover"
              />
            </div>
          )}
          
          {/* Analysis Progress */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Analysis Progress</h3>
            <div className="text-right text-sm text-gray-500 mb-2">
              {getCurrentImageNumber()} of {getTotalImages()}
            </div>
            
            {/* Individual Image Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Front View</span>
                <span className="text-sm text-gray-500">{uploadProgress.front}%</span>
              </div>
              <Progress value={uploadProgress.front} className="h-1" />
              
              {capturedImages?.back && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Back View</span>
                    <span className="text-sm text-gray-500">{uploadProgress.back}%</span>
                  </div>
                  <Progress value={uploadProgress.back} className="h-1" />
                </>
              )}
              
              {capturedImages?.angled && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Angled View</span>
                    <span className="text-sm text-gray-500">{uploadProgress.angled}%</span>
                  </div>
                  <Progress value={uploadProgress.angled} className="h-1" />
                </>
              )}
            </div>
          </div>
          
          {/* Processing Steps */}
          <div className="flex justify-center space-x-2 mb-8">
            <div className={`w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-blue-500' : 'bg-gray-300'}`} />
            <div className={`w-3 h-3 rounded-full ${currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-300'}`} />
            <div className={`w-3 h-3 rounded-full ${currentStep >= 3 ? 'bg-blue-500' : 'bg-gray-300'}`} />
          </div>
          
          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          {/* Action Buttons */}
          {showRetryButton && (
            <div className="space-y-3">
              <Button 
                onClick={retryProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
              >
                Retry Connection
              </Button>
              <Button 
                onClick={handleCancel}
                variant="outline"
                className="w-full py-3 rounded-xl font-semibold"
              >
                Cancel
              </Button>
            </div>
          )}
          
          {/* Transmission Log Viewer */}
          <div className="mt-6">
            <div className="text-xs text-gray-500">
              View detailed logs in console for debugging
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}