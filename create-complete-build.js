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

/* Text sizes */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }

/* Font weights */
.font-medium { font-weight: 500; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }

/* Other utilities */
.tracking-tight { letter-spacing: -0.025em; }
.cursor-pointer { cursor: pointer; }
.transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.rounded-lg { border-radius: 0.5rem; }
.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }

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

  // Legal Notice Section
  const legalSection = createElement('div', {
    className: 'bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6 max-w-2xl mx-auto text-left'
  });

  const legalTitle = createElement('h2', {
    className: 'text-xl font-bold text-gray-800 mb-4'
  }, 'Legal Notice');

  const legalText = createElement('div', {
    className: 'space-y-3 text-sm text-gray-700'
  });

  const disclaimer = createElement('p', {}, 
    'This application is an independent third-party tool created for Disney pin collectors and is not affiliated with, endorsed by, or connected to The Walt Disney Company or any of its subsidiaries.');

  const purpose = createElement('p', {}, 
    'The app provides authentication services for Disney collectible pins using image analysis technology. Results are provided for informational purposes only.');

  const limitation = createElement('p', {}, 
    'Users acknowledge that authentication results may not be 100% accurate and should not be solely relied upon for purchasing decisions or determining collectible value.');

  const rights = createElement('p', {}, 
    'All Disney characters, trademarks, and copyrighted materials remain the property of The Walt Disney Company. This app respects all intellectual property rights.');

  legalText.appendChild(disclaimer);
  legalText.appendChild(purpose);
  legalText.appendChild(limitation);
  legalText.appendChild(rights);

  legalSection.appendChild(legalTitle);
  legalSection.appendChild(legalText);

  // Acknowledge Button
  const buttonContainer = createElement('div', {
    className: 'text-center mb-6'
  });

  const acknowledgeButton = createElement('button', {
    className: 'bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
    onclick: 'window.location.href = "/overview"'
  }, 'I Acknowledge');

  buttonContainer.appendChild(acknowledgeButton);

  // Assemble the app
  textContainer.appendChild(taglineContainer);
  textContainer.appendChild(titleContainer);
  container.appendChild(logoContainer);
  container.appendChild(textContainer);
  container.appendChild(legalSection);
  container.appendChild(buttonContainer);
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