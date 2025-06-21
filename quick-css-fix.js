import fs from 'fs';
import path from 'path';

console.log('Applying CSS formatting fix to existing build...');

const distPath = './client/dist';
const indexPath = path.join(distPath, 'index.html');

// Check if build exists
if (!fs.existsSync(indexPath)) {
  console.log('No existing build found, creating minimal index.html...');
  
  // Create dist directory if it doesn't exist
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
  }
  
  // Create a basic index.html with proper CSS
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>Disney Pin Authenticator - W.A.L.T.</title>
    <meta name="description" content="Authenticate your Disney pins with advanced AI image recognition technology" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { width: 100%; height: 100%; font-family: system-ui, -apple-system, sans-serif; }
      #root { width: 100%; height: 100vh; display: flex; justify-content: center; align-items: center; background: linear-gradient(to bottom, #eef2ff, #e0e7ff); }
      .loading { text-align: center; color: #4f46e5; }
    </style>
    <script type="module" crossorigin src="/assets/index-DQwQ6CII.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-DAgQPu_G.css">
  </head>
  <body>
    <div id="root">
      <div class="loading">
        <h1>Disney Pin Authenticator</h1>
        <p>Loading W.A.L.T. interface...</p>
      </div>
    </div>
  </body>
</html>`;
  
  fs.writeFileSync(indexPath, html);
  console.log('Created index.html with proper CSS formatting');
} else {
  // Update existing index.html with better CSS
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // Add inline CSS for proper formatting
  const additionalCSS = `
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
      #root { width: 100%; height: 100vh; }
      .min-h-screen { min-height: 100vh; }
      .flex { display: flex; }
      .items-center { align-items: center; }
      .justify-center { justify-content: center; }
      .text-center { text-align: center; }
    </style>
  </head>`;
  
  html = html.replace('</head>', additionalCSS);
  fs.writeFileSync(indexPath, html);
  console.log('Updated existing index.html with CSS fixes');
}

console.log('CSS formatting fix applied successfully!');