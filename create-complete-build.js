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
.duration-200 { transition-duration: 200ms; }
.duration-100 { transition-duration: 100ms; }
.ease-in-out { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
.ease-out { transition-timing-function: cubic-bezier(0, 0, 0.2, 1); }
.rounded-lg { border-radius: 0.5rem; }
.rounded-xl { border-radius: 0.75rem; }
.rounded-full { border-radius: 9999px; }
.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
.shadow-xl { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
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
.space-y-4 > * + * { margin-top: 1rem; }
.space-y-6 > * + * { margin-top: 1.5rem; }
.focus\\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }
.focus\\:ring-2:focus { box-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color); }
.focus\\:ring-indigo-500:focus { --tw-ring-color: #6366f1; }
.focus\\:ring-offset-2:focus { --tw-ring-offset-width: 2px; }
.mr-1 { margin-right: 0.25rem; }
.mr-2 { margin-right: 0.5rem; }
.mr-4 { margin-right: 1rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 0.75rem; }
.mt-5 { margin-top: 1.25rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-8 { margin-bottom: 2rem; }
.ml-3 { margin-left: 0.75rem; }
.my-8 { margin-top: 2rem; margin-bottom: 2rem; }
.p-3 { padding: 0.75rem; }
.p-4 { padding: 1rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.px-8 { padding-left: 2rem; padding-right: 2rem; }
.h-1 { height: 0.25rem; }
.h-1\.5 { height: 0.375rem; }
.h-8 { height: 2rem; }
.h-10 { height: 2.5rem; }
.h-auto { height: auto; }
.w-8 { width: 2rem; }
.w-10 { width: 2.5rem; }
.max-w-md { max-width: 28rem; }
.flex-grow { flex: 1 1 0%; }
.flex-shrink-0 { flex-shrink: 0; }
.text-left { text-align: left; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.bg-gray-300 { background-color: #d1d5db; }
.bg-gray-800 { background-color: #1f2937; }
.text-gray-500 { color: #6b7280; }
.text-gray-600 { color: #4b5563; }
.text-gray-800 { color: #1f2937; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.fade-in { animation: fadeIn 0.5s ease-in-out; }
.transform { transform: var(--tw-transform); }
.hover\\:scale-105:hover { transform: scale(1.05); }
.mx-2 { margin-left: 0.5rem; margin-right: 0.5rem; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

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
    // Store visit flag and navigate to overview
    localStorage.setItem('hasVisitedBefore', 'true');
    showOverviewPage();
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

// Overview Page Function
function showOverviewPage() {
  const root = document.getElementById('root');
  if (!root) return;

  // Clear root and create overview page
  root.innerHTML = '';

  // Main container
  const container = createElement('div', {
    className: 'flex-grow flex flex-col items-center justify-center p-4 fade-in'
  });

  const contentWrapper = createElement('div', {
    className: 'text-center max-w-md w-full'
  });

  // Step Progress Bar
  const progressContainer = createElement('div', {
    className: 'mb-6'
  });

  const progressBar = createElement('div', {
    className: 'flex items-center justify-between mb-4'
  });

  // Progress steps
  const steps = [
    { number: 1, label: 'Start', active: true },
    { number: 2, label: 'Photo', active: false },
    { number: 3, label: 'Check', active: false },
    { number: 4, label: 'Results', active: false }
  ];

  steps.forEach((step, index) => {
    const stepContainer = createElement('div', {
      className: 'flex flex-col items-center'
    });

    const stepCircle = createElement('div', {
      className: step.active 
        ? 'w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm'
        : 'w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm'
    }, step.number.toString());

    const stepLabel = createElement('div', {
      className: step.active ? 'text-sm font-medium text-indigo-600 mt-2' : 'text-sm text-gray-500 mt-2'
    }, step.label);

    stepContainer.appendChild(stepCircle);
    stepContainer.appendChild(stepLabel);
    progressBar.appendChild(stepContainer);

    // Add connector line (except for last step)
    if (index < steps.length - 1) {
      const connector = createElement('div', {
        className: 'flex-1 h-1 bg-gray-300 mx-2 mt-5'
      });
      progressBar.appendChild(connector);
    }
  });

  progressContainer.appendChild(progressBar);

  // Title Section
  const titleSection = createElement('div', {
    className: 'my-8',
    style: 'margin-top: 17px;'
  });

  const title = createElement('h1', {
    className: 'text-2xl font-bold text-gray-800 mb-2'
  }, 'Disney Pin Checker');

  const subtitle = createElement('p', {
    className: 'text-lg text-gray-600 mb-6'
  }, 'Find out if your Disney pin is real!');

  titleSection.appendChild(title);
  titleSection.appendChild(subtitle);

  // Steps Section
  const stepsSection = createElement('div', {
    className: 'mb-8 text-center space-y-6'
  });

  const stepsTitle = createElement('h3', {
    className: 'text-xl font-bold text-gray-800 mb-6'
  }, "It's super easy!");

  const stepsContainer = createElement('div', {
    className: 'space-y-4'
  });

  // Step 1
  const step1 = createElement('div', {
    className: 'flex items-center text-left'
  });

  const step1Circle = createElement('div', {
    className: 'w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0'
  }, '1');

  const step1Text = createElement('div');
  const step1Content = createElement('span', {
    className: 'text-lg font-semibold text-gray-800'
  }, '📸 Take a photo of your Disney pin');

  step1Text.appendChild(step1Content);
  step1.appendChild(step1Circle);
  step1.appendChild(step1Text);

  // Step 2
  const step2 = createElement('div', {
    className: 'flex items-center text-left'
  });

  const step2Circle = createElement('div', {
    className: 'w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0'
  }, '2');

  const step2Text = createElement('div');
  const step2Content = createElement('span', {
    className: 'text-lg font-semibold text-gray-800'
  }, '🤖 Computer checks if it\'s real');

  step2Text.appendChild(step2Content);
  step2.appendChild(step2Circle);
  step2.appendChild(step2Text);

  // Step 3
  const step3 = createElement('div', {
    className: 'flex items-center text-left'
  });

  const step3Circle = createElement('div', {
    className: 'w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0'
  }, '3');

  const step3Text = createElement('div');
  const step3Content = createElement('span', {
    className: 'text-lg font-semibold text-gray-800'
  }, '✨ Get your answer!');

  step3Text.appendChild(step3Content);
  step3.appendChild(step3Circle);
  step3.appendChild(step3Text);

  stepsContainer.appendChild(step1);
  stepsContainer.appendChild(step2);
  stepsContainer.appendChild(step3);

  stepsSection.appendChild(stepsTitle);
  stepsSection.appendChild(stepsContainer);

  // Start Button
  const startButton = createElement('button', {
    className: 'w-full bg-indigo-600 text-white py-4 px-6 rounded-xl text-xl font-bold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center h-auto'
  });

  const buttonText = createElement('span', {}, 'Start Taking Photos!');
  const buttonIcon = createElement('span', {
    className: 'ml-3 text-2xl'
  }, '📷');

  startButton.appendChild(buttonText);
  startButton.appendChild(buttonIcon);

  // Start button click handler
  startButton.addEventListener('click', function() {
    // Navigate to camera page
    showCameraPage();
  });

  // Assemble overview page
  contentWrapper.appendChild(progressContainer);
  contentWrapper.appendChild(titleSection);
  contentWrapper.appendChild(stepsSection);
  contentWrapper.appendChild(startButton);

  container.appendChild(contentWrapper);
  root.appendChild(container);

  console.log('Overview page loaded successfully');
}

// Camera Page Function (placeholder)
function showCameraPage() {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = '';
  
  const container = createElement('div', {
    className: 'flex items-center justify-center min-h-screen bg-gradient-to-b from-indigo-50 to-indigo-100'
  });

  const message = createElement('div', {
    className: 'text-center text-indigo-600'
  });

  const title = createElement('h1', {
    className: 'text-2xl font-bold mb-4'
  }, 'Camera Page');

  const text = createElement('p', {}, 'Camera functionality will be implemented here.');

  message.appendChild(title);
  message.appendChild(text);
  container.appendChild(message);
  root.appendChild(container);

  console.log('Camera page loaded successfully');
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

// Create embedded HTML with inline CSS and JavaScript for maximum compatibility
const indexHTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>Disney Pin Authenticator - W.A.L.T.</title>
    <meta name="description" content="Authenticate your Disney pins with advanced AI image recognition technology" />
    <style>
${mainCSS}
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
${mainJS}
    </script>
  </body>
</html>`;

fs.writeFileSync(path.join(distPath, 'index.html'), indexHTML);
console.log('Created complete index.html');

console.log('Complete Disney Pin Authenticator build created successfully!');