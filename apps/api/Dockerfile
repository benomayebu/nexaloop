# ── Build stage ───────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y openssl python3 make g++ --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY package.json ./
COPY prisma ./prisma
RUN pnpm install --no-frozen-lockfile
RUN pnpm exec prisma generate

COPY . .
RUN pnpm run build

# ── Production stage ──────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

# OpenSSL for Prisma + build tools for bcrypt native module
RUN apt-get update && apt-get install -y openssl python3 make g++ --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY package.json ./
COPY prisma ./prisma
RUN pnpm install --prod --no-frozen-lockfile
RUN pnpm exec prisma generate

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3001

# Run migrations then start the server
CMD npx prisma migrate deploy || true && node dist/main
