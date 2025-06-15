#!/bin/bash

# Railway build script - simplified without CLI dependencies

echo "Starting build process..."

# Install dependencies
npm ci

# Update browserslist data
npx update-browserslist-db@latest

# Build frontend
npm run build

echo "Build complete"