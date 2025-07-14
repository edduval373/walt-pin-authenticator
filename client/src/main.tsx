import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./assets/analysis-styles.css";
import "./assets/verification-report.css";
import "./assets/exact-report.css";
import { errorLogger } from "./lib/error-logger";

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
  errorLogger.logError('Global window error', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  errorLogger.logError('Unhandled promise rejection', event.reason);
});

// Render with error handling
try {
  createRoot(document.getElementById("root")!).render(<App />);
} catch (error) {
  console.error('Failed to render app:', error);
  
  // Fallback UI for critical errors
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f9fafb; font-family: system-ui, -apple-system, sans-serif;">
        <div style="max-width: 400px; width: 100%; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); padding: 24px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 8px;">App Loading Failed</h2>
          <p style="color: #6b7280; margin-bottom: 16px;">Please refresh the page to try again.</p>
          <button onclick="window.location.reload()" style="background: #6366f1; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer;">
            Refresh Page
          </button>
        </div>
      </div>
    `;
  }
}
