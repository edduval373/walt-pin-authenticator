#!/bin/bash
set -e

echo "Building for Railway deployment..."

# Use the production vite config that works with Railway's Node.js environment
npx vite build --config vite.config.prod.js

# Copy the production server file
cp server/production.js dist/index.js

echo "Build complete!"