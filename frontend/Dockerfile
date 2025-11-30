# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for Vite environment variables
# These get baked into the static bundle at build time
ARG VITE_API_URL=http://localhost:3001
ARG VITE_STRAPI_URL=http://localhost:1337
ARG VITE_PRICING_URL=http://localhost:3004
ARG VITE_WS_URL=ws://localhost:3004

# Set as environment variables for the build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_STRAPI_URL=$VITE_STRAPI_URL
ENV VITE_PRICING_URL=$VITE_PRICING_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build application (VITE_ vars are baked in during build)
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install serve to run the production build, and wget for health checks
RUN npm install -g serve && apk add --no-cache wget

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check using wget (compatible with Alpine)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start server - bind to 0.0.0.0 for Docker network access (required for Cloudflare Tunnel)
CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:3000"]
