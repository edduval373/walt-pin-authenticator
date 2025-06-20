FROM node:18-slim

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy minimal required files
COPY server/minimal-railway.ts ./server/
COPY tsconfig.json ./

# Install tsx globally for faster startup
RUN npm install -g tsx

# Expose port
EXPOSE 5000

# Simple startup command
CMD ["tsx", "server/minimal-railway.ts"]