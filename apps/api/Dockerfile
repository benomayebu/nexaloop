# ── Build stage ───────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# bcrypt requires native compilation on Alpine
RUN apk add --no-cache python3 make g++

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Install dependencies (copy package.json first for layer caching)
COPY package.json ./
COPY prisma ./prisma
RUN pnpm install --no-frozen-lockfile

# Generate Prisma client and compile TypeScript
RUN pnpm exec prisma generate
COPY . .
RUN pnpm run build

# ── Production stage ──────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Install prod deps and generate Prisma client in one layer
COPY package.json ./
COPY prisma ./prisma
RUN pnpm install --prod --no-frozen-lockfile \
    && pnpm exec prisma generate \
    && apk del python3 make g++

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Run as non-root for security
RUN addgroup -S nexaloop && adduser -S nexaloop -G nexaloop \
    && chown -R nexaloop:nexaloop /app
USER nexaloop

EXPOSE 3001

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/main"]
