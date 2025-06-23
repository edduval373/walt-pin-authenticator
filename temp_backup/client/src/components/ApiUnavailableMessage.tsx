import React from 'react';
import { Button } from "@/components/ui/button";
import { RiServerFill, RiRefreshLine, RiInformationLine } from 'react-icons/ri';

interface ApiUnavailableMessageProps {
  onRetry?: () => void;
  serviceName?: string;
}

/**
 * Component to display when the API service is unavailable
 */
export default function ApiUnavailableMessage({ onRetry, serviceName = 'Authentication Service' }: ApiUnavailableMessageProps) {
  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6 w-full max-w-lg mx-auto text-center">
      <div className="flex justify-center mb-4">
        <div className="bg-red-100 p-3 rounded-full">
          <RiServerFill className="text-red-500 text-4xl" />
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        {serviceName} Temporarily Unavailable
      </h3>
      
      <p className="text-gray-600 mb-6">
        We're having trouble connecting to our authentication service. This is likely a temporary issue, and we're working to resolve it as quickly as possible.
      </p>
      
      <div className="space-y-4">
        {onRetry && (
          <Button 
            onClick={onRetry}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            <RiRefreshLine className="mr-2" />
            Try Again
          </Button>
        )}
        
        <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm flex items-start">
          <RiInformationLine className="text-blue-500 mr-2 text-lg flex-shrink-0 mt-0.5" />
          <p className="text-left">
            While our service is unavailable, the authentication results shown may be limited or unavailable. Please try again in a few minutes.
          </p>
        </div>
      </div>
    </div>
  );
}