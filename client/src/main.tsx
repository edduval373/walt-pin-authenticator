import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set title
document.title = "Disney Pin Authenticator";

// Add meta tag for better mobile experience
const meta = document.createElement('meta');
meta.name = 'description';
meta.content = 'Authenticate your Disney pins with our advanced AI image recognition technology. Get a confidence score and detailed analysis of your Disney pin collection.';
document.head.appendChild(meta);

// Global error handling to prevent white screens
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Enhanced mobile debugging and error reporting
const debugInfo = {
  userAgent: navigator.userAgent,
  isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  viewport: `${window.innerWidth}x${window.innerHeight}`,
  timestamp: new Date().toISOString(),
  url: window.location.href,
  reactVersion: '18.2.0'
};

console.log('Disney Pin Auth - React initialization starting...', debugInfo);

// Render with comprehensive error handling
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  console.log('Root element found, creating React root...');
  const root = createRoot(rootElement);
  
  console.log('React root created, rendering App component...');
  root.render(<App />);
  
  console.log('React app rendered successfully');
  
  // Report successful render to server for mobile tracking
  if (debugInfo.isMobile) {
    fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: null,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        additionalInfo: {
          ...debugInfo,
          status: 'react_render_success'
        }
      })
    }).catch(() => {}); // Silent fail for tracking
  }
  
} catch (error: any) {
  console.error('CRITICAL: Failed to render React app:', error);
  
  const errorDetails = {
    ...debugInfo,
    error: {
      name: (error as Error)?.name || 'Unknown',
      message: (error as Error)?.message || 'Unknown error',
      stack: (error as Error)?.stack || 'No stack trace'
    }
  };
  
  // Report error to server
  fetch('/api/client-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: errorDetails.error,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      additionalInfo: {
        ...errorDetails,
        status: 'react_render_failed'
      }
    })
  }).catch(() => {});
  
  // Enhanced fallback UI with detailed error information
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: white; padding: 20px;">
        <div style="max-width: 500px; width: 100%; background: rgba(255,255,255,0.1); border-radius: 20px; backdrop-filter: blur(10px); padding: 30px; text-align: center;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🐛</div>
          <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">React Loading Error</h2>
          <p style="margin-bottom: 20px; opacity: 0.9;">The main application failed to start. Debug information:</p>
          
          <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; margin: 20px 0; font-size: 14px; text-align: left;">
            <div><strong>Device:</strong> ${debugInfo.isMobile ? 'Mobile' : 'Desktop'}</div>
            <div><strong>Size:</strong> ${debugInfo.viewport}</div>
            <div><strong>Error:</strong> ${(error as Error)?.message || 'Unknown error'}</div>
            <div><strong>Time:</strong> ${new Date().toLocaleTimeString()}</div>
          </div>
          
          <div style="margin: 20px 0;">
            <button onclick="window.location.reload()" style="background: #4f46e5; color: white; padding: 12px 24px; border: none; border-radius: 50px; cursor: pointer; margin: 5px; font-size: 16px;">
              Refresh Page
            </button>
            <button onclick="copyErrorInfo()" style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 50px; cursor: pointer; margin: 5px; font-size: 16px;">
              Copy Error Info
            </button>
          </div>
          
          <p style="font-size: 12px; opacity: 0.7; margin-top: 20px;">
            This error has been automatically reported to help improve the app.
          </p>
        </div>
      </div>
      
      <script>
        function copyErrorInfo() {
          const errorInfo = ${JSON.stringify(errorDetails, null, 2)};
          if (navigator.clipboard) {
            navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2));
            alert('Error information copied to clipboard');
          } else {
            console.log('Error Info:', errorInfo);
            alert('Error information logged to console');
          }
        }
      </script>
    `;
  }
}
