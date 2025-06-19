FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy application files
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port (Railway will set PORT dynamically)
EXPOSE 5000

# Start the production server using proven configuration
CMD ["node", "start.js"]