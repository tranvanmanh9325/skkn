import axios from "axios";

// Single shared axios instance — change NEXT_PUBLIC_API_BASE_URL in .env.local
// or via Docker Compose environment: to point to the correct backend host.
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
});

export default api;
