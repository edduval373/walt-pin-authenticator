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
      startAnalysis(images);
    } else {
      console.log("No captured images found, redirecting to camera");
      setLocation('/camera');
    }
  }, [setLocation]);

  // Auto-start analysis when component loads
  const startAnalysis = async (images: CapturedImages) => {
    if (isProcessing.current) {
      console.log("Analysis already in progress");
      return;
    }
    
    console.log("[SIMPLE-API] Sending analysis request");
    isProcessing.current = true;
    setError(null);
    setProgress(0);
    setCurrentStep(1);
    setStatusMessage("Initializing analysis...");
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 15, 85));
    }, 500);
    
    try {
      setStatusMessage("Uploading images...");
      setCurrentStep(2);
      
      // Create FormData to match the expected format
      const requestData = {
        frontImage: images.front,
        backImage: images.back || null,
        angledImage: images.angled || null
      };
      
      setStatusMessage("Analyzing pin authenticity...");
      setCurrentStep(3);
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Analysis failed: ${response.status} - ${errorText}`);
      }
      
      const serverResponse = await response.json();
      console.log("[SIMPLE-API] Analysis complete:", serverResponse.success);
      console.log("Pin analysis complete:", serverResponse);
      
      // Clear progress interval
      clearInterval(progressInterval);
      setProgress(100);
      setStatusMessage("Analysis complete!");
      
      if (serverResponse.success) {
        // Store the complete server response and extracted data
        sessionStorage.setItem('serverResponse', JSON.stringify(serverResponse));
        
        const analysisData: AnalysisResult = {
          sessionId: serverResponse.sessionId || `session_${Date.now()}`,
          authentic: serverResponse.authentic || false,
          authenticityRating: serverResponse.authenticityRating || 0,
          analysis: serverResponse.analysis || "No analysis available",
          identification: serverResponse.identification || "No identification provided",
          pricing: serverResponse.pricing || "No pricing information available",
          timestamp: new Date().toISOString(),
          pinId: serverResponse.pinId || serverResponse.sessionId || `pin_${Date.now()}`
        };
        
        sessionStorage.setItem('analysisResult', JSON.stringify(analysisData));
        
        console.log("Parsed server response:", serverResponse);
        
        // Navigate to results after a brief delay
        setTimeout(() => {
          setLocation('/results');
        }, 1000);
      } else {
        throw new Error(serverResponse.message || 'Analysis failed');
      }
      
    } catch (err) {
      console.error('Analysis error:', err);
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setStatusMessage("Analysis failed");
      setShowRetryButton(true);
      isProcessing.current = false;
    }
  };

  const retryProcessing = () => {
    if (capturedImages) {
      setShowRetryButton(false);
      isProcessing.current = false;
      startAnalysis(capturedImages);
    }
  };
  
  const handleCancel = () => {
    setLocation('/camera');
  };
  
  // Determine which view to show
  const getCurrentImage = () => {
    if (!capturedImages) return null;
    switch (currentView) {
      case 'front': return capturedImages.front;
      case 'back': return capturedImages.back;
      case 'angled': return capturedImages.angled;
      default: return capturedImages.front;
    }
  };
  
  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Preparing your images for analysis";
      case 2:
        return "Uploading to secure authentication servers";
      case 3:
        return "AI analyzing pin authenticity and characteristics";
      default:
        return "Processing your Disney pin";
    }
  };
  
  if (showServerError) {
    return <ServerErrorScreen onRetry={retryProcessing} onCancel={handleCancel} />;
  }
  
  if (isApiUnavailable) {
    return <ApiUnavailableMessage onRetry={retryProcessing} onCancel={handleCancel} />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Step Progress Indicator */}
        <div className="mb-6">
          <StepProgress currentStep={3} totalSteps={3} />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {currentStep === 1 && <RiTimeLine className="text-2xl text-indigo-600" />}
              {currentStep === 2 && <RiSearchLine className="text-2xl text-indigo-600" />}
              {currentStep === 3 && <RiCpuLine className="text-2xl text-indigo-600" />}
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Analyzing Your Pin
            </h1>
            <p className="text-gray-600 text-sm">
              {getStepDescription()}
            </p>
          </div>
          
        {/* Image preview with view switching */}
        <div className="mb-6">
          {capturedImages && (
            <div className="space-y-3">
              {/* View selector tabs */}
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => setCurrentView('front')}
                  className={`px-3 py-1 text-xs rounded-full transition ${
                    currentView === 'front' 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  Front
                </button>
                {capturedImages.back && (
                  <button
                    onClick={() => setCurrentView('back')}
                    className={`px-3 py-1 text-xs rounded-full transition ${
                      currentView === 'back' 
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    Back
                  </button>
                )}
                {capturedImages.angled && (
                  <button
                    onClick={() => setCurrentView('angled')}
                    className={`px-3 py-1 text-xs rounded-full transition ${
                      currentView === 'angled' 
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    Angled
                  </button>
                )}
              </div>
              
              {/* Current image display */}
              {getCurrentImage() && (
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={getCurrentImage()!} 
                    alt={`Pin ${currentView} view`}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </div>
          
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-medium text-indigo-600">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500 mt-2">{statusMessage}</p>
          </div>
          
          {/* Processing steps indicator */}
          <div className="mb-6">
            <div className="space-y-2">
              <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
                <RiCheckboxCircleLine className={`text-lg ${currentStep >= 1 ? 'text-indigo-600' : 'text-gray-300'}`} />
                <span className="text-sm">Image preparation</span>
              </div>
              <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
                <RiCheckboxCircleLine className={`text-lg ${currentStep >= 2 ? 'text-indigo-600' : 'text-gray-300'}`} />
                <span className="text-sm">Secure upload</span>
              </div>
              <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
                <RiCheckboxCircleLine className={`text-lg ${currentStep >= 3 ? 'text-indigo-600' : 'text-gray-300'}`} />
                <span className="text-sm">AI analysis</span>
              </div>
            </div>
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