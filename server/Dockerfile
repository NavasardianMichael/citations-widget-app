# Multi-stage Dockerfile for Citations Widget API (npm)
# Build context must be the repo root (see docker-compose.prod.yml).

# -----------------------------------------------------------------------------
# Stage 1: Builder — install deps, generate Prisma, compile TypeScript
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++ openssl

WORKDIR /app

# Shared contract package (file: dependency for server)
COPY shared/package.json shared/package-lock.json ./shared/
COPY shared/tsconfig.json ./shared/
COPY shared/src ./shared/src
WORKDIR /app/shared
RUN npm ci && npm run build

WORKDIR /app/server
COPY server/package.json server/package-lock.json server/postinstall.cjs ./
COPY server/prisma ./prisma

# --install-links copies file: deps into node_modules (no symlinks) for the runtime image.
RUN npm ci --install-links

COPY server/tsconfig.json ./
COPY server/src ./src
COPY server/data/seed ./data/seed

RUN npx prisma generate && npx tsc
# --install-links again: plain `npm prune` forgets the earlier flag and re-symlinks
# file: deps to ../shared, which doesn't exist in the runtime stage.
RUN npm prune --omit=dev --install-links

# -----------------------------------------------------------------------------
# Stage 2: Production runtime
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=9003

RUN apk add --no-cache openssl

WORKDIR /app

COPY --from=builder /app/server/package.json ./
COPY --from=builder /app/server/package-lock.json ./
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/prisma ./prisma
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/data/seed ./data/seed

COPY server/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

RUN addgroup -g 1001 -S nodejs && \
    adduser -S citations -u 1001 -G nodejs

USER citations

EXPOSE 9003

# First boot may seed thousands of rows before /api/health answers.
HEALTHCHECK --interval=30s --timeout=5s --start-period=180s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:9003/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["./entrypoint.sh"]
