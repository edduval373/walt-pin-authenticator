#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Disney Pin Authenticator Mobile Test Setup');
console.log('==========================================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
    console.error('❌ Please run this from the mobile-app directory');
    process.exit(1);
}

console.log('📱 Instructions to test on your phone:');
console.log('1. Download "Expo Go" app from App Store or Google Play');
console.log('2. Make sure your phone and computer are on the same WiFi');
console.log('3. When the QR code appears, scan it with Expo Go app\n');

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
    console.log('📦 Installing dependencies...');
    exec('npm install --legacy-peer-deps', (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Installation failed. Try running: npm install --force');
            return;
        }
        startExpo();
    });
} else {
    startExpo();
}

function startExpo() {
    console.log('🎬 Starting Expo development server...\n');
    
    // Start expo
    const expo = exec('npx expo start --tunnel', (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Failed to start Expo. Make sure you have Node.js installed.');
            console.log('Try: npm install -g @expo/cli');
            return;
        }
    });

    expo.stdout.on('data', (data) => {
        console.log(data);
    });

    expo.stderr.on('data', (data) => {
        console.log(data);
    });
}