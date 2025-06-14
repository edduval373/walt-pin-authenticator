import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RiRefreshLine, RiArrowLeftLine, RiServerLine, RiWifiOffLine } from 'react-icons/ri';
import { useLocation } from 'wouter';

interface ServerErrorScreenProps {
  onRetry?: () => void;
  onGoBack?: () => void;
  error?: string;
  isConnecting?: boolean;
}

export default function ServerErrorScreen({ 
  onRetry, 
  onGoBack, 
  error = "Master server is currently unavailable",
  isConnecting = false 
}: ServerErrorScreenProps) {
  const [_, setLocation] = useLocation();
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    if (onRetry) {
      onRetry();
    } else {
      // Default retry behavior
      window.location.reload();
    }
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      setLocation('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="mb-6">
          {isConnecting ? (
            <div className="text-indigo-500 text-6xl mb-4 animate-pulse">
              <RiServerLine className="mx-auto" />
            </div>
          ) : (
            <div className="text-gray-400 text-6xl mb-4">
              <RiWifiOffLine className="mx-auto" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          {isConnecting ? 'Connecting...' : 'Connection Issue'}
        </h2>

        {/* Message */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {isConnecting 
            ? 'Attempting to connect to the authentication server. This may take a moment.'
            : error
          }
        </p>

        {/* Retry count indicator */}
        {retryCount > 0 && !isConnecting && (
          <p className="text-sm text-gray-500 mb-4">
            Retry attempt: {retryCount}
          </p>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          {!isConnecting && (
            <Button
              onClick={handleRetry}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
              disabled={isConnecting}
            >
              <RiRefreshLine className="mr-2" />
              Try Again
            </Button>
          )}

          <Button
            onClick={handleGoBack}
            variant="outline"
            className="w-full"
            disabled={isConnecting}
          >
            <RiArrowLeftLine className="mr-2" />
            Go Back
          </Button>
        </div>

        {/* Additional help text */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            If the problem persists, please check your internet connection or try again later.
          </p>
        </div>
      </div>
    </div>
  );
}