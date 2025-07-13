
/**
 * Minimal Railway server - serves static files only
 */
const express = require('express');
const path = require('path');
const app = express();

// Serve static files from client/dist
app.use(express.static(path.join(__dirname, 'client/dist')));

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Disney Pin Authenticator running on port ${PORT}`);
});
