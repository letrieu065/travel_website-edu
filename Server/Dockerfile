# ==========================================
# Stage 1: Builder (Cài đặt & Biên dịch TS)
# ==========================================
FROM node:22-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files và Prisma schema trước để tận dụng Docker cache
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma7.config.ts ./

RUN npm ci

# Copy toàn bộ mã nguồn Backend
COPY server.ts tsconfig.json tsconfig.build.json ./
COPY src ./src

# Generate Prisma Client (truyền dummy DIRECT_URL trong lúc build để prisma7.config.ts không báo thiếu env)
RUN DIRECT_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Biên dịch TypeScript sang thư mục ./dist
RUN npx tsc -p tsconfig.build.json

# Xóa devDependencies để giảm dung lượng image cuối cùng
RUN npm prune --omit=dev

# ==========================================
# Stage 2: Runner (Môi trường Production)
# ==========================================
FROM node:22-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3600

# Tạo user non-root để tăng tính bảo mật
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma7.config.ts ./prisma7.config.ts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3600

CMD ["node", "dist/server.js"]

