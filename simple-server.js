/**
 * Simplified Disney Pin Authenticator Server for Railway
 * Minimal dependencies, maximum reliability
 */

import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(join(__dirname, 'client/dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/healthz', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API endpoint for pin analysis
app.post('/api/analyze-pin', async (req, res) => {
  try {
    const { frontImage, backImage, angledImage } = req.body;
    
    if (!frontImage) {
      return res.status(400).json({ 
        success: false, 
        message: 'Front image is required' 
      });
    }

    // Mock analysis response for now
    const mockResult = {
      success: true,
      message: 'Pin analysis completed successfully',
      authentic: true,
      authenticityRating: 92,
      analysis: 'This appears to be an authentic Disney pin based on material composition and design details.',
      identification: 'Disney Mickey Mouse Classic Series Pin',
      pricing: '$25-35 USD',
      sessionId: `session_${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    res.json(mockResult);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Analysis failed' 
    });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  const indexPath = join(__dirname, 'client/dist/index.html');
  
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application not found');
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connected successfully');
    
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Disney Pin Authenticator running on port ${port}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();