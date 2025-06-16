#!/bin/bash
set -e

echo "Building for Railway deployment..."

# Use the production vite config that works with Railway's Node.js environment
npx vite build --config vite.config.prod.js

# Build the server
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build complete!"