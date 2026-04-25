import express from "express";
import http from "http";
import path from "path";
import cors from "cors";
import mongoose from "mongoose";
import { WebSocketServer } from "ws";
import Bull from "bull";
import authRoutes from "./routes/authRoutes";
import recordRoutes from "./routes/recordRoutes";
import recordTypeRoutes from "./routes/recordTypeRoutes";
import unitTypeRoutes from "./routes/unitTypeRoutes";
import unitRoutes from "./routes/unitRoutes";
import teamRoutes from "./routes/teamRoutes";
import subjectRoutes from "./routes/subjectRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import reportRoutes from "./routes/reportRoutes";

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
// Allow both the browser-facing origin (localhost) and the Docker-internal
// hostname. The browser always uses localhost; container-to-container calls
// use the service name. FRONTEND_URL in .env can add extra origins at runtime.
const ALLOWED_ORIGINS = [
  "http://localhost:5002",
  "http://frontend:5002",
  process.env.FRONTEND_URL,
].filter((o): o is string => Boolean(o));

app.use(
  cors({
    origin: (requestOrigin, callback) => {
      // Allow server-to-server calls (no Origin header) and listed origins
      if (!requestOrigin || ALLOWED_ORIGINS.includes(requestOrigin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${requestOrigin}' not allowed`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
// Serve uploaded attachments as static assets; path is relative to CWD (project root)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/record-types", recordTypeRoutes);
app.use("/api/unit-types", unitTypeRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/reports", reportRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ── HTTP & WebSocket Server ───────────────────────────────────────────────────
const server = http.createServer(app);

const wss = new WebSocketServer({ server });

wss.on("connection", (socket) => {
  console.log("[WS] Client connected");

  socket.on("message", (data) => {
    console.log(`[WS] Received: ${data}`);
    // Echo back as a basic demonstration; replace with real handlers
    socket.send(JSON.stringify({ event: "echo", payload: data.toString() }));
  });

  socket.on("close", () => console.log("[WS] Client disconnected"));
});

// ── Bull Queue ────────────────────────────────────────────────────────────────
// Using a factory so additional queues can be added consistently
const createQueue = (name: string) =>
  new Bull(name, {
    redis: process.env.REDIS_URL || "redis://localhost:6379",
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });

export const defaultQueue = createQueue("default");

defaultQueue.process(async (job) => {
  console.log(`[Queue] Processing job ${job.id}:`, job.data);
  // Placeholder processor — replace with real task handlers
});

defaultQueue.on("failed", (job, err) => {
  console.error(`[Queue] Job ${job.id} failed:`, err.message);
});

// ── MongoDB Connection & Server Bootstrap ─────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/skkn";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("[MongoDB] Connected to", MONGO_URI);

    server.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[MongoDB] Connection failed:", err.message);
    process.exit(1);
  });

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
const shutdown = async () => {
  console.log("\n[Server] Shutting down gracefully…");
  await defaultQueue.close();
  await mongoose.disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export default app;
