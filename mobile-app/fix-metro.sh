#!/bin/bash

echo "🔧 Fixing Metro bundler issue..."

# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Install dependencies with force flag
npm install --legacy-peer-deps --force

# Try to start expo again
echo "🚀 Starting Expo..."
npx expo start

echo "✅ Metro fix complete!"