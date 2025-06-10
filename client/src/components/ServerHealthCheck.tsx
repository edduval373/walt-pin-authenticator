import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { transmissionLogger } from "@/lib/transmission-logger";

interface ServerHealthCheckProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function ServerHealthCheck({ onSuccess, onError }: ServerHealthCheckProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkServerHealth = async () => {
    setIsChecking(true);
    setError(null);

    // Use your redeployed server directly
    const healthUrl = 'https://pim-master-library-edduval15.replit.app/health';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Master server returns JSON with "OK" status
        try {
          const data = await response.json();
          if (data === 'OK' || data.status === 'OK' || data.status === 'healthy' || data.message === 'OK') {
            const message = 'Server is healthy and ready to process pin images';
            transmissionLogger.logHealthCheck('success', message, healthUrl);
            console.log("Health check successful:", data);
            onSuccess();
          } else {
            throw new Error(`Unexpected health response: ${JSON.stringify(data)}`);
          }
        } catch (parseError) {
          // Fallback to text parsing if JSON fails
          const responseText = await response.text();
          if (responseText.trim() === 'OK' || responseText.includes('healthy')) {
            const message = 'Server is healthy and ready to process pin images';
            transmissionLogger.logHealthCheck('success', message, healthUrl);
            console.log("Health check successful");
            onSuccess();
          } else {
            throw new Error(`Unexpected health response: ${responseText}`);
          }
        }
      } else {
        const errorMsg = `Server responded with status: ${response.status}`;
        transmissionLogger.logHealthCheck('failed', errorMsg, healthUrl, errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      const errorMessage = error.name === 'AbortError' 
        ? 'Connection timeout - server may be unavailable'
        : error.message || 'Failed to connect to server';
      
      transmissionLogger.logHealthCheck('failed', errorMessage, healthUrl, errorMessage);
      console.error("Health check failed:", error);
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRetry = () => {
    checkServerHealth();
  };

  // Auto-start health check on component mount
  React.useEffect(() => {
    checkServerHealth();
  }, []);

  if (isChecking) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
          <CardTitle>Connecting to Server</CardTitle>
          <CardDescription>
            Checking server connectivity for Disney pin authentication...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <CardTitle className="text-red-600">Cannot Connect to Server</CardTitle>
          <CardDescription>
            Unable to reach the Disney pin authentication server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <div className="text-sm text-gray-600 space-y-1">
            <p>Please check:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Your internet connection</li>
              <li>Server availability</li>
              <li>Network connectivity</li>
            </ul>
          </div>

          <Button 
            onClick={handleRetry} 
            className="w-full"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <CardTitle className="text-green-600">Server Connected</CardTitle>
        <CardDescription>
          Ready for Disney pin authentication
        </CardDescription>
      </CardHeader>
    </Card>
  );
}