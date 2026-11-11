# ==========================================
# Stage 1: Builder (Cài đặt & Build Next.js)
# ==========================================
FROM node:22-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Nhận biến môi trường lúc build cho Frontend Next.js
ARG NEXT_PUBLIC_API_URL=http://localhost:3600
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=""
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build
RUN npm prune --omit=dev

# ==========================================
# Stage 2: Runner (Môi trường Production)
# ==========================================
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN groupadd -r nextjs && useradd -r -g nextjs nextjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

RUN chown -R nextjs:nextjs /app
USER nextjs

EXPOSE 3000

CMD ["npx", "next", "start", "-p", "3000"]

