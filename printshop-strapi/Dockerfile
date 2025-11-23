FROM node:20-alpine

WORKDIR /srv/app

# Install build dependencies
RUN apk add --no-cache python3 make g++ bash

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --no-audit --legacy-peer-deps

# Copy application files
COPY . .

# Build TypeScript config
RUN npm run build 2>/dev/null || echo "Build step skipped"

# Expose port
EXPOSE 1337

# Start Strapi in development
CMD ["npm", "run", "develop"]
