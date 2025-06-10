#!/bin/bash

echo "Setting up fresh W.A.L.T. repository..."

# Remove any existing git configuration
rm -rf .git

# Initialize fresh git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: W.A.L.T. Disney Pin Authenticator with feedback system"

# Set main branch
git branch -M main

echo ""
echo "Repository initialized successfully!"
echo ""
echo "Next steps:"
echo "1. Create a new repository on GitHub named 'walt-pin-authenticator'"
echo "2. Run: git remote add origin https://github.com/YOUR_USERNAME/walt-pin-authenticator.git"
echo "3. Run: git push -u origin main"
echo ""
echo "Then deploy to Railway by connecting your GitHub repository."