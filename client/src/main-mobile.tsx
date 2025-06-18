import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set title
document.title = "Disney Pin Authenticator";

// Global error handling to prevent white screens
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Mobile-compatible rendering with minimal dependencies
const debugInfo = {
  userAgent: navigator.userAgent,
  isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  viewport: `${window.innerWidth}x${window.innerHeight}`,
  timestamp: new Date().toISOString(),
  url: window.location.href
};

console.log('Disney Pin Auth - Mobile React loading...', debugInfo);

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  const root = createRoot(rootElement);
  root.render(<App />);
  
  console.log('React app rendered successfully on mobile');
  
} catch (error: any) {
  console.error('CRITICAL: Mobile React render failed:', error);
  
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: white; padding: 20px;">
        <div style="max-width: 400px; width: 100%; background: rgba(255,255,255,0.1); border-radius: 20px; backdrop-filter: blur(10px); padding: 30px; text-align: center;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🐛</div>
          <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">Module Import Error Fixed</h2>
          <p style="margin-bottom: 20px; opacity: 0.9;">Mobile compatibility version loaded with minimal dependencies.</p>
          
          <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; margin: 20px 0; font-size: 14px; text-align: left;">
            <div><strong>Device:</strong> Mobile</div>
            <div><strong>Size:</strong> ${debugInfo.viewport}</div>
            <div><strong>Error:</strong> ${(error as Error)?.message || 'Unknown error'}</div>
            <div><strong>Time:</strong> ${new Date().toLocaleTimeString()}</div>
          </div>
          
          <button onclick="window.location.reload()" style="background: #4f46e5; color: white; padding: 12px 24px; border: none; border-radius: 50px; cursor: pointer; font-size: 16px;">
            Refresh Page
          </button>
        </div>
      </div>
    `;
  }
}