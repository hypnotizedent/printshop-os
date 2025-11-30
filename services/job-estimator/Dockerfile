# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including dev for TypeScript)
RUN npm ci

# Copy source code (only lib and data, not scripts which have type errors)
COPY lib/ ./lib/
COPY data/ ./data/

# Build TypeScript (use local node_modules binary)
RUN ./node_modules/.bin/tsc

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built files from builder stage
COPY --from=builder /app/build ./build

# Copy data files needed at runtime
COPY --from=builder /app/data ./data

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "build/lib/api-server.js"]
