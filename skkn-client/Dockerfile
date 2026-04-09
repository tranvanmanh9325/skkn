# =============================================================================
# Stage: development
# Mục đích: Chạy Next.js trong chế độ dev với hot-reload.
# Không dùng multi-stage ở đây vì đây là môi trường dev, không cần tối ưu size.
# =============================================================================
FROM node:20-alpine

# Thiết lập working directory bên trong container
WORKDIR /app

# Copy package manifests TRƯỚC khi copy source code.
# Tận dụng Docker layer cache: nếu package.json không đổi,
# bước `npm install` sẽ được cache lại và không chạy lại.
COPY package.json package-lock.json ./

# Cài đặt toàn bộ dependencies (bao gồm devDependencies cho dev mode)
RUN npm install

# Copy toàn bộ source code vào container.
# Trong docker-compose, bind mount sẽ override layer này — COPY vẫn cần
# để image tự đứng được (standalone usage) nếu cần.
COPY . .

# Expose port mà Next.js dev server lắng nghe
EXPOSE 3000

# Lệnh mặc định: khởi động Next.js dev server
CMD ["npm", "run", "dev"]
