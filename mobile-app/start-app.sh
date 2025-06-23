#!/bin/bash

echo "🚀 Starting Disney Pin Authenticator Mobile App"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js from https://nodejs.org"
    exit 1
fi

# Check if npx is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx is not available. Please update Node.js to the latest version"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        echo "Try running: npm install --legacy-peer-deps --force"
        exit 1
    fi
fi

echo "✅ Dependencies ready"

# Start Expo development server
echo "🎬 Starting development server..."
echo ""
echo "📱 Instructions:"
echo "1. Download 'Expo Go' app on your phone"
echo "2. Scan the QR code that appears below"
echo "3. Your app will open on your phone!"
echo ""

npx expo start --clear