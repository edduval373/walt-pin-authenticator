#!/bin/bash

echo "🚀 Setting up Disney Pin Authenticator Mobile App..."
echo

# Clean any existing installations
echo "📦 Cleaning previous installations..."
rm -rf node_modules package-lock.json

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Start Expo
echo "🎯 Starting Expo development server..."
npx expo start

echo "✅ Mobile app setup complete!"
echo
echo "📱 Your Disney Pin Authenticator mobile app is now running!"
echo "   - Scan the QR code with Expo Go app on your phone"
echo "   - Or press 'w' to open in web browser"
echo "   - Or press 'i' for iOS simulator"
echo "   - Or press 'a' for Android emulator"