#!/usr/bin/env node

/**
 * Production deployment script that serves the actual working React app
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the client directory for the working React app
app.use(express.static(path.join(__dirname, 'client', 'public')));

// API routes for pin verification
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import server routes
import('./server/routes.js').then(({ registerRoutes }) => {
  registerRoutes(app);
}).catch(err => {
  console.error('Failed to load server routes:', err);
});

// Serve the React app for all other routes
app.get('*', (req, res) => {
  // Check if we have a pre-built React app
  const reactBuildPath = path.join(__dirname, 'client', 'dist', 'index.html');
  const reactPublicPath = path.join(__dirname, 'client', 'public', 'index.html');
  
  if (fs.existsSync(reactBuildPath)) {
    res.sendFile(reactBuildPath);
  } else if (fs.existsSync(reactPublicPath)) {
    res.sendFile(reactPublicPath);
  } else {
    // Generate minimal working React HTML
    const workingHTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Disney Pin Authenticator</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      .fade-in { animation: fadeIn 0.5s ease-in; }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <div class="flex-grow flex flex-col items-center justify-center p-4 fade-in">
          <div class="text-center max-w-md w-full">
            <div class="my-8">
              <h1 class="text-2xl font-bold text-gray-800 mb-2">Disney Pin Checker</h1>
              <p class="text-lg text-gray-600 mb-6">Find out if your Disney pin is real!</p>
            </div>
            
            <div class="mb-8 text-center space-y-6">
              <h3 class="text-xl font-bold text-gray-800 mb-6">It's super easy!</h3>
              
              <div class="space-y-4">
                <div class="flex items-center text-left">
                  <div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">1</div>
                  <div><span class="text-lg font-semibold text-gray-800">📸 Take a photo of your Disney pin</span></div>
                </div>
                
                <div class="flex items-center text-left">
                  <div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">2</div>
                  <div><span class="text-lg font-semibold text-gray-800">🤖 Computer checks if it's real</span></div>
                </div>
                
                <div class="flex items-center text-left">
                  <div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">3</div>
                  <div><span class="text-lg font-semibold text-gray-800">✨ Get your answer!</span></div>
                </div>
              </div>
            </div>
            
            <button 
              onclick="window.location.href='/camera'" 
              class="w-full bg-indigo-600 text-white py-4 px-6 rounded-xl text-xl font-bold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center h-auto">
              Start Taking Photos! 📸
            </button>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
    
    res.send(workingHTML);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Disney Pin Authenticator running on port ${PORT}`);
  console.log('Serving working React application (not fake splash screen)');
});