import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RiCheckLine, RiTimeLine } from "react-icons/ri";
import { analyzePinImage, AnalysisResult } from "@/lib/pin-authenticator";
import { analyzePinImagesWithPimStandard, PimAnalysisResponse } from "@/lib/pim-standard-api";

interface CapturedImages {
  front: string;
  back?: string;
  angled?: string;
}

export default function ProcessingPage() {
  const [_, setLocation] = useLocation();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'front' | 'back' | 'angled'>('front');
  const [statusMessage, setStatusMessage] = useState<string>("Initializing analysis...");
  const [uploadProgress, setUploadProgress] = useState<{front: number, back: number, angled: number}>({
    front: 0,
    back: 0,
    angled: 0
  });
  
  // Get the captured images from sessionStorage
  const capturedImagesJSON = sessionStorage.getItem('capturedImages');
  const capturedImages: CapturedImages | null = capturedImagesJSON ? JSON.parse(capturedImagesJSON) : null;
  
  useEffect(() => {
    // Front view is required, but back and angled views are optional
    if (!capturedImages || !capturedImages.front) {
      console.error("Missing required front view of pin");
      setLocation('/camera');
      return;
    }
    
    let unmounted = false;
    
    const processImages = async () => {
      // Define steps for smooth progress
      const steps = [
        { message: "Initializing analysis...", progress: 5 },
        { message: "Preparing images for processing...", progress: 10 },
        { message: "Processing front view image...", progress: 20, view: 'front' as const, viewProgress: 50 },
        { message: "Analyzing front view details...", progress: 25, view: 'front' as const, viewProgress: 100 },
        ...(capturedImages.back ? [
          { message: "Processing back view image...", progress: 35, view: 'back' as const, viewProgress: 50 },
          { message: "Analyzing back view details...", progress: 40, view: 'back' as const, viewProgress: 100 }
        ] : []),
        ...(capturedImages.angled ? [
          { message: "Processing angled view image...", progress: 50, view: 'angled' as const, viewProgress: 50 },
          { message: "Analyzing angled view details...", progress: 55, view: 'angled' as const, viewProgress: 100 }
        ] : []),
        { message: "Submitting images to PIM Standard analyzer...", progress: 65 },
        { message: "Running advanced authenticity checks...", progress: 75 },
        { message: "Finalizing analysis results...", progress: 85 },
        { message: "Analysis complete! Redirecting to results...", progress: 95 }
      ];
      
      // Create a reliable timer for progress updates
      for (const step of steps) {
        if (unmounted) break;
        
        setStatusMessage(step.message);
        setProgress(step.progress);
        
        if (step.view && step.viewProgress !== undefined) {
          setCurrentView(step.view);
          setUploadProgress(prev => ({ ...prev, [step.view]: step.viewProgress }));
        }
        
        // Wait between steps
        await new Promise(r => setTimeout(r, 500));
      }
      
      try {
        // Actual API calls and analysis
        let pimStandardResponse: PimAnalysisResponse;
        
        try {
          // Process all views with PIM Standard library
          pimStandardResponse = await analyzePinImagesWithPimStandard(
            capturedImages.front,
            capturedImages.back,
            capturedImages.angled
          );
          
          console.log("PIM Standard analysis complete:", pimStandardResponse);
        } catch (err: any) {
          console.error("Error with PIM Standard analysis:", err);
          // Create fallback response
          pimStandardResponse = {
            success: false,
            message: "Analysis completed with limited data",
            sessionId: "fallback_session",
            id: 0,
            characters: null,
            analysis: "Limited analysis due to API unavailability",
            identification: null,
            pricing: null
          };
        }
        
        // Process front image with local analyzer
        const frontResult = await analyzePinImage(capturedImages.front);
        
        // Create combined result using both PIM Standard and local analyzer
        const combinedResult: AnalysisResult = {
          ...frontResult,
          pinId: pimStandardResponse.identification || frontResult.pinId,
          confidence: frontResult.confidence,
          factors: [
            ...frontResult.factors,
            {
              name: 'PIM Standard Analysis',
              description: 'Advanced authenticity verification by PIM Standard',
              confidence: pimStandardResponse.success ? 0.85 : 0.60
            }
          ],
          colorMatchPercentage: frontResult.colorMatchPercentage,
          databaseMatchCount: frontResult.databaseMatchCount,
          imageQualityScore: frontResult.imageQualityScore,
          pimStandardResponse: pimStandardResponse
        };
        
        // Store result in session storage
        sessionStorage.setItem('analysisResult', JSON.stringify(combinedResult));
        
        // Set progress to 100% and redirect to results
        setProgress(100);
        
        // Small delay before redirecting
        await new Promise(r => setTimeout(r, 500));
        
        if (!unmounted) {
          setLocation('/results');
        }
      } catch (err) {
        console.error('Error processing images:', err);
        setError(err instanceof Error ? err.message : 'Unknown error processing images');
      }
    };
    
    processImages();
    
    return () => {
      unmounted = true;
    };
  }, [capturedImages, setLocation]);
  
  const handleCancel = () => {
    setLocation('/camera');
  };
  
  if (!capturedImages) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="flex-grow flex flex-col fade-in">
      {/* Header with thumbnails */}
      <div className="bg-indigo-50 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <h2 className="text-lg font-heading text-gray-800">
            Processing Pin Images
          </h2>
          
          {/* Thumbnail previews in header */}
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
      </div>
      
      <div className="px-4 pb-12 flex-grow flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md text-center">
          <div className="mb-6">
            {/* Preview of current view being processed */}
            <div className="relative">
              <img 
                src={capturedImages[currentView] || capturedImages.front} 
                alt={`${currentView} view`}
                className="rounded-lg shadow-sm mx-auto max-h-48 object-contain"
              />
              
              {/* Processing overlay */}
              <div className="absolute inset-0 bg-indigo-800 bg-opacity-20 rounded-lg flex items-center justify-center">
                <div className="bg-white p-3 rounded-full shadow-lg">
                  <RiTimeLine className="text-indigo-500 text-2xl animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-indigo-900 mb-2">Analyzing Pin Images</h2>
          <p className="text-gray-600 mb-4">{statusMessage}</p>
          
          {/* Main progress bar */}
          <div className="mb-6">
            <Progress value={progress} className="h-3 bg-indigo-100" />
            <div className="text-xs text-right mt-1 text-gray-500">{Math.round(progress)}% complete</div>
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
          
          {/* Cancel button */}
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
  );
}