import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getExactPimAnalysisReport } from '@/lib/exact-pim-api';

/**
 * Component for testing the PIM Standard API integration
 */
export default function ApiTester() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('raw');
  
  // Get a sample image from sessionStorage if available
  const getSampleImage = (): string => {
    const capturedImagesJSON = sessionStorage.getItem('capturedImages');
    if (capturedImagesJSON) {
      try {
        const parsed = JSON.parse(capturedImagesJSON);
        return parsed.front || '';
      } catch (err) {
        console.error("Failed to parse captured images:", err);
        return '';
      }
    }
    return '';
  };
  
  // Test the API with a sample image
  const testApi = async () => {
    setLoading(true);
    setError(null);
    
    const sampleImage = getSampleImage();
    if (!sampleImage) {
      setError('No sample image found in sessionStorage. Please capture an image first.');
      setLoading(false);
      return;
    }
    
    try {
      // Call the API with the sample image
      const response = await getExactPimAnalysisReport(sampleImage);
      console.log('API Test Response:', response);
      setApiResponse(response);
    } catch (err) {
      console.error('API test error:', err);
      setError(`API error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  // The render UI
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>PIM Standard API Tester</CardTitle>
        <CardDescription>
          Test the mobile API integration with a sample image
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <Button 
            onClick={testApi} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test API Integration'}
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {apiResponse && (
          <div className="api-response">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full mb-4">
                <TabsTrigger value="raw">Raw Response</TabsTrigger>
                <TabsTrigger value="characters">Characters</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="identification">Identification</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
              </TabsList>
              
              <TabsContent value="raw">
                <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </div>
              </TabsContent>
              
              <TabsContent value="characters">
                {apiResponse.result?.characters ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: apiResponse.result.characters }}
                    className="p-4 border rounded-md"
                  />
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-md">
                    No characters HTML content available in the response.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="analysis">
                {apiResponse.result?.aiFindings ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: apiResponse.result.aiFindings }}
                    className="p-4 border rounded-md"
                  />
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-md">
                    No analysis HTML content available in the response.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="identification">
                {apiResponse.result?.pinId ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: apiResponse.result.pinId }}
                    className="p-4 border rounded-md"
                  />
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-md">
                    No identification HTML content available in the response.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="pricing">
                {apiResponse.result?.pricingInfo ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: apiResponse.result.pricingInfo }}
                    className="p-4 border rounded-md"
                  />
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-md">
                    No pricing HTML content available in the response.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="text-xs text-gray-500">
        API response includes both raw text report and formatted HTML sections for each category
      </CardFooter>
    </Card>
  );
}