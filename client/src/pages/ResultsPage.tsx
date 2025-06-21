import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiArrowLeftLine, RiCamera2Line, RiHistoryLine, RiStarLine, RiCheckboxCircleLine, RiCloseCircleLine, RiRefreshLine, RiShieldCheckLine, RiShieldLine, RiThumbUpFill, RiThumbDownFill } from "react-icons/ri";
import ApiRequestLogger from "@/components/ApiRequestLogger";
import StepProgress from "@/components/StepProgress";
import FeedbackModal from "@/components/FeedbackModal";

import { AnalysisResult } from "@/lib/pin-authenticator";
import VerificationReport from "@/components/VerificationReport";
import { removeWhiteBackgroundAdvanced, cropImageToContent } from "@/lib/background-remover";

interface CapturedImages {
  front: string;
  back?: string;
  angled?: string;
}

export default function ResultsPage() {
  const [_, setLocation] = useLocation();
  const [currentView, setCurrentView] = useState<'front' | 'back' | 'angled'>('front');
  const [showApiLogs, setShowApiLogs] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [userFeedback, setUserFeedback] = useState<'positive' | 'negative' | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'agree' | 'disagree'>('agree');
  
  // Get analysis result from sessionStorage
  const analysisResultJson = sessionStorage.getItem('analysisResult');
  const capturedImagesJson = sessionStorage.getItem('capturedImages');
  const serverResponseJson = sessionStorage.getItem('serverResponse');
  
  // Parse the analysis result, or redirect to camera if missing
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [capturedImages, setCapturedImages] = useState<CapturedImages | null>(null);
  const [serverResponse, setServerResponse] = useState<any>(null);

  // Function to process markdown headers in HTML content
  const processMarkdownHeaders = (htmlContent: string): string => {
    if (!htmlContent) return htmlContent;
    
    let processed = htmlContent;
    
    // First, handle the specific case where ## appears after table cells
    // Look for patterns like "N/A ## Detail" or "❌ 70 ## Detail"
    processed = processed.replace(/(<\/td>\s*<\/tr>\s*<\/tbody>\s*<\/table>)\s*##\s+(.+?)(?=\n|$)/g, 
      '$1<h2 class="text-lg font-semibold mt-6 mb-3 text-gray-800">$2</h2>');
    
    // Handle ## headers that appear immediately after table content without proper closing
    processed = processed.replace(/(N\/A|❌\s*\d+)\s+##\s+(.+?)(?=\n|<|$)/g, 
      '$1</td></tr></tbody></table><h2 class="text-lg font-semibold mt-6 mb-3 text-gray-800">$2</h2>');
    
    // Handle ## headers within table cells
    processed = processed.replace(/(<td[^>]*>[^<]*?)##\s+(.+?)(<\/td>)/g, 
      '$1</td></tr></tbody></table><h2 class="text-lg font-semibold mt-6 mb-3 text-gray-800">$2</h2><table class="min-w-full border-collapse border border-gray-300"><tbody><tr><td class="border border-gray-300 px-2 py-1">$3');
    
    // Convert standalone ## headers
    processed = processed.replace(/^##\s+(.+)$/gm, '<h2 class="text-lg font-semibold mt-6 mb-3 text-gray-800">$1</h2>');
    
    // Convert ## headers within paragraph tags
    processed = processed.replace(/<p><p>##\s+(.+?)<\/p><\/p>/g, '<h2 class="text-lg font-semibold mt-6 mb-3 text-gray-800">$1</h2>');
    processed = processed.replace(/<p>##\s+(.+?)<\/p>/g, '<h2 class="text-lg font-semibold mt-6 mb-3 text-gray-800">$1</h2>');
    
    // Handle any remaining ## headers in various contexts
    processed = processed.replace(/##\s+(.+?)(?=\n|<|$)/g, '<h2 class="text-lg font-semibold mt-6 mb-3 text-gray-800">$1</h2>');
    
    // Convert ### headers
    processed = processed.replace(/^###\s+(.+)$/gm, '<h3 class="text-base font-medium mt-4 mb-2 text-gray-700">$1</h3>');
    processed = processed.replace(/<p>###\s+(.+?)<\/p>/g, '<h3 class="text-base font-medium mt-4 mb-2 text-gray-700">$1</h3>');
    processed = processed.replace(/###\s+(.+?)(?=\n|<|$)/g, '<h3 class="text-base font-medium mt-4 mb-2 text-gray-700">$1</h3>');
    
    return processed;
  };

  useEffect(() => {
    console.log("Loading results data from sessionStorage");
    
    if (analysisResultJson) {
      try {
        const parsedResult = JSON.parse(analysisResultJson);
        setResult(parsedResult);
        console.log("Loaded analysis result:", parsedResult);
      } catch (error) {
        console.error("Failed to parse analysis result:", error);
      }
    }
    
    if (capturedImagesJson) {
      try {
        const parsedImages = JSON.parse(capturedImagesJson);
        setCapturedImages(parsedImages);
        console.log("Loaded captured images");
      } catch (error) {
        console.error("Failed to parse captured images:", error);
      }
    }
    
    if (serverResponseJson) {
      try {
        const parsedResponse = JSON.parse(serverResponseJson);
        setServerResponse(parsedResponse);
        console.log("Loaded server response:", parsedResponse);
      } catch (error) {
        console.error("Failed to parse server response:", error);
      }
    }
    
    // If no analysis result found, redirect to camera
    if (!analysisResultJson && !serverResponseJson) {
      console.log("No analysis result found, redirecting to camera");
      setLocation('/camera');
    }
  }, [analysisResultJson, capturedImagesJson, serverResponseJson, setLocation]);

  // Auto-crop the current image when cropping is requested
  const handleAutoCrop = async () => {
    const currentImage = getCurrentImage();
    if (!currentImage) return;
    
    console.log("Auto-cropping image...");
    setIsProcessingImage(true);
    
    try {
      const croppedImage = await cropImageToContent(currentImage);
      setProcessedImage(croppedImage);
      console.log("Auto cropping successful");
    } catch (error) {
      console.error("Auto cropping failed:", error);
    } finally {
      setIsProcessingImage(false);
    }
  };
  
  // Get the current image based on selected view
  const getCurrentImage = () => {
    if (!capturedImages) return null;
    switch (currentView) {
      case 'front': return capturedImages.front;
      case 'back': return capturedImages.back;
      case 'angled': return capturedImages.angled;
      default: return capturedImages.front;
    }
  };
  
  // Handle feedback submission
  const handleFeedback = (type: 'agree' | 'disagree') => {
    setFeedbackType(type);
    setShowFeedbackModal(true);
  };
  
  // Get authenticity rating information
  const rating = (() => {
    const ratingValue = serverResponse?.authenticityRating || result?.authenticityRating || 0;
    
    if (ratingValue >= 85) {
      return {
        value: ratingValue,
        label: "Highly Authentic",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        icon: RiShieldCheckLine
      };
    } else if (ratingValue >= 70) {
      return {
        value: ratingValue,
        label: "Likely Authentic",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        icon: RiShieldLine
      };
    } else if (ratingValue >= 50) {
      return {
        value: ratingValue,
        label: "Questionable",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        icon: RiShieldLine
      };
    } else {
      return {
        value: ratingValue,
        label: "Likely Counterfeit",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: RiCloseCircleLine
      };
    }
  })();
  
  if (!result && !serverResponse) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-indigo-600 mb-4">
            <RiRefreshLine className="text-4xl mx-auto animate-spin" />
          </div>
          <p className="text-gray-600 mb-4">Loading analysis results...</p>
          <Button onClick={() => setLocation('/camera')} variant="outline">
            Return to Camera
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-indigo-100 pb-20">
      <div className="max-w-4xl mx-auto p-4">
        {/* Step Progress Indicator */}
        <div className="mb-6">
          <StepProgress currentStep={3} totalSteps={3} />
        </div>
        
        <Tabs defaultValue="results" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
            <TabsTrigger value="results" className="text-xs sm:text-sm">Results</TabsTrigger>
            <TabsTrigger value="images" className="text-xs sm:text-sm">Images</TabsTrigger>
            <TabsTrigger value="technical" className="text-xs sm:text-sm">Technical</TabsTrigger>
          </TabsList>
          
          <TabsContent value="results" className="space-y-6">
            {/* Authenticity Score Card */}
            <div className={`${rating.bgColor} ${rating.borderColor} border-2 rounded-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <rating.icon className={`text-3xl ${rating.color}`} />
                  <div>
                    <h2 className={`text-xl font-bold ${rating.color}`}>{rating.label}</h2>
                    <p className="text-sm text-gray-600">Authenticity Assessment</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${rating.color}`}>{rating.value}%</div>
                  <p className="text-xs text-gray-500">Confidence</p>
                </div>
              </div>
              
              {/* Feedback buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => handleFeedback('agree')}
                  variant="outline"
                  size="sm"
                  className="flex-1 hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                >
                  <RiThumbUpFill className="mr-2" />
                  Agree
                </Button>
                <Button
                  onClick={() => handleFeedback('disagree')}
                  variant="outline"
                  size="sm"
                  className="flex-1 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                >
                  <RiThumbDownFill className="mr-2" />
                  Disagree
                </Button>
              </div>
            </div>
            
            {/* Character Identification */}
            {(serverResponse?.identification || result?.identification) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                  <RiStarLine className="mr-2 text-indigo-600" />
                  Character Identification
                </h3>
                <div 
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ 
                    __html: processMarkdownHeaders(serverResponse?.identification || result?.identification || '') 
                  }}
                />
              </div>
            )}
            
            {/* Detailed Analysis */}
            {(serverResponse?.analysis || result?.analysis) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                  <RiSearchLine className="mr-2 text-indigo-600" />
                  Detailed Analysis
                </h3>
                <div 
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ 
                    __html: processMarkdownHeaders(serverResponse?.analysis || result?.analysis || '') 
                  }}
                />
              </div>
            )}
            
            {/* Pricing Information */}
            {(serverResponse?.pricing || result?.pricing) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                  <RiHistoryLine className="mr-2 text-indigo-600" />
                  Pricing & Market Information
                </h3>
                <div 
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ 
                    __html: processMarkdownHeaders(serverResponse?.pricing || result?.pricing || '') 
                  }}
                />
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => setLocation('/camera')}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <RiCamera2Line className="mr-2" />
                Analyze Another Pin
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="images" className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Captured Images</h3>
                <Button
                  onClick={handleAutoCrop}
                  disabled={isProcessingImage}
                  variant="outline"
                  size="sm"
                >
                  {isProcessingImage ? "Processing..." : "Auto Crop"}
                </Button>
              </div>
              
              {capturedImages && (
                <div className="space-y-4">
                  {/* View selector */}
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => setCurrentView('front')}
                      className={`px-4 py-2 text-sm rounded-lg transition ${
                        currentView === 'front' 
                          ? 'bg-indigo-500 text-white' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      Front View
                    </button>
                    {capturedImages.back && (
                      <button
                        onClick={() => setCurrentView('back')}
                        className={`px-4 py-2 text-sm rounded-lg transition ${
                          currentView === 'back' 
                            ? 'bg-indigo-500 text-white' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        Back View
                      </button>
                    )}
                    {capturedImages.angled && (
                      <button
                        onClick={() => setCurrentView('angled')}
                        className={`px-4 py-2 text-sm rounded-lg transition ${
                          currentView === 'angled' 
                            ? 'bg-indigo-500 text-white' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        Angled View
                      </button>
                    )}
                  </div>
                  
                  {/* Image display */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Original image */}
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-gray-700">Original Image</h4>
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        {getCurrentImage() && (
                          <img 
                            src={getCurrentImage()!} 
                            alt={`Pin ${currentView} view`}
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                    </div>
                    
                    {/* Processed image */}
                    {processedImage && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-gray-700">Auto-Cropped</h4>
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <img 
                            src={processedImage} 
                            alt="Processed pin image"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="technical" className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Analysis Details</h3>
              
              {serverResponse ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-md p-4 border border-blue-200">
                    <h4 className="font-medium text-sm mb-2 text-blue-800">Session Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-700">Session ID:</span>
                        <p className="text-blue-900 font-mono">{serverResponse.sessionId || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Timestamp:</span>
                        <p className="text-blue-900">{serverResponse.timestamp ? new Date(serverResponse.timestamp).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-md p-4 border border-green-200">
                    <h4 className="font-medium text-sm mb-2 text-green-800">Analysis Results</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-green-700">Authentic:</span>
                        <p className="text-green-900">{serverResponse.authentic ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-green-700">Rating:</span>
                        <p className="text-green-900">{serverResponse.authenticityRating || 0}%</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-md p-4">
                    <h4 className="font-medium text-sm mb-2">Success Status</h4>
                    <p className="text-gray-700">{serverResponse.success ? 'Analysis completed successfully' : 'Analysis failed'}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-md p-4">
                    <h4 className="font-medium text-sm mb-2">Message</h4>
                    <p className="text-gray-700">{serverResponse.message || 'No message provided'}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-md p-4">
                    <h4 className="font-medium text-sm mb-2">ID</h4>
                    <p className="text-gray-700 font-mono">{serverResponse.id || 'No ID provided'}</p>
                  </div>
                  
                  {serverResponse.characters && (
                    <div className="bg-yellow-50 rounded-md p-4 border border-yellow-200">
                      <h4 className="font-medium text-sm mb-2 text-yellow-800">Characters Field (Debug)</h4>
                      <div className="text-xs bg-yellow-100 p-3 rounded overflow-auto max-h-48">
                        <div className="text-yellow-900" dangerouslySetInnerHTML={{ __html: serverResponse.characters }} />
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 rounded-md p-4">
                    <h4 className="font-medium text-sm mb-2">Complete Response</h4>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-96 whitespace-pre-wrap">
                      {JSON.stringify(serverResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 text-blue-700 rounded-md">
                  <p className="font-medium">No server response data available</p>
                  <p className="text-sm mt-1">The raw server response was not captured for this analysis.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Feedback Modal for collecting user comments */}
      {showFeedbackModal && result && serverResponse && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          analysisId={Date.now()} // Generate unique analysis ID
          pinId={serverResponse.sessionId || `pin_${Date.now()}`}
          analysisRating={rating.value}
          analysisText={serverResponse.analysis || 'No analysis text available'}
          initialFeedback={userFeedback ?? undefined}
        />
      )}
    </div>
  );
}