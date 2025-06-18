const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.static('client'));

// Mobile upload endpoint
app.post('/mobile-upload', async (req, res) => {
  try {
    const { pinId, frontImageBase64, backImageBase64, angledImageBase64 } = req.body;
    
    // Forward to master server
    const response = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VITE_MOBILE_API_KEY || 'pim_0w3nfrt5ahgc'
      },
      body: JSON.stringify({
        pinId: pinId || 1,
        frontImageBase64,
        backImageBase64,
        angledImageBase64
      })
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});