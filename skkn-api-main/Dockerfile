# --- Stage 1: Build ---
FROM node:23-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# --- Stage 2: Production ---
FROM node:23-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["npm", "start"]
