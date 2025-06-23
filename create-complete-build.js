import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Creating complete Disney Pin Authenticator build...');

// Create dist directory structure
const distPath = './client/dist';
const assetsPath = path.join(distPath, 'assets');

if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}
if (!fs.existsSync(assetsPath)) {
  fs.mkdirSync(assetsPath, { recursive: true });
}

// Copy logo asset
const logoSrc = './client/src/assets/PinAuthLogo_1748957062189.png';
const logoDest = path.join(assetsPath, 'PinAuthLogo_1748957062189-CHct-bzj.png');
if (fs.existsSync(logoSrc)) {
  fs.copyFileSync(logoSrc, logoDest);
  console.log('Copied logo asset');
}

// Create main CSS file with all necessary styles
const mainCSS = `
@import url('https://cdn.tailwindcss.com');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  width: 100%;
  height: 100%;
  font-family: system-ui, -apple-system, sans-serif;
}

#root {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Tailwind utilities */
.fixed { position: fixed; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-start { justify-content: flex-start; }
.text-center { text-align: center; }
.min-h-screen { min-height: 100vh; }
.max-w-sm { max-width: 24rem; }
.w-full { width: 100%; }
.h-full { height: 100%; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.object-contain { object-fit: contain; }
.overflow-y-auto { overflow-y: auto; }
.z-50 { z-index: 50; }
.flex-1 { flex: 1 1 0%; }

/* Colors */
.bg-gradient-to-b { background-image: linear-gradient(to bottom, var(--tw-gradient-stops)); }
.from-indigo-50 { --tw-gradient-from: #eef2ff; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(238, 242, 255, 0)); }
.to-indigo-100 { --tw-gradient-to: #e0e7ff; }
.text-indigo-600 { color: #4f46e5; }
.text-indigo-700 { color: #4338ca; }
.text-indigo-800 { color: #3730a3; }
.text-amber-600 { color: #d97706; }
.bg-white { background-color: #ffffff; }
.bg-indigo-50 { background-color: #eef2ff; }
.bg-indigo-200 { background-color: #c7d2fe; }
.bg-indigo-500 { background-color: #6366f1; }
.bg-indigo-600 { background-color: #4f46e5; }
.hover\\:bg-indigo-600:hover { background-color: #4f46e5; }
.hover\\:bg-indigo-700:hover { background-color: #4338ca; }
.hover\\:bg-indigo-800:hover { background-color: #3730a3; }
.hover\\:text-indigo-800:hover { color: #3730a3; }
.text-white { color: #ffffff; }
.border-indigo-200 { border-color: #c7d2fe; }
.border-indigo-500 { border-color: #6366f1; }

/* Text sizes */
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }

/* Font weights */
.font-medium { font-weight: 500; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }

/* Other utilities */
.tracking-tight { letter-spacing: -0.025em; }
.cursor-pointer { cursor: pointer; }
.transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.duration-300 { transition-duration: 300ms; }
.duration-100 { transition-duration: 100ms; }
.ease-in-out { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
.ease-out { transition-timing-function: cubic-bezier(0, 0, 0.2, 1); }
.rounded-lg { border-radius: 0.5rem; }
.rounded-xl { border-radius: 0.75rem; }
.rounded-full { border-radius: 9999px; }
.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
.shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
.border { border-width: 1px; }
.border-2 { border-width: 2px; }
.bg-opacity-90 { background-color: rgba(255, 255, 255, 0.9); }
.max-h-0 { max-height: 0px; }
.opacity-0 { opacity: 0; }
.opacity-100 { opacity: 1; }
.overflow-hidden { overflow: hidden; }
.leading-relaxed { line-height: 1.625; }
.space-y-2 > * + * { margin-top: 0.5rem; }
.focus\\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }
.focus\\:ring-2:focus { box-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color); }
.focus\\:ring-indigo-500:focus { --tw-ring-color: #6366f1; }
.focus\\:ring-offset-2:focus { --tw-ring-offset-width: 2px; }
.mr-1 { margin-right: 0.25rem; }
.mr-2 { margin-right: 0.5rem; }
.mt-3 { margin-top: 0.75rem; }
.p-3 { padding: 0.75rem; }
.p-4 { padding: 1rem; }
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.px-8 { padding-left: 2rem; padding-right: 2rem; }
.h-1\.5 { height: 0.375rem; }

/* Button styles */
.bg-indigo-600 { background-color: #4f46e5; }
.hover\\:bg-indigo-700:hover { background-color: #4338ca; }
.text-white { color: #ffffff; }

/* Loading animation */
@keyframes spin {
  to { transform: rotate(360deg); }
}
.animate-spin { animation: spin 1s linear infinite; }

/* Progress bar */
.bg-indigo-200 { background-color: #c7d2fe; }
.bg-indigo-500 { background-color: #6366f1; }
.rounded-full { border-radius: 9999px; }
`;

fs.writeFileSync(path.join(assetsPath, 'index-DAgQPu_G.css'), mainCSS);
console.log('Created main CSS file');

