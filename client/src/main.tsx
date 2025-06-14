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

createRoot(document.getElementById("root")!).render(<App />);
