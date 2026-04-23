# SKKN

Full-stack application consisting of a Next.js frontend (`skkn-web`) and a Node.js/Express API (`skkn-api-main`), backed by MongoDB and Redis — all orchestrated via Docker Compose.

---

## Prerequisites

- [Docker](https://www.docker.com/get-started) ≥ 24 & Docker Compose ≥ 2.x
- [Node.js](https://nodejs.org/) ≥ 20 (only needed for local development without Docker)

---

## Environment Setup

The project has two separate `.env` files — one per service.

### 1. Backend — `skkn-api-main/.env`

Copy the example file and fill in the values:

```bash
cp skkn-api-main/.env.example skkn-api-main/.env
```

| Variable | Description | Example / Default |
| --- | --- | --- |
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | Port the API listens on | `3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/skkn` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key for signing JWTs — **must be changed in production** | *(generate below)* |
| `JWT_EXPIRES_IN` | JWT token TTL | `7d` |
| `CORS_ORIGIN` | Allowed CORS origin (frontend URL) | `http://localhost:5002` |

**Generate a secure `JWT_SECRET`:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Full example (`skkn-api-main/.env`):**

```env
NODE_ENV=development
PORT=3000

# MongoDB
MONGO_URI=mongodb://localhost:27017/skkn

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=<paste_generated_secret_here>
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5002
```

> **⚠️ When running via Docker Compose**, the `MONGO_URI` and `REDIS_URL` values in the compose file are automatically overridden to use internal Docker hostnames (`mongodb:27017`, `redis:6379`). Your local `.env` is used only for non-Docker development.

---

### 2. Frontend — `skkn-web/.env.local`

Copy the example file and fill in the values:

```bash
cp skkn-web/.env.example skkn-web/.env.local
```

| Variable | Description | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Full base URL of the backend API (accessible from the browser) | `http://localhost:3000/api` |

**Full example (`skkn-web/.env.local`):**

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

> **⚠️ When running via Docker Compose**, this variable is overridden in `docker-compose.yml` to `http://backend:3000` (internal Docker network). The `.env.local` file is only used for local development outside Docker.

---

## Running with Docker

All four services (frontend, backend, MongoDB, Redis) are defined in `docker-compose.yml` at the project root.

### Start all services

```bash
docker compose up --build
```

Use `-d` to run in detached (background) mode:

```bash
docker compose up --build -d
```

### Stop all services

```bash
docker compose down
```

To also **remove persisted volumes** (database data will be lost):

```bash
docker compose down -v
```

### Rebuild a single service

```bash
# Rebuild only the backend
docker compose up --build backend

# Rebuild only the frontend
docker compose up --build frontend
```

### View logs

```bash
# All services
docker compose logs -f

# Single service
docker compose logs -f backend
docker compose logs -f frontend
```

---

## Service URLs (Docker)

| Service | URL |
| --- | --- |
| Frontend | <http://localhost:5002> |
| Backend API | <http://localhost:3000> |
| MongoDB | `mongodb://localhost:27017` |
| Redis | `redis://localhost:6379` |

---

## Running Locally (without Docker)

Ensure MongoDB and Redis are running locally, then:

```bash
# Terminal 1 — Backend
cd skkn-api-main
npm install
npm run dev

# Terminal 2 — Frontend
cd skkn-web
npm install
npm run dev
```
