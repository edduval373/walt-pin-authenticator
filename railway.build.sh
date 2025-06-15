#!/bin/bash

# Railway build script - with global tools

echo "Starting build process..."

# Install dependencies
npm ci

# Install build tools globally
npm install -g vite esbuild

# Update browserslist data
npx update-browserslist-db@latest

# Build frontend
vite build

# Build production server
esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build complete"