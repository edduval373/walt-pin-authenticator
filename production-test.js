#!/usr/bin/env node

/**
 * Production Test Server - Isolated from development environment
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Build files check
const buildPath = path.join(__dirname, 'client/dist');
const indexPath = path.join(buildPath, 'index.html');

console.log('=== PRODUCTION TEST SERVER ===');
console.log('Build directory exists:', fs.existsSync(buildPath));
console.log('Index.html exists:', fs.existsSync(indexPath));
console.log('Build path:', buildPath);

if (fs.existsSync(buildPath)) {
  const files = fs.readdirSync(buildPath);
  console.log('Build directory contents:', files);
}

if (fs.existsSync(path.join(buildPath, 'assets'))) {
  const assetFiles = fs.readdirSync(path.join(buildPath, 'assets'));
  console.log('Asset files:', assetFiles);
}

// Configure middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Serve static assets with detailed logging
app.use('/assets', (req, res, next) => {
  console.log('Asset request:', req.path);
  const filePath = path.join(__dirname, 'client/dist/assets', req.path);
  console.log('Looking for file:', filePath);
  console.log('File exists:', fs.existsSync(filePath));
  next();
}, express.static(path.join(__dirname, 'client/dist/assets'), {
  setHeaders: (res, filePath) => {
    console.log('Serving:', filePath);
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Health check
app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    buildFiles: fs.existsSync(indexPath)
  });
});

// Serve HTML for all other routes
app.get('*', (req, res) => {
  console.log('HTML request for:', req.path);
  
  if (!fs.existsSync(indexPath)) {
    console.error('Build files missing at:', indexPath);
    return res.status(500).send('Build files not found');
  }
  
  const htmlContent = fs.readFileSync(indexPath, 'utf8');
  console.log('HTML length:', htmlContent.length);
  console.log('Contains JS reference:', htmlContent.includes('index-DQwQ6CII.js'));
  console.log('Contains CSS reference:', htmlContent.includes('index-DAgQPu_G.css'));
  
  res.setHeader('Content-Type', 'text/html');
  res.send(htmlContent);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=== PRODUCTION TEST SERVER STARTED ===`);
  console.log(`Port: ${PORT}`);
  console.log(`Access: http://localhost:${PORT}`);
  console.log(`Build Files: ${fs.existsSync(indexPath) ? 'FOUND' : 'MISSING'}`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}, shutting down...`);
  server.close(() => {
    console.log('Production test server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));