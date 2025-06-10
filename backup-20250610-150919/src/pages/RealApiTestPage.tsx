import React, { useState, useRef, ChangeEvent } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { RiArrowLeftLine, RiSendPlaneLine, RiImageAddLine, RiRefreshLine } from "react-icons/ri";
import ApiUnavailableMessage from "@/components/ApiUnavailableMessage";

export default function RealApiTestPage() {
  const [_, setLocation] = useLocation();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frontImageData, setFrontImageData] = useState<string | null>(null);
  const [isApiUnavailable, setIsApiUnavailable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setFrontImageData(imageData);
    };
    reader.readAsDataURL(file);
  };

  // Send the image to the API
  const submitImage = async () => {
    if (!frontImageData) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError(null);
    setApiResponse(null);
    
    try {
      // Reset API unavailable state
      setIsApiUnavailable(false);
      
      // Call the actual API endpoint with the real image
      const response = await fetch('/api/mobile/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'pim_vomwwnbt58iabu27l2ehl8tn_3ea3d5e8576a9c5c5f029f0efe4a20ee16b9475bf899ba7c'
        },
        body: JSON.stringify({
          frontImageBase64: frontImageData.replace(/^data:image\/[a-z]+;base64,/, ''),
          requestId: `test_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          testSource: 'mobile_test_portal'
        })
      });

      // Check for service unavailability status codes
      if (response.status === 503 || response.status === 502 || response.status === 504) {
        console.error(`API Service Unavailable (${response.status})`);
        setIsApiUnavailable(true);
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      // Get the raw, unmodified API response
      const data = await response.json();
      console.log('Raw API Response:', data);
      
      // Display the exact, unmodified response
      setApiResponse(data);
      
      // Log the complete API response without truncation
      console.log("FULL API RESPONSE:", JSON.stringify(data, null, 2));
      
      // Log specific sections for easier debugging
      console.log("1. API Response Structure:", {
        success: data.success,
        message: data.message,
        errorCode: data.errorCode,
        data: data.data,
        characters: data.characters,
        authenticity: data.authenticity,
        analysisReport: data.analysisReport ? data.analysisReport.substring(0, 50) + "..." : "Not present",
        requestId: data.requestId
      });
      
      // Log the HTML content sections if present
      console.log("2. HTML Content Sections:", {
        aiFindings: data.result?.aiFindings ? data.result.aiFindings.substring(0, 50) + "..." : "Not present",
        pinId: data.result?.pinId ? data.result.pinId.substring(0, 50) + "..." : "Not present",
        pricingInfo: data.result?.pricingInfo ? data.result.pricingInfo.substring(0, 50) + "..." : "Not present"
      });
      
    } catch (err) {
      console.error("API Error:", err);
      
      // Check if error indicates service unavailability
      if (err instanceof Error && 
          (err.message.includes("503") || 
           err.message.includes("service unavailable") || 
           err.message.includes("failed to fetch"))) {
        setIsApiUnavailable(true);
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset the form
  const resetForm = () => {
    setFrontImageData(null);
    setApiResponse(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="app-container max-w-md mx-auto flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 py-4 px-4 shadow-sm">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/')}>
            <RiArrowLeftLine className="mr-1" />
            Back
          </Button>
          <h1 className="text-lg font-semibold text-indigo-900">Real API Tester</h1>
          <div className="w-10"></div> {/* Spacer for balance */}
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow p-4">
        {isApiUnavailable ? (
          <ApiUnavailableMessage 
            onRetry={() => {
              setIsApiUnavailable(false);
              if (frontImageData) submitImage();
            }}
            serviceName="Pin Authentication API"
          />
        ) : (
          <>
            <div className="bg-white shadow-lg rounded-lg p-6 w-full mb-4">
              <h2 className="text-xl font-bold text-indigo-800 mb-4">Submit Pin Image</h2>
            
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Pin Image
                </label>
                
                {frontImageData ? (
                  <div className="relative mb-4">
                    <img 
                      src={frontImageData} 
                      alt="Selected pin" 
                      className="w-full h-48 object-contain bg-gray-50 rounded-md border"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="absolute top-2 right-2 bg-white opacity-90"
                      onClick={resetForm}
                    >
                      <RiRefreshLine /> Change
                    </Button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center cursor-pointer hover:border-indigo-400 transition-colors"
                  >
                    <RiImageAddLine className="text-gray-400 text-4xl mb-2" />
                    <p className="text-sm text-gray-500">Click to select pin image</p>
                    <p className="text-xs text-gray-400 mt-1">Image will remain on your device</p>
                  </div>
                )}
                
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3"
                disabled={loading || !frontImageData}
                onClick={submitImage}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <RiSendPlaneLine className="mr-2" />
                    Submit to Real API
                  </div>
                )}
              </Button>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  <p className="font-semibold">Error:</p>
                  <p>{error}</p>
                </div>
              )}
            </div>
            
            {/* Display raw API response */}
            {apiResponse && (
              <div className="bg-white shadow-lg rounded-lg p-6 w-full">
                <h2 className="text-xl font-bold text-indigo-800 mb-4">API Response</h2>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-md font-semibold mb-2">1. Response Status</h3>
                  <div className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                    <p><strong>Success:</strong> {apiResponse.success ? 'Yes' : 'No'}</p>
                    <p><strong>Message:</strong> {apiResponse.message || 'N/A'}</p>
                    <p><strong>Error Code:</strong> {apiResponse.errorCode || 'None'}</p>
                    <p><strong>Request ID:</strong> {apiResponse.requestId || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md mt-4">
                  <h3 className="text-md font-semibold mb-2">2. Pin Data</h3>
                  <div className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                    <p><strong>Pin ID:</strong> {apiResponse.data?.pinId || 'Not provided'}</p>
                    <p><strong>Rating:</strong> {apiResponse.data?.rating !== undefined ? 
                        `${apiResponse.data.rating}/5` : 'Not provided'}</p>
                    <p><strong>Characters:</strong> {apiResponse.characters || 'Not provided'}</p>
                    <p><strong>Authenticity:</strong> {apiResponse.authenticity !== undefined ? 
                        `${(apiResponse.authenticity * 100).toFixed(1)}%` : 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md mt-4">
                  <h3 className="text-md font-semibold mb-2">3. Raw Analysis Report</h3>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-60">
                    {apiResponse.analysisReport || 'No analysis report returned'}
                  </pre>
                </div>
                
                {apiResponse.result?.aiFindings && (
                  <div className="bg-gray-50 p-4 rounded-md mt-4">
                    <h3 className="text-md font-semibold mb-2">4. AI Findings HTML</h3>
                    <div className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-60">
                      <code>
                        {apiResponse.result.aiFindings}
                      </code>
                    </div>
                  </div>
                )}
                
                {apiResponse.result?.pinId && (
                  <div className="bg-gray-50 p-4 rounded-md mt-4">
                    <h3 className="text-md font-semibold mb-2">5. Pin Identification HTML</h3>
                    <div className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-60">
                      <code>
                        {apiResponse.result.pinId}
                      </code>
                    </div>
                  </div>
                )}
                
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      // Store the data to view it in the regular results page
                      const dummyImages = {
                        front: frontImageData
                      };
                      sessionStorage.setItem('analysisResult', JSON.stringify(apiResponse));
                      sessionStorage.setItem('capturedImages', JSON.stringify(dummyImages));
                      setLocation('/results');
                    }}
                  >
                    View in Results Format
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}