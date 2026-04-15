# ── Build stage ───────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Enable corepack so pnpm is available without a global install
RUN corepack enable && corepack prepare pnpm@9 --activate

# Install dependencies
COPY package.json ./
RUN pnpm install --no-frozen-lockfile

# Copy source, generate Prisma client, compile TypeScript
COPY . .
RUN pnpm exec prisma generate
RUN pnpm build

# ── Production stage ───────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

# Install prod dependencies only
COPY package.json ./
RUN pnpm install --prod --no-frozen-lockfile

# Copy compiled output and Prisma artefacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copy generated Prisma client (avoids re-running prisma generate)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Run as non-root for security
RUN addgroup -S nexaloop && adduser -S nexaloop -G nexaloop
USER nexaloop

EXPOSE 3001

# Run pending migrations then start the server
CMD sh -c "npx prisma migrate deploy && node dist/main"
