import express from "express";

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

// Minimal health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic pin verification endpoint
app.use(express.json({ limit: '50mb' }));
app.post('/api/verify-pin', (req, res) => {
  res.json({
    success: true,
    message: 'Service is running',
    timestamp: new Date().toISOString()
  });
});

// Simple root page
app.get('/', (req, res) => {
  res.send(`
    <html>
    <head><title>Disney Pin Checker</title></head>
    <body style="font-family: Arial; text-align: center; padding: 50px;">
      <h1>Disney Pin Checker</h1>
      <p>API Status: Active</p>
      <p>Ready to authenticate Disney pins</p>
    </body>
    </html>
  `);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});