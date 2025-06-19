#!/bin/bash

# Railway deployment script that ensures correct server startup
# This bypasses Railway's default static file serving behavior

echo "Disney Pin Authenticator - Railway Production Deployment"
echo "Environment: $NODE_ENV"
echo "Port: $PORT"

# Check if the main server file exists
if [ -f "index.js" ]; then
    echo "Starting main production server..."
    exec node index.js
elif [ -f "serve.js" ]; then
    echo "Starting server wrapper..."
    exec node serve.js
else
    echo "Error: No server file found"
    exit 1
fi