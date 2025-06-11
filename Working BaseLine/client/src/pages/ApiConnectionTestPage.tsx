import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { RiImageAddLine, RiRefreshLine, RiSendPlaneLine } from 'react-icons/ri';

export default function ApiConnectionTestPage() {
  const [frontImageData, setFrontImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFrontImageData(result);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setFrontImageData(null);
    setApiResponse(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const submitImage = async () => {
    if (!frontImageData) return;
    
    setLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      // Extract the base64 data without the data:image prefix
      const base64Data = frontImageData.split(',')[1];
      
      // Make the API request to our test connection endpoint
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'pim_vomwwnbt58iabu27l2ehl8tn_3ea3d5e8576a9c5c5f029f0efe4a20ee16b9475bf899ba7c'
        },
        body: JSON.stringify({
          frontImageBase64: base64Data
        })
      });

      // Get the test results
      const data = await response.json();
      console.log('API Connection Test Response:', data);
      
      // Display the full response details
      setApiResponse(data);
      
    } catch (err) {
      console.error("API Error:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-indigo-100 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-indigo-900 mb-6">API Connection Test</h1>
        <p className="text-gray-700 mb-6">
          This tool tests the connection to the PIM Standard API by sending your image to both the debug endpoint and the verification endpoint.
          It will show exactly what was sent and what was received.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-lg font-semibold text-indigo-800 mb-4">Upload Test Image</h2>
            
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
                  Testing API Connection...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <RiSendPlaneLine className="mr-2" />
                  Test API Connection
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
          
          {/* Display API response details */}
          {apiResponse && (
            <div className="bg-white shadow-lg rounded-lg p-6 overflow-auto">
              <h2 className="text-xl font-bold text-indigo-800 mb-4">API Connection Results</h2>
              
              {/* Request Information */}
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h3 className="text-md font-semibold mb-2">1. Request Information</h3>
                <div className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                  <p><strong>Status URL:</strong> {apiResponse.requestInfo?.statusUrl}</p>
                  <p><strong>Test URL:</strong> {apiResponse.requestInfo?.testUrl}</p>
                  <p><strong>Old API URL:</strong> {apiResponse.requestInfo?.oldApiUrl}</p>
                  <p><strong>Content-Type:</strong> {apiResponse.requestInfo?.headers?.contentType}</p>
                  <p><strong>API Key:</strong> {apiResponse.requestInfo?.headers?.apiKey}</p>
                  <p><strong>Image Size:</strong> {apiResponse.requestInfo?.imageLength} bytes</p>
                </div>
              </div>
              
              {/* Status Endpoint Response */}
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h3 className="text-md font-semibold mb-2">2. Status Endpoint Response</h3>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-60">
                  {JSON.stringify(apiResponse.statusCheck, null, 2)}
                </pre>
              </div>
              
              {/* Test Endpoint Response */}
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h3 className="text-md font-semibold mb-2">3. Test Endpoint Response</h3>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-60">
                  {JSON.stringify(apiResponse.testEndpoint, null, 2)}
                </pre>
              </div>
              
              {/* Verification Endpoint Response */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-md font-semibold mb-2">4. Verification Endpoint Response</h3>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-60">
                  {JSON.stringify(apiResponse.verification, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}