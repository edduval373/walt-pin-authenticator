#!/bin/bash

# Build script for Railway deployment
set -e

echo "Starting build process..."

# Update browserslist
echo "Updating browserslist..."
npx update-browserslist-db@latest

# Build frontend
echo "Building frontend..."
npx vite build

# Build server
echo "Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build complete successfully!"