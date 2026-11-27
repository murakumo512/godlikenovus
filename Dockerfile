# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Build Next.js application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production runner
FROM base AS runner
ENV NODE_ENV=production
ENV TZ=Asia/Jakarta
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

WORKDIR /app
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data
COPY --from=builder /app/next.config.ts ./next.config.ts

RUN mkdir -p /app/data /app/public/uploads

EXPOSE 8080
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "8080"]
