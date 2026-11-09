# Brand Sentinel Production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root & workspaces manifests
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci

# Copy full source
COPY . .

# Build both server and client
RUN npm run build

# Seed baseline enterprise truth database
RUN npm run seed

# Production Image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy built artifacts and database
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/server/src/db/schema.sql ./server/src/db/schema.sql
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/brand_sentinel.db ./brand_sentinel.db

EXPOSE 5000

CMD ["node", "server/dist/index.js"]
