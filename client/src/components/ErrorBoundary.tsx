import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Store error details for debugging with mobile-specific detection
    try {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const errorDetails = {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        isMobile,
        url: window.location.href,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      };
      
      sessionStorage.setItem('lastError', JSON.stringify(errorDetails));
      
      // Report error to server for centralized logging
      fetch('/api/client-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          additionalInfo: {
            componentStack: errorInfo.componentStack,
            isMobile,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            localStorage: Object.keys(localStorage).length,
            sessionStorage: Object.keys(sessionStorage).length
          }
        })
      }).catch(reportError => {
        console.error('Failed to report error to server:', reportError);
      });
      
      // Log mobile-specific errors
      if (isMobile) {
        console.error('Mobile-specific error detected:', errorDetails);
      }
    } catch (e) {
      console.error('Failed to store error details:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      const errorDetails = this.state.error ? {
        message: this.state.error.message,
        stack: this.state.error.stack,
        name: this.state.error.name,
        toString: this.state.error.toString()
      } : null;
      
      const debugInfo = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        localStorage: Object.keys(localStorage).length,
        sessionStorage: Object.keys(sessionStorage).length,
        cookiesEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      };

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-red-500 text-4xl mb-4 text-center">🐛</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">Debug Information</h2>
            
            <div className="space-y-4">
              {errorDetails && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Error Details:</h3>
                  <div className="text-sm text-red-700 space-y-1">
                    <div><strong>Type:</strong> {errorDetails.name}</div>
                    <div><strong>Message:</strong> {errorDetails.message}</div>
                    {errorDetails.stack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer">Stack Trace</summary>
                        <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                          {errorDetails.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Environment:</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <div><strong>Device:</strong> {debugInfo.isMobile ? 'Mobile' : 'Desktop'}</div>
                  <div><strong>Online:</strong> {debugInfo.onLine ? 'Yes' : 'No'}</div>
                  <div><strong>Viewport:</strong> {debugInfo.viewport}</div>
                  <div><strong>URL:</strong> {debugInfo.url}</div>
                  <div><strong>User Agent:</strong> {debugInfo.userAgent}</div>
                </div>
              </div>
              
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => {
                    const debugData = { errorDetails, debugInfo };
                    navigator.clipboard?.writeText(JSON.stringify(debugData, null, 2));
                    alert('Debug info copied to clipboard');
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Copy Debug Info
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;