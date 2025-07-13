#!/usr/bin/env node

/**
 * Simple Railway deployment script - bypasses complex configurations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Railway Simple Deploy');

// Create a simple server that just works
const simpleServer = `
const express = require('express');
const path = require('path');
const app = express();

// Health check FIRST
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Catch all for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Server running on port ' + port);
});
`;

// Write simple server
fs.writeFileSync('simple-server.js', simpleServer);

// Update package.json to use simple server
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts.start = 'node simple-server.js';
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

console.log('✅ Created simple Railway deployment');
console.log('Server: simple-server.js');
console.log('Build will copy client files to public/');