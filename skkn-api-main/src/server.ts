import 'dotenv/config'; // Load .env trước mọi thứ — phải là import đầu tiên
import mongoose from 'mongoose';
import Queue from 'bull';
import { createApp } from './app';
import { env } from './config/env';

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap Function
//
// Tập trung toàn bộ logic khởi động I/O tại đây:
//   1. Kết nối MongoDB
//   2. Khởi tạo Bull Queue (kết nối Redis)
//   3. Start HTTP server
//
// Pattern: async IIFE → lỗi ở bất kỳ bước nào đều được bắt và crash gracefully
// ─────────────────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  // ── 1. Connect MongoDB ──────────────────────────────────────────────────
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }

  // Lắng nghe các sự kiện disconnect để log kịp thời trong production
  mongoose.connection.on('disconnected', () =>
    console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...')
  );
  mongoose.connection.on('error', (err) =>
    console.error('❌ MongoDB error:', err)
  );

  // ── 2. Initialize Bull Queue (Redis) ─────────────────────────────────────
  // Bull tự động duy trì connection pool đến Redis.
  // Chỉ cần khởi tạo queue để xác nhận Redis reachable khi startup.
  const ocrQueue = new Queue('ocr-processing', env.REDIS_URL);

  ocrQueue.on('error', (err) =>
    // Không crash server nếu Redis lỗi — queue sẽ tự retry
    console.error('❌ Bull Queue error:', err)
  );
  ocrQueue.on('ready', () => console.log('✅ Redis / Bull Queue connected'));

  // Export queue để workers và controllers có thể import
  // (trong thực tế nên để trong một module riêng, VD: src/queues/ocr.queue.ts)
  (global as any).__ocrQueue = ocrQueue;

  // ── 3. Start HTTP Server ──────────────────────────────────────────────────
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
  });

  // ── 4. Graceful Shutdown ──────────────────────────────────────────────────
  // Đảm bảo active connections được drain trước khi dừng process.
  // Quan trọng với K8s rolling update và Docker stop (SIGTERM).
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      console.log('  HTTP server closed.');

      try {
        await ocrQueue.close();
        console.log('  Bull Queue closed.');

        await mongoose.connection.close();
        console.log('  MongoDB connection closed.');

        console.log('✅ Graceful shutdown complete.');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
      }
    });

    // Nếu server không close trong 10s, force exit để tránh bị treo
    setTimeout(() => {
      console.error('❌ Shutdown timeout. Forcing exit.');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Bắt lỗi unhandled promise rejection ở top-level (Node 15+ crash theo mặc định)
bootstrap().catch((err) => {
  console.error('❌ Fatal bootstrap error:', err);
  process.exit(1);
});
