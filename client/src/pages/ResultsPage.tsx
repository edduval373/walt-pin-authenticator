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
    processed = processed.replace(/^###\s+(.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2 text-gray-700">$1</h3>');
    processed = processed.replace(/<p><p>###\s+(.+?)<\/p><\/p>/g, '<h3 class="text-base font-semibold mt-4 mb-2 text-gray-700">$1</h3>');
    processed = processed.replace(/<p>###\s+(.+?)<\/p>/g, '<h3 class="text-base font-semibold mt-4 mb-2 text-gray-700">$1</h3>');
    processed = processed.replace(/###\s+(.+?)(?=\n|<|$)/g, '<h3 class="text-base font-semibold mt-4 mb-2 text-gray-700">$1</h3>');
    
    // Convert #### headers
    processed = processed.replace(/^####\s+(.+)$/gm, '<h4 class="text-sm font-semibold mt-3 mb-2 text-gray-600">$1</h4>');
    processed = processed.replace(/<p><p>####\s+(.+?)<\/p><\/p>/g, '<h4 class="text-sm font-semibold mt-3 mb-2 text-gray-600">$1</h4>');
    processed = processed.replace(/<p>####\s+(.+?)<\/p>/g, '<h4 class="text-sm font-semibold mt-3 mb-2 text-gray-600">$1</h4>');
    processed = processed.replace(/####\s+(.+?)(?=\n|<|$)/g, '<h4 class="text-sm font-semibold mt-3 mb-2 text-gray-600">$1</h4>');
    
    return processed;
  };



  // Function to handle user feedback
  const handleFeedback = (feedback: 'positive' | 'negative') => {
    setUserFeedback(feedback);
    
    // Set feedback type for modal
    setFeedbackType(feedback === 'positive' ? 'agree' : 'disagree');
    
    // Open feedback modal for comment collection
    setShowFeedbackModal(true);
    
    // Log the feedback for analytics
    console.log(`User feedback: ${feedback} for analysis rating ${rating.text}`);
  };
  
  // Function to remove white background from pin image
  const handleRemoveBackground = async () => {
    if (!capturedImages?.front) {
      console.log('No front image available');
      return;
    }
    
    // If already processed, reset to original
    if (processedImage) {
      setProcessedImage(null);
      return;
    }
    
    console.log('Starting background removal process...');
    setIsProcessingImage(true);
    try {
      const processedImageData = await removeWhiteBackgroundAdvanced(capturedImages.front, 40);
      console.log('Background removal successful');
      setProcessedImage(processedImageData);
    } catch (error) {
      console.error('Error removing background:', error);
      alert('Failed to remove background. Please try again.');
    } finally {
      setIsProcessingImage(false);
    }
  };
  
  useEffect(() => {
    if (!analysisResultJson || !capturedImagesJson) {
      setLocation('/camera');
      return;
    }
    
    try {
      const parsedResult = JSON.parse(analysisResultJson) as AnalysisResult;
      const parsedImages = JSON.parse(capturedImagesJson) as CapturedImages;
      setResult(parsedResult);
      setCapturedImages(parsedImages);
      
      // Parse server response if available
      if (serverResponseJson) {
        try {
          const parsedServerResponse = JSON.parse(serverResponseJson);
          setServerResponse(parsedServerResponse);
          console.log("Parsed server response:", parsedServerResponse);
        } catch (responseErr) {
          console.error('Failed to parse server response:', responseErr);
        }
      }
      
      // Automatically crop image when loaded
      if (parsedImages.front && !processedImage) {
        console.log('Auto-cropping image...');
        setIsProcessingImage(true);
        
        // Crop the image to focus on the pin
        cropImageToContent(parsedImages.front, 20)
          .then(croppedImageData => {
            console.log('Auto cropping successful');
            setProcessedImage(croppedImageData);
          })
          .catch(error => {
            console.error('Auto cropping failed:', error);
          })
          .finally(() => {
            setIsProcessingImage(false);
          });
      }
    } catch (err) {
      console.error('Failed to parse analysis result or images:', err);
      setLocation('/camera');
    }
  }, [analysisResultJson, capturedImagesJson, serverResponseJson, setLocation]);
  
  // If result or images are not available yet, show loading
  if (!result || !capturedImages) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Function to get search query for eBay
  const getSearchQuery = (): string => {
    // Use the pin ID if available, otherwise use "disney pin" as a generic term
    if (result.pinId && result.pinId.trim() !== '') {
      return result.pinId;
    }
    return "disney pin";
  };
  
  // Extract rating from analysis field
  const getRating = (): { value: number, text: string, description: string } => {
    // Check if no pin was found in the analysis
    if (serverResponse?.analysis) {
      const analysisText = serverResponse.analysis;
      
      // Check for "no pin" indicators
      if (analysisText.toLowerCase().includes("no disney pin") || 
          analysisText.toLowerCase().includes("don't see any disney pin") ||
          analysisText.toLowerCase().includes("no pin visible") ||
          analysisText.toLowerCase().includes("unable to provide an authenticity verification")) {
        return {
          value: 0,
          text: '0/5',
          description: 'No Pin Found in the image'
        };
      }
      
      // Look for "Final Rating:" pattern in the analysis
      const ratingMatch = analysisText.match(/Final Rating:\s*(\d+)\/5\s*-\s*([^<]+)/i);
      if (ratingMatch) {
        const ratingValue = parseInt(ratingMatch[1]);
        const ratingDescription = ratingMatch[2].trim();
        return {
          value: ratingValue,
          text: `${ratingValue}/5`,
          description: ratingDescription
        };
      }
      
      // Alternative pattern: look for rating in different format
      const altRatingMatch = analysisText.match(/(\d+)\/5[^>]*>([^<]+)/);
      if (altRatingMatch) {
        const ratingValue = parseInt(altRatingMatch[1]);
        const ratingDescription = altRatingMatch[2].trim();
        return {
          value: ratingValue,
          text: `${ratingValue}/5`,
          description: ratingDescription
        };
      }
    }
    
    // Check identification field for "no pin" indicators
    if (serverResponse?.identification) {
      const identificationText = serverResponse.identification;
      if (identificationText.toLowerCase().includes("no disney pin") || 
          identificationText.toLowerCase().includes("don't see any disney pin") ||
          identificationText.toLowerCase().includes("no pin visible")) {
        return {
          value: 0,
          text: '0/5',
          description: 'No Pin Found in the image'
        };
      }
    }
    
    // Fallback to authenticityRating from serverResponse only if no "no pin" indicators
    if (serverResponse?.authenticityRating !== undefined) {
      const rating = Math.round(serverResponse.authenticityRating / 20); // Convert 0-100 to 0-5 scale
      return {
        value: rating,
        text: `${rating}/5`,
        description: serverResponse.authentic ? 'Likely Authentic' : 'Authenticity Uncertain'
      };
    }
    
    // Default if no rating available
    return {
      value: 0,
      text: '0/5',
      description: 'No Pin Found in the image'
    };
  };
  
  const rating = getRating();
  
  return (
    <div className="app-container max-w-md mx-auto flex flex-col min-h-screen pb-6">
      {/* API Log Modal */}
      {showApiLogs && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Master Server API Logs</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowApiLogs(false)}>
                Close
              </Button>
            </div>
            <div className="flex-grow overflow-auto p-4">
              <ApiRequestLogger />
            </div>
          </div>
        </div>
      )}
      
      {/* Action Buttons Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 py-3 px-4 shadow-sm">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => {
            // Clear session data and go back to camera
            sessionStorage.removeItem('analysisResult');
            sessionStorage.removeItem('capturedImages');
            sessionStorage.removeItem('serverResponse');
            setLocation('/camera');
          }} className="flex-1 max-w-[100px]">
            <RiArrowLeftLine className="mr-1" />
            <span className="text-sm">Back</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation('/processing')}
            className="flex-1 max-w-[100px] text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <RiHistoryLine className="mr-1" />
            <span className="text-sm">Resubmit</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setLocation('/camera')} className="flex-1 max-w-[100px]">
            <RiCamera2Line className="mr-1" />
            <span className="text-sm">New Scan</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow p-4">
      
        {/* Pin Image and Rating Layout */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-lg rounded-xl overflow-hidden mb-4 border border-indigo-200">
          <div className="p-6">
            {/* Top Section: Pin Image Left, Rating Circle Right */}
            <div className="flex gap-4 items-center mb-4">
              {/* Pin Image - Left Side */}
              <div className="flex-1">
                {capturedImages && capturedImages.front && (
                  <div className="bg-white rounded-lg p-2 shadow-sm">
                    <img
                      src={processedImage || capturedImages.front}
                      alt="Pin front view"
                      className="w-full h-32 object-contain"
                    />
                  </div>
                )}
              </div>
              
              {/* Rating Circle - Right Side */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-28 h-28 mb-2">
                  <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke={rating.value >= 4 ? "#10b981" : rating.value >= 3 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${(rating.value / 5) * 251.2} 251.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800">{rating.text}</div>
                    </div>
                  </div>
                </div>
                
                {/* Rating Status Icon */}
                <div className="flex items-center gap-1 mt-1">
                  {rating.value >= 4 ? (
                    <RiShieldCheckLine className="text-green-600 text-lg" />
                  ) : rating.value >= 3 ? (
                    <RiShieldLine className="text-yellow-600 text-lg" />
                  ) : (
                    <RiShieldLine className="text-red-600 text-lg" />
                  )}
                </div>
              </div>
            </div>
            
            {/* Rating Status Text */}
            <div className="text-center mb-4">
              <span className={`text-lg font-bold ${
                rating.value >= 4 ? 'text-green-600' : 
                rating.value >= 3 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {rating.text}
              </span>
              <div className="text-sm text-gray-700 mt-1 font-bold">{rating.description}</div>
            </div>

            {/* User Feedback Section */}
            <div className="border-t border-indigo-200 pt-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 text-center">Do you agree with this analysis?</h3>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleFeedback('positive')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    userFeedback === 'positive'
                      ? 'bg-green-500 text-white shadow-lg scale-105'
                      : 'bg-green-100 text-green-700 hover:bg-green-200 hover:scale-105'
                  }`}
                >
                  <RiThumbUpFill className="text-xl" />
                  <span className="text-sm">Yes</span>
                </button>
                <button
                  onClick={() => handleFeedback('negative')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    userFeedback === 'negative'
                      ? 'bg-red-500 text-white shadow-lg scale-105'
                      : 'bg-red-100 text-red-700 hover:bg-red-200 hover:scale-105'
                  }`}
                >
                  <RiThumbDownFill className="text-xl" />
                  <span className="text-sm">No</span>
                </button>
              </div>
              {userFeedback && (
                <div className="text-center mt-2">
                  <p className="text-xs text-gray-600">
                    {userFeedback === 'positive' 
                      ? 'Thank you for your feedback!' 
                      : 'Thank you! We\'ll use this to improve our analysis.'}
                  </p>
                </div>
              )}
            </div>


          </div>
        </div>
      

        
        {/* Results Tabs */}
        <Tabs defaultValue="analysis" className="bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-lg rounded-xl overflow-hidden border border-indigo-200">
          <TabsList className="flex w-full bg-indigo-100 border-b border-indigo-200">
            <TabsTrigger value="analysis" className="flex-1 text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-indigo-700 data-[state=inactive]:hover:bg-indigo-200">Analysis</TabsTrigger>
            <TabsTrigger value="identification" className="flex-1 text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-indigo-700 data-[state=inactive]:hover:bg-indigo-200">Identification</TabsTrigger>
            <TabsTrigger value="pricing" className="flex-1 text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-indigo-700 data-[state=inactive]:hover:bg-indigo-200">Pricing</TabsTrigger>
            <TabsTrigger value="server-response" className="flex-1 text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=inactive]:text-indigo-700 data-[state=inactive]:hover:bg-indigo-200">Response</TabsTrigger>
          </TabsList>
          
          {/* Identification Tab - First */}
          <TabsContent value="identification" className="p-4 bg-indigo-50">
            <div className="analysis-result">
              <h3 className="text-sm font-semibold text-indigo-800 mb-2">Pin Identification</h3>
              {serverResponse?.identification ? (
                <div className="bg-gray-50 p-3 rounded-md prose prose-sm max-w-none">
                  <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: processMarkdownHeaders(serverResponse.identification) }} />
                </div>
              ) : (
                <div className="p-4 bg-blue-50 text-blue-700 rounded-md">
                  <p className="font-medium">No pin identification data available</p>
                  <p className="text-sm mt-1">The server did not return pin identification information.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Analysis Tab - Second */}
          <TabsContent value="analysis" className="p-4 bg-indigo-50">
            <div className="analysis-result">
              <h3 className="text-sm font-semibold text-indigo-800 mb-2">Authenticity Analysis</h3>
              {serverResponse?.analysis ? (
                <div className="bg-gray-50 p-3 rounded-md prose prose-sm max-w-none">
                  <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: processMarkdownHeaders(serverResponse.analysis) }} />
                </div>
              ) : (
                <div className="p-4 bg-blue-50 text-blue-700 rounded-md">
                  <p className="font-medium">No analysis data available</p>
                  <p className="text-sm mt-1">The server did not return analysis information.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Pricing Tab - Third */}
          <TabsContent value="pricing" className="p-4 bg-indigo-50">
            <div className="analysis-result">
              <h3 className="text-sm font-semibold text-indigo-800 mb-2">Pricing & Market Value</h3>
              {serverResponse?.pricing ? (
                <div className="bg-gray-50 p-3 rounded-md prose prose-sm max-w-none">
                  <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: processMarkdownHeaders(serverResponse.pricing) }} />
                </div>
              ) : (
                <div className="p-4 bg-blue-50 text-blue-700 rounded-md">
                  <p className="font-medium">No pricing data available</p>
                  <p className="text-sm mt-1">The server did not return pricing information.</p>
                </div>
              )}
            </div>
          </TabsContent>
          

          
          {/* Server Response Tab */}
          <TabsContent value="server-response" className="p-4 bg-indigo-50">
            <div className="server-response-content">
              <h3 className="text-sm font-semibold text-indigo-800 mb-2">Raw Server Response</h3>
              
              {serverResponse ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-md p-4">
                    <h4 className="font-medium text-sm mb-2">Status</h4>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${serverResponse.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={serverResponse.success ? 'text-green-700' : 'text-red-700'}>
                        {serverResponse.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-md p-4">
                    <h4 className="font-medium text-sm mb-2">Message</h4>
                    <p className="text-gray-700">{serverResponse.message || 'No message provided'}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-md p-4">
                    <h4 className="font-medium text-sm mb-2">Record Number</h4>
                    <p className="text-gray-700 font-mono">{serverResponse.sessionId || 'No record number provided'}</p>
                  </div>
                  
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