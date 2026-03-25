# ── Build stage ─────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy package manifest and install deps
COPY package.json ./
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client and build NestJS
RUN npx prisma generate
RUN pnpm build

# ── Production stage ───────────────────────
FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app

# Copy everything needed from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001

# Run migrations then start the server
CMD sh -c "npx prisma migrate deploy && node dist/main"