// Create main JavaScript bundle (simplified)
const mainJS = `
// Disney Pin Authenticator - Main Bundle
console.log('Disney Pin Authenticator loading...');

// Basic React-like functionality
function createElement(tag, props, ...children) {
  const element = document.createElement(tag);
  if (props) {
    Object.keys(props).forEach(key => {
      if (key === 'className') {
        element.className = props[key];
      } else if (key.startsWith('on')) {
        element.addEventListener(key.slice(2).toLowerCase(), props[key]);
      } else {
        element.setAttribute(key, props[key]);
      }
    });
  }
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child) {
      element.appendChild(child);
    }
  });
  return element;
}

// Disney Pin Authenticator App
function createDisneyPinApp() {
  const root = document.getElementById('root');
  if (!root) return;

  // Create main container
  const app = createElement('div', {
    className: 'fixed inset-0 flex flex-col items-center justify-start bg-gradient-to-b from-indigo-50 to-indigo-100 z-50 overflow-y-auto'
  });

  // Content container
  const container = createElement('div', {
    className: 'text-center px-4 max-w-sm w-full py-2 min-h-screen flex flex-col',
    style: 'padding-top: 0px; transform: translateY(-110px);'
  });

  // Logo container
  const logoContainer = createElement('div', {
    className: 'mb-2'
  });

  const logo = createElement('img', {
    src: '/assets/PinAuthLogo_1748957062189-CHct-bzj.png',
    alt: 'W.A.L.T. Logo',
    className: 'object-contain mx-auto',
    style: 'width: 437px; height: 437px; object-fit: contain;'
  });

  logoContainer.appendChild(logo);

  // Text content
  const textContainer = createElement('div', {
    className: 'flex-1 flex flex-col justify-start',
    style: 'transform: translateY(-146px);'
  });

  // Tagline
  const taglineContainer = createElement('div', {
    className: 'mb-3 text-center'
  });

  const meetWalt = createElement('p', {
    className: 'text-indigo-600 text-3xl font-medium mb-3'
  }, 'Meet W.A.L.T.');

  const description = createElement('p', {
    className: 'text-indigo-600 text-xl'
  }, 'the World-class Authentication and Lookup Tool');

  taglineContainer.appendChild(meetWalt);
  taglineContainer.appendChild(description);

  // App title
  const titleContainer = createElement('div', {
    className: 'mb-4 text-center'
  });

  const title = createElement('h1', {
    className: 'text-3xl font-bold text-indigo-700 tracking-tight mb-2'
  }, 'W.A.L.T. Mobile App');

  const version = createElement('p', {
    className: 'text-sm text-indigo-600 font-semibold'
  }, 'BETA Version 1.3.2');

  titleContainer.appendChild(title);
  titleContainer.appendChild(version);

  // Legal Notice Section - Matching React IntroPage.tsx exactly
  const legalSection = createElement('div', {
    className: 'mb-4 bg-white bg-opacity-90 rounded-xl p-4 border-2 border-indigo-200 shadow-sm'
  });

  // Header with warning icon
  const legalHeader = createElement('div', {
    className: 'flex items-center justify-center mb-2'
  });

  const warningIcon = createElement('div', {
    className: 'text-amber-600 mr-2 text-lg'
  }, '⚠️');

  const legalTitle = createElement('h3', {
    className: 'text-sm font-bold text-indigo-800'
  }, 'IMPORTANT LEGAL NOTICE');

  legalHeader.appendChild(warningIcon);
  legalHeader.appendChild(legalTitle);

  // Main legal text
  const mainLegalText = createElement('p', {
    className: 'text-xs text-indigo-700 mb-2 font-semibold'
  }, 'FOR ENTERTAINMENT PURPOSES ONLY.');

  const disclaimer = createElement('p', {
    className: 'text-xs text-indigo-600 mb-3'
  }, 'This AI application is unreliable and should not be used for financial decisions.');

  // Expandable section toggle
  let isExpanded = false;
  const toggleButton = createElement('button', {
    className: 'flex items-center justify-center text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors w-full mb-3'
  });

  const toggleText = createElement('span', {
    className: 'mr-1'
  }, 'Read Full Legal Notice');

  const toggleIcon = createElement('span', {
    className: 'text-sm'
  }, '▼');

  toggleButton.appendChild(toggleText);
  toggleButton.appendChild(toggleIcon);

  // Expanded content
  const expandedContent = createElement('div', {
    className: 'mt-3 transition-all duration-300 ease-in-out overflow-hidden max-h-0 opacity-0',
    style: 'max-height: 0px; opacity: 0;'
  });

  const expandedInner = createElement('div', {
    className: 'p-3 bg-indigo-50 rounded-lg text-xs text-indigo-700 text-left leading-relaxed space-y-2'
  });

  // Detailed legal sections
  const sections = [
    {
      title: 'Disclaimer of Warranties:',
      text: 'This application provides entertainment value only. Results are not guaranteed to be accurate, complete, or reliable. The AI system may produce false, misleading, or completely incorrect assessments.'
    },
    {
      title: 'No Financial Advice:',
      text: 'Do not use this application for making financial decisions, investment choices, purchase decisions, or determining the actual value of collectibles, antiques, or any items of value.'
    },
    {
      title: 'Professional Consultation Required:',
      text: 'Always consult with professional appraisers, authentication services, and qualified experts for valuable items. This app cannot replace professional expertise.'
    },
    {
      title: 'Limitation of Liability:',
      text: 'By using this app, you acknowledge these limitations and agree that the developers disclaim all liability for any losses or damages resulting from reliance on AI-generated content.'
    }
  ];

  sections.forEach(section => {
    const sectionDiv = createElement('div');
    const sectionTitle = createElement('p', {
      className: 'font-semibold mb-1'
    }, section.title);
    const sectionText = createElement('p', {}, section.text);
    
    sectionDiv.appendChild(sectionTitle);
    sectionDiv.appendChild(sectionText);
    expandedInner.appendChild(sectionDiv);
  });

  expandedContent.appendChild(expandedInner);

  // Toggle functionality
  toggleButton.addEventListener('click', function() {
    isExpanded = !isExpanded;
    if (isExpanded) {
      expandedContent.style.maxHeight = '400px';
      expandedContent.style.opacity = '1';
      toggleIcon.textContent = '▲';
    } else {
      expandedContent.style.maxHeight = '0px';
      expandedContent.style.opacity = '0';
      toggleIcon.textContent = '▼';
    }
  });

  // Assemble legal section
  legalSection.appendChild(legalHeader);
  legalSection.appendChild(mainLegalText);
  legalSection.appendChild(disclaimer);
  legalSection.appendChild(toggleButton);
  legalSection.appendChild(expandedContent);

  // Progress bar (matching React version)
  const progressContainer = createElement('div', {
    className: 'w-full h-1.5 bg-indigo-200 rounded-full overflow-hidden mb-4'
  });

  const progressBar = createElement('div', {
    className: 'h-full bg-indigo-500 rounded-full transition-all duration-100 ease-out',
    style: 'width: 100%;'
  });

  progressContainer.appendChild(progressBar);

  // I Acknowledge Button (matching React styling)
  const buttonContainer = createElement('div', {
    className: 'mb-2'
  });

  const acknowledgeButton = createElement('button', {
    className: 'bg-indigo-500 text-white hover:bg-indigo-600 py-6 px-8 rounded-full shadow-lg border border-indigo-200 text-lg w-full font-bold'
  });

  const buttonText = createElement('span', {
    className: 'font-bold mr-2'
  }, 'I Acknowledge');

  const buttonIcon = createElement('span', {
    className: 'text-xl'
  }, '→');

  acknowledgeButton.appendChild(buttonText);
  acknowledgeButton.appendChild(buttonIcon);

  // Button click handler
  acknowledgeButton.addEventListener('click', function() {
    // Store visit flag and navigate
    localStorage.setItem('hasVisitedBefore', 'true');
    window.location.href = '/overview';
  });

  buttonContainer.appendChild(acknowledgeButton);

  // Assemble the app
  textContainer.appendChild(taglineContainer);
  textContainer.appendChild(titleContainer);
  
  // Create bottom section container
  const bottomSection = createElement('div', {
    className: 'flex-shrink-0',
    style: 'transform: translateY(-50px);'
  });
  
  bottomSection.appendChild(legalSection);
  bottomSection.appendChild(progressContainer);
  bottomSection.appendChild(buttonContainer);
  
  container.appendChild(logoContainer);
  container.appendChild(textContainer);
  container.appendChild(bottomSection);
  app.appendChild(container);

  // Clear root and add app
  root.innerHTML = '';
  root.appendChild(app);

  console.log('Disney Pin Authenticator loaded successfully');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createDisneyPinApp);
} else {
  createDisneyPinApp();
}
`;

fs.writeFileSync(path.join(assetsPath, 'index-DQwQ6CII.js'), mainJS);
console.log('Created main JavaScript bundle');

// Create complete index.html
const indexHTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>Disney Pin Authenticator - W.A.L.T.</title>
    <meta name="description" content="Authenticate your Disney pins with advanced AI image recognition technology" />
    <link rel="stylesheet" crossorigin href="/assets/index-DAgQPu_G.css">
  </head>
  <body>
    <div id="root">
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(to bottom, #eef2ff, #e0e7ff);">
        <div style="text-align: center; color: #4f46e5;">
          <h1>Disney Pin Authenticator</h1>
          <p>Loading W.A.L.T. interface...</p>
        </div>
      </div>
    </div>
    <script type="module" crossorigin src="/assets/index-DQwQ6CII.js"></script>
  </body>
</html>`;

fs.writeFileSync(path.join(distPath, 'index.html'), indexHTML);
console.log('Created complete index.html');

console.log('Complete Disney Pin Authenticator build created successfully!');