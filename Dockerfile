# ---- Build stage ----
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build.
COPY . .
RUN npm run build

# ---- Runtime stage (uses Next.js standalone output) ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy the self-contained standalone bundle, plus the static assets and public
# files it references (these are NOT included in `.next/standalone` by default).
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Upstream credentials are supplied at runtime (not baked into the image).
CMD ["node", "server.js"]
