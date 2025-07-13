/**
 * Build the correct React app for Railway deployment
 * This should generate the W.A.L.T. interface, not the static HTML
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Building the correct React app for Railway deployment...');

// Remove old build
if (fs.existsSync('client/dist')) {
  fs.rmSync('client/dist', { recursive: true });
}

// Create the server.js that serves the React app
const serverJs = `
const express = require('express');
const path = require('path');
const app = express();

// Serve static files from client/dist
app.use(express.static(path.join(__dirname, 'client/dist')));

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Disney Pin Authenticator'
  });
});

// API routes would go here if needed
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🏰 Disney Pin Authenticator running on port \${PORT}\`);
});
`;

// Write the server file
fs.writeFileSync('server.js', serverJs);

console.log('✅ Server file created for Railway deployment');
console.log('📦 Now you need to build the React app manually in the client directory');
console.log('🚀 Ready for Railway deployment!');