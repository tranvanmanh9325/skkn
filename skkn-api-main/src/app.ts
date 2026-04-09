import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env';
import authRouter from './routes/auth.routes';
import dossierRouter from './routes/dossier.routes';
import userRouter from './routes/user.routes';

// ─────────────────────────────────────────────────────────────────────────────
// App Factory
//
// Tách Express app khỏi server listener (server.ts) để:
//   1. Có thể import app trong unit/integration tests mà không start server
//   2. Giữ server.ts chỉ lo khởi động I/O (DB, Redis, listen)
// ─────────────────────────────────────────────────────────────────────────────

export function createApp(): Application {
  const app = express();

  // ── Global Middlewares ────────────────────────────────────────────────────

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    })
  );

  // Parse JSON request bodies (giới hạn 10mb để tránh payload attack)
  app.use(express.json({ limit: '10mb' }));

  // Trust first proxy — cần để req.ip trả về IP thật khi chạy sau nginx/load-balancer
  app.set('trust proxy', 1);

  // ── Health Check ─────────────────────────────────────────────────────────
  // Endpoint đơn giản để Docker healthcheck / K8s liveness probe
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── API Routes ────────────────────────────────────────────────────────────
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/dossiers', dossierRouter);
  app.use('/api/v1/users', userRouter);

  // ── 404 Handler ───────────────────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, message: 'Route not found.' });
  });

  // ── Global Error Handler ─────────────────────────────────────────────────
  // Phải có đủ 4 tham số để Express nhận ra đây là error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[UnhandledError]', err);
    res.status(500).json({
      success: false,
      message: env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
    });
  });

  return app;
}
