#!/bin/bash

# Railway build script with optimizations to prevent deployment warnings

echo "Starting optimized build process..."

# Update browserslist data
npx update-browserslist-db@latest

# Build with production config and optimizations
vite build --config vite.config.prod.js --mode production

# Build server
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify

echo "Build complete - optimized for Railway deployment"