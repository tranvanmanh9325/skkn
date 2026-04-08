# =============================================================================
# STAGE 1 — base
# Cài Node 23 + các system dependency cho Tesseract OCR vào một lớp chung
# để cả build stage và final stage đều kế thừa nhất quán.
# =============================================================================
FROM node:23-bookworm-slim AS base

# Tesseract yêu cầu một số thư viện hệ thống; cài một lần duy nhất ở đây.
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libtesseract-dev \
    # Gói ngôn ngữ tiếng Anh (mặc định); thêm tesseract-ocr-vie nếu cần OCR tiếng Việt
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# =============================================================================
# STAGE 2 — builder
# Cài toàn bộ dependencies (bao gồm devDependencies) rồi biên dịch TypeScript.
# =============================================================================
FROM base AS builder

# Sao chép package files trước để tận dụng Docker layer cache.
# Nếu package.json không đổi, lớp npm ci này sẽ được cache lại.
COPY package.json package-lock.json ./
RUN npm ci

# Sao chép toàn bộ source và chạy TypeScript compiler
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# =============================================================================
# STAGE 3 — development
# Cài toàn bộ deps (bao gồm devDependencies), KHÔNG build TS.
# Source code được mount vào từ host qua volume trong docker-compose,
# nodemon + ts-node sẽ watch và reload khi file thay đổi.
# =============================================================================
FROM base AS development

ENV NODE_ENV=development

# Cài toàn bộ deps (kể cả devDependencies: nodemon, ts-node, typescript...)
COPY package.json package-lock.json ./
RUN npm ci

EXPOSE 5001

# nodemon sẽ được chạy qua npm run dev (định nghĩa trong package.json)
CMD ["npm", "run", "dev"]

# =============================================================================
# STAGE 4 — production (final image)
# Chỉ lấy những thứ cần thiết để chạy: dist/, node_modules production only,
# và các Tesseract binary đã được cài từ stage base.
# =============================================================================
FROM base AS production

ENV NODE_ENV=production

# Chỉ cài production dependencies để loại bỏ devDependencies khỏi image
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Lấy compiled output từ builder stage
COPY --from=builder /app/dist ./dist

# Chạy dưới user non-root để giảm attack surface (best practice Docker security)
USER node

EXPOSE 5001

CMD ["node", "dist/server.js"]
