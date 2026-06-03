# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app

# Install deps first (layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Run Prisma generate
RUN npx prisma generate

# ─── Stage 2: Production image ────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Copy from build stage
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app .

# Create uploads directory
RUN mkdir -p uploads

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "server.js"]
