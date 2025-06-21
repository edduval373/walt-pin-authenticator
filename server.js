const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from client build
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API endpoint for pin analysis
app.post('/api/analyze', async (req, res) => {
  try {
    const { frontImage, backImage, angledImage } = req.body;
    
    if (!frontImage) {
      return res.status(400).json({ success: false, message: 'Front image is required' });
    }

    // Generate session ID
    const sessionId = Date.now().toString();
    
    // Prepare data for master API
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('frontImageData', frontImage.replace(/^data:image\/[a-z]+;base64,/, ''));
    if (backImage) formData.append('backImageData', backImage.replace(/^data:image\/[a-z]+;base64,/, ''));
    if (angledImage) formData.append('angledImageData', angledImage.replace(/^data:image\/[a-z]+;base64,/, ''));

    // Call master API
    const response = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.MOBILE_API_KEY || 'pim_0w3nfrt5ahgc'
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    
    // Return standardized response
    res.json({
      success: true,
      pinId: result.sessionId || sessionId,
      sessionId: result.sessionId || sessionId,
      authentic: result.authentic || false,
      authenticityRating: result.authenticityRating || 0,
      analysis: result.analysis || 'No analysis available',
      identification: result.identification || result.characters || 'No identification available',
      pricing: result.pricing || 'No pricing information available',
      message: result.message || 'Analysis completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Analysis failed: ' + error.message
    });
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});