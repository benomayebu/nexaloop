# ── Build stage ───────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

# Debian slim needs these for bcrypt native compilation + Prisma
RUN apt-get update && apt-get install -y openssl python3 make g++ --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Install deps (package.json + prisma schema first for layer caching)
COPY package.json ./
COPY prisma ./prisma
RUN pnpm install --no-frozen-lockfile
RUN pnpm exec prisma generate

# Copy source and compile
COPY . .
RUN pnpm run build

# ── Production stage ──────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

# OpenSSL is required by Prisma at runtime
RUN apt-get update && apt-get install -y openssl --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Install prod deps + generate Prisma client
COPY package.json ./
COPY prisma ./prisma
RUN apt-get update && apt-get install -y python3 make g++ --no-install-recommends \
    && pnpm install --prod --no-frozen-lockfile \
    && pnpm exec prisma generate \
    && apt-get purge -y python3 make g++ && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Run as non-root
RUN groupadd -r nexaloop && useradd -r -g nexaloop nexaloop \
    && chown -R nexaloop:nexaloop /app
USER nexaloop

EXPOSE 3001

# Attempt migrations (best-effort — already applied from local), then start
CMD ["sh", "-c", "pnpm exec prisma migrate deploy || echo 'Migration skipped (already applied)' && node dist/main"]
