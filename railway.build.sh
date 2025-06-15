#!/bin/bash

# Railway build script - optimized for deployment

echo "Starting build process..."

# Install dependencies
npm ci

# Update browserslist data
npx update-browserslist-db@latest

# Build frontend using npx to ensure vite is available
npx vite build

# Build server using npx
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build complete"