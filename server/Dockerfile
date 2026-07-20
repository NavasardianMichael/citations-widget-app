# Multi-stage Dockerfile for Citations Widget API (npm)

# -----------------------------------------------------------------------------
# Stage 1: Builder — install deps, generate Prisma, compile TypeScript
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++ openssl

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate && npx tsc
RUN npm prune --omit=dev

# -----------------------------------------------------------------------------
# Stage 2: Production runtime
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=9003

RUN apk add --no-cache openssl

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

RUN addgroup -g 1001 -S nodejs && \
    adduser -S citations -u 1001 -G nodejs

USER citations

EXPOSE 9003

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:9003/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["./entrypoint.sh"]
