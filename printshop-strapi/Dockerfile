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

# Skip build - Strapi will build admin on first run in develop mode
# For production, pre-build locally and copy the build folder

# Expose port
EXPOSE 1337

# Start Strapi in development (auto-builds admin panel)
CMD ["npm", "run", "develop"]
