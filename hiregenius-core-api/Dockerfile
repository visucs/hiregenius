# ==============================================================================
# Stage 1: Install production dependencies
# ==============================================================================
FROM node:20.18.0-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ==============================================================================
# Stage 2: Production Runtime
# ==============================================================================
FROM node:20.18.0-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy production dependencies from deps stage
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules

# Copy application source and migration files
COPY src ./src
COPY migrations ./migrations
COPY knexfile.js ./knexfile.js

# Ensure non-root node user owns application files
RUN chown -R node:node /app

# Run as non-root user
USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "src/server.js"]
