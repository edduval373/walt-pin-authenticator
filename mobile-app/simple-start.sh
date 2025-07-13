#!/bin/bash

echo "🚀 Starting Disney Pin Authenticator Mobile App (Native Mode)"

# Try to start expo in native mode (bypasses web dependencies)
echo "Starting Expo for mobile devices..."
npx expo start --no-web

echo "✅ Mobile app started!"
echo "📱 Scan the QR code with Expo Go app on your phone"
echo "   Download Expo Go from:"
echo "   - iOS: App Store"
echo "   - Android: Play Store"