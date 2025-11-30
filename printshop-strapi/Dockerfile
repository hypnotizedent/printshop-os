FROM node:20-alpine

WORKDIR /srv/app

# Install build dependencies and wget for health checks
RUN apk add --no-cache python3 make g++ bash wget

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

# Health check - Strapi returns 302 on root (redirect to admin), which is normal
HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=5 \
  CMD wget --no-verbose --tries=1 -O /dev/null http://localhost:1337 || exit 1

# Start Strapi in development (auto-builds admin panel)
CMD ["npm", "run", "develop"]
