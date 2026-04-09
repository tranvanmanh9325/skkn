import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack (Next 16 dev mode) đôi khi cố watch các anonymous volume paths
  // (/app/node_modules, /app/.next) bên trong Docker và báo "illegal path".
  // outputFileTracingRoot neo file-system watcher vào /app — loại bỏ warning này.
  outputFileTracingRoot: "/app",
};

export default nextConfig;
