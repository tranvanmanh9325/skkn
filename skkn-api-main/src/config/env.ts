import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5001),

  // Database
  MONGO_URI: z.string().url('MONGO_URI phải là URL hợp lệ'),

  // Redis
  REDIS_URL: z.string().url('REDIS_URL phải là URL hợp lệ'),

  // Auth
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET phải có ít nhất 32 ký tự'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET phải có ít nhất 32 ký tự'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS
  FRONTEND_URL: z.string().url().default('http://localhost:5002'),
});

// parse() sẽ throw lỗi ngay khi app khởi động nếu thiếu/sai config
// → fail fast, tránh lỗi runtime khó debug sau này
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:\n', parsed.error.flatten().fieldErrors);
  process.exit(1); // crash ngay để không chạy với config sai
}

export const env = parsed.data;
