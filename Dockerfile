FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies for production build
RUN npm ci

# Copy application files
COPY . .

# Build the React frontend
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the production server directly
CMD ["node", "start.js"]