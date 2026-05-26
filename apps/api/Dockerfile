# ── Build stage ───────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# bcrypt requires native compilation — install build tools
RUN apk add --no-cache python3 make g++

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Install dependencies (copy package.json first for layer caching)
COPY package.json ./
COPY prisma ./prisma
RUN pnpm install --no-frozen-lockfile

# Generate Prisma client
RUN pnpm exec prisma generate

# Copy source and compile TypeScript
COPY . .
RUN pnpm run build

# ── Production stage ──────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# bcrypt native module needs libstdc++ at runtime
RUN apk add --no-cache libstdc++

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Install prod dependencies only
COPY package.json ./
COPY prisma ./prisma
RUN apk add --no-cache python3 make g++ \
    && pnpm install --prod --no-frozen-lockfile \
    && apk del python3 make g++

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy generated Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Run as non-root for security
RUN addgroup -S nexaloop && adduser -S nexaloop -G nexaloop \
    && chown -R nexaloop:nexaloop /app
USER nexaloop

EXPOSE 3001

# Run pending migrations then start the server
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/main"]
