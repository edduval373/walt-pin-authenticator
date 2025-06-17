import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// Add logging for debugging deployment
console.log('Starting Disney Pin Authentication App...');
console.log('Current directory:', __dirname);
console.log('Looking for dist directory at:', path.join(__dirname, 'dist'));

// Add JSON body parser middleware
app.use(express.json({ limit: '50mb' }));

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Add API proxy endpoints for direct master server connection
app.post('/api/proxy/mobile-upload', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VITE_MOBILE_API_KEY || 'pim_0w3nfrt5ahgc'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Proxy request failed',
      error: error.message
    });
  }
});

app.get('/api/proxy/health', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://master.pinauth.com/health');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Handle all routes by serving index.html (for SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Disney Pin Authentication App serving static files on port ${port}`);
  console.log(`Connecting directly to https://master.pinauth.com/mobile-upload`);
});