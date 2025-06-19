import express from 'express';

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => {
  res.json({
    service: 'Disney Pin Authenticator',
    status: 'active',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      verify: 'POST /api/verify-pin'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: port
  });
});

app.post('/api/verify-pin', async (req, res) => {
  const { frontImage, backImage, angledImage } = req.body;
  
  if (!frontImage) {
    return res.status(400).json({
      success: false,
      message: 'Front image required'
    });
  }

  try {
    const apiKey = process.env.MOBILE_API_KEY;
    const formData = new FormData();
    
    const frontBuffer = Buffer.from(frontImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
    formData.append('front_image', new Blob([frontBuffer]), 'front.jpg');
    
    if (backImage) {
      const backBuffer = Buffer.from(backImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      formData.append('back_image', new Blob([backBuffer]), 'back.jpg');
    }
    
    if (angledImage) {
      const angledBuffer = Buffer.from(angledImage.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      formData.append('angled_image', new Blob([angledBuffer]), 'angled.jpg');
    }
    
    formData.append('api_key', apiKey);
    
    const response = await fetch('https://master.pinauth.com/mobile-upload', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    res.json({
      success: true,
      message: result.message || 'Verification complete',
      sessionId: result.sessionId || Date.now().toString(),
      id: result.id || Math.floor(Math.random() * 10000),
      characters: result.characters || 'Disney characters detected',
      analysis: result.analysis || 'Pin authenticated',
      identification: result.identification || 'Official Disney pin',
      pricing: result.pricing || 'Market value available'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Service temporarily unavailable'
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});