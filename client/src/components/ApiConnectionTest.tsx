import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function ApiConnectionTest() {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Function to test mobile API endpoint 
  const testDirectVerifyEndpoint = async () => {
    setIsLoading(true);
    try {
      // Test the working simple-verify endpoint
      const response = await fetch('/api/mobile/simple-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'mobile-test-key'
        },
        body: JSON.stringify({ 
          frontImageBase64: 'test',
          testMode: true
        })
      });
      
      const data = await response.json();
      setTestResults(data);
      
      if (data.success) {
        toast({
          title: "API Connection Test Successful",
          description: `Connected to ${data.testedEndpoint} endpoint`,
          variant: "default"
        });
      } else {
        toast({
          title: "API Connection Test Failed",
          description: data.error || "Unable to connect to API endpoint",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Test error:", error);
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Test Error",
        description: "Failed to run API connection test",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="bg-indigo-50">
        <CardTitle>API Connection Diagnostics</CardTitle>
        <CardDescription>
          Test the connection to different PIM Standard API endpoints
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <Button 
            variant="outline" 
            onClick={testDirectVerifyEndpoint}
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            {isLoading ? "Testing Connection..." : "Test Mobile Simple-Verify Endpoint"}
          </Button>

          {testResults && (
            <div className="mt-4 bg-slate-50 p-4 rounded-md">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Test Results - {testResults.timestamp && new Date(testResults.timestamp).toLocaleTimeString()}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${testResults.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {testResults.success ? 'SUCCESS' : 'FAILED'}
                </span>
              </div>
              
              <Separator className="my-2" />
              
              <div className="space-y-2">
                <div className="flex justify-between items-center cursor-pointer py-1" onClick={() => toggleSection('details')}>
                  <span className="font-medium">Test Details</span>
                  <span>{expandedSection === 'details' ? '▼' : '▶'}</span>
                </div>
                
                {expandedSection === 'details' && (
                  <div className="text-sm pl-2 space-y-1">
                    <p><span className="font-medium">Endpoint:</span> {testResults.testedEndpoint || 'Not specified'}</p>
                    <p><span className="font-medium">Status:</span> {testResults.status || 'Unknown'}</p>
                    {testResults.error && (
                      <p className="text-red-600"><span className="font-medium">Error:</span> {testResults.error}</p>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-center cursor-pointer py-1" onClick={() => toggleSection('response')}>
                  <span className="font-medium">Full Response</span>
                  <span>{expandedSection === 'response' ? '▼' : '▶'}</span>
                </div>
                
                {expandedSection === 'response' && (
                  <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-60">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-indigo-50 flex justify-between">
        <p className="text-xs text-slate-500">
          This tool tests the PIM Standard API connection and reports detailed results
        </p>
      </CardFooter>
    </Card>
  );
}