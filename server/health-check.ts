// Standalone health check script for Railway
import express from 'express';

const app = express();

// Immediate health check - no database dependencies
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Disney Pin Authenticator',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: process.env.PORT || '5000',
    env: process.env.NODE_ENV || 'production'
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Disney Pin Authenticator',
    timestamp: new Date().toISOString()
  });
});

const port = parseInt(process.env.PORT || '5000', 10);
app.listen(port, '0.0.0.0', () => {
  console.log(`Health check server running on port ${port}`);
});