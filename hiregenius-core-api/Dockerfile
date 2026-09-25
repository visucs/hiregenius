# Stage 1: Dependencies & Build
FROM node:20.11.1-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Stage 2: Production Runtime
FROM node:20.11.1-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/src ./src
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/knexfile.js ./knexfile.js

# Switch to non-root node user
USER node
ENV PORT=4000
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "src/server.js"]
