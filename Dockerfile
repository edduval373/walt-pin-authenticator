# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Install vite and esbuild globally to ensure they're available
RUN npm install -g vite@latest esbuild@latest

# Build frontend with global vite
RUN vite build

# Build production server with global esbuild
RUN esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the production server
CMD ["node", "dist/production.js"]