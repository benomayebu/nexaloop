# ── Build stage ───────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json ./
RUN pnpm install --no-frozen-lockfile

COPY . .

# Build args for env vars needed at build time
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN pnpm build

# ── Production stage ───────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Run as non-root
RUN addgroup -S nexaloop && adduser -S nexaloop -G nexaloop

# Copy standalone output (next.config.js output: 'standalone')
COPY --from=builder --chown=nexaloop:nexaloop /app/.next/standalone ./
COPY --from=builder --chown=nexaloop:nexaloop /app/.next/static ./.next/static
COPY --from=builder --chown=nexaloop:nexaloop /app/public ./public

USER nexaloop

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
