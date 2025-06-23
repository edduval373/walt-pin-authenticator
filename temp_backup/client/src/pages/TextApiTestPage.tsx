import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { RiSendPlaneLine } from 'react-icons/ri';
import { Input } from "@/components/ui/input";

export default function TextApiTestPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [testMessage, setTestMessage] = useState("Hello from mobile app");

  const sendTextOnly = async () => {
    if (!testMessage) return;
    
    setLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      console.log("Sending text-only request to test API connection");
      
      // Make the API request without any images
      const response = await fetch('/api/text-only-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'pim_vomwwnbt58iabu27l2ehl8tn_3ea3d5e8576a9c5c5f029f0efe4a20ee16b9475bf899ba7c'
        },
        body: JSON.stringify({
          message: testMessage
        })
      });

      // Get the test results
      const data = await response.json();
      console.log('Text-only API Response:', data);
      
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
        <h1 className="text-2xl font-bold text-indigo-900 mb-6">Text-Only API Test</h1>
        <p className="text-gray-700 mb-6">
          This test sends a simple text message without any images to test if we can establish a basic connection
          with the PIM API server. This helps diagnose if the issue is related to large image payloads.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-lg font-semibold text-indigo-800 mb-4">Send Text Message</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Message
              </label>
              <Input
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter a test message"
                className="w-full mb-4"
              />
              
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3"
                disabled={loading || !testMessage}
                onClick={sendTextOnly}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Testing API Connection...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <RiSendPlaneLine className="mr-2" />
                    Send Text-Only Request
                  </div>
                )}
              </Button>
            </div>
            
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
              <h2 className="text-xl font-bold text-indigo-800 mb-4">API Response</h2>
              
              {/* Status code info */}
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h3 className="text-md font-semibold mb-2">1. Status Information</h3>
                <div className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                  <p><strong>Success:</strong> {apiResponse.success ? 'Yes' : 'No'}</p>
                  <p><strong>Status Code:</strong> {apiResponse.statusCode || 'N/A'}</p>
                  <p><strong>Message:</strong> {apiResponse.message || 'N/A'}</p>
                  <p><strong>Request ID:</strong> {apiResponse.requestId || 'N/A'}</p>
                </div>
              </div>
              
              {/* Raw Response */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-md font-semibold mb-2">2. Complete Response</h3>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-60">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}