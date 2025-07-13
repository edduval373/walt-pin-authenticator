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
      // Reset all progress states
      setStatusMessage("Initializing analysis...");
      setProgress(0);
      setUploadProgress({
        front: 0,
        back: 0,
        angled: 0
      });
      
      try {
        // Set initial step
        setCurrentStep(1);
        
        // Initialize result variables
        let pimStandardResponse: PimAnalysisResponse | null = null;
        let combinedResult: AnalysisResult;
        
        // Define a consistent progress flow
        const totalSteps = 100;
        let currentProgressStep = 0;
        
        // Helper function to update progress smoothly
        const updateProgress = async (message: string, progressIncrease: number) => {
          currentProgressStep += progressIncrease;
          const newProgress = Math.min(currentProgressStep, 95); // Cap at 95% until final completion
          
          setStatusMessage(message);
          setProgress(newProgress);
          return new Promise(resolve => setTimeout(resolve, 300)); // Consistent timing for visual feedback
        };
        
        // Processing steps with proper error handling
        await updateProgress("Preparing images for processing...", 10);
        
        // Process front view
        setCurrentView('front');
        setUploadProgress(prev => ({ ...prev, front: 25 }));
        await updateProgress("Processing front view image...", 15);
        
        setUploadProgress(prev => ({ ...prev, front: 50 }));
        await updateProgress("Analyzing front view details...", 10);
        
        setUploadProgress(prev => ({ ...prev, front: 100 }));
        await updateProgress("Front view analysis complete", 5);
        
        // Process back view if available
        if (capturedImages.back) {
          setCurrentView('back');
          setUploadProgress(prev => ({ ...prev, back: 25 }));
          await updateProgress("Processing back view image...", 10);
          
          setUploadProgress(prev => ({ ...prev, back: 50 }));
          await updateProgress("Analyzing back view details...", 10);
          
          setUploadProgress(prev => ({ ...prev, back: 100 }));
          await updateProgress("Back view analysis complete", 5);
        }
        
        // Process angled view if available
        if (capturedImages.angled) {
          setCurrentView('angled');
          setUploadProgress(prev => ({ ...prev, angled: 25 }));
          await updateProgress("Processing angled view image...", 10);
          
          setUploadProgress(prev => ({ ...prev, angled: 50 }));
          await updateProgress("Analyzing angled view details...", 10);
          
          setUploadProgress(prev => ({ ...prev, angled: 100 }));
          await updateProgress("Angled view analysis complete", 5);
        }
        
        // Final API call
        await updateProgress("Submitting to PIM Standard analyzer...", 15);
        
        try {
          // Call the PIM Standard API
          pimStandardResponse = await analyzePinImagesWithPimStandard(
            capturedImages.front,
            capturedImages.back,
            capturedImages.angled
          );
          
          console.log("PIM Standard analysis complete:", pimStandardResponse);
          
          // Store results
          sessionStorage.setItem('pimAnalysisResult', JSON.stringify(pimStandardResponse));
          
          await updateProgress("Analysis complete! Redirecting to results...", 5);
          setProgress(100);
          
          // Navigate to results
          setTimeout(() => {
            if (!unmounted) {
              setLocation('/results');
            }
          }, 1000);
          
        } catch (apiError) {
          console.error("PIM Standard API error:", apiError);
          
          // Fallback to local analysis
          await updateProgress("Using local analysis fallback...", 5);
          
          const localResult = await analyzePinImage(
            capturedImages.front,
            capturedImages.back,
            capturedImages.angled
          );
          
          sessionStorage.setItem('analysisResult', JSON.stringify(localResult));
          
          await updateProgress("Analysis complete! Redirecting to results...", 5);
          setProgress(100);
          
          setTimeout(() => {
            if (!unmounted) {
              setLocation('/results');
            }
          }, 1000);
        }
        
      } catch (error) {
        console.error("Processing error:", error);
        if (!unmounted) {
          setError("Analysis failed. Please try again.");
          setProgress(0);
        }
      }
    };
    
    processImages();
    
    return () => {
      unmounted = true;
    };
  }, [capturedImages, setLocation]);
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Analysis Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button 
            onClick={() => setLocation('/camera')} 
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Analyzing Your Pin</h1>
            <p className="text-gray-600">Please wait while we authenticate your Disney pin...</p>
          </div>
          
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
          
          <div className="mb-8">
            <p className="text-center text-lg text-gray-700 mb-4">{statusMessage}</p>
            
            <div className="flex justify-center space-x-8">
              {['front', 'back', 'angled'].map((view) => (
                <div key={view} className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                    currentView === view ? 'bg-indigo-100 border-2 border-indigo-500' : 'bg-gray-100'
                  }`}>
                    {uploadProgress[view as keyof typeof uploadProgress] === 100 ? (
                      <RiCheckLine className="w-8 h-8 text-green-500" />
                    ) : (
                      <RiTimeLine className={`w-8 h-8 ${
                        currentView === view ? 'text-indigo-500' : 'text-gray-400'
                      }`} />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 capitalize">{view}</p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress[view as keyof typeof uploadProgress]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>Analysis typically takes 30-60 seconds</p>
            <p className="mt-1">Do not close this window</p>
          </div>
        </div>
      </div>
    </div>
  );
}