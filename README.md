# PromoCode Manager

Fullstack test task built around a promo campaign workflow with a CQRS-style split between writes and analytics reads.

## What Is Included

- `backend/`: NestJS API with JWT auth, MongoDB write model, Redis lock/cache, ClickHouse analytics read model
- `frontend/`: React + Vite dashboard for auth, promo operations, orders, and analytics tables
- `docker-compose.yml`: local MongoDB, Redis, and ClickHouse stack
- `.github/workflows/backend-ci.yml`: CI for backend quality gates and frontend build

## Architecture

Write flow:
1. Client sends a command to the NestJS API
2. DTO validation runs through the global `ValidationPipe`
3. Business data is written to MongoDB
4. Updated snapshots are synchronized into ClickHouse
5. Analytics cache is invalidated in Redis

Read flow:
1. Frontend requests analytics data
2. Backend checks Redis cache
3. On cache miss, backend queries ClickHouse
4. Result is returned and cached for the next request

Why each store exists:
- `MongoDB`: source of truth for users, promocodes, orders, and promo usages
- `ClickHouse`: denormalized read model for analytics tables
- `Redis`: concurrency control for `apply-promocode` and short-lived analytics cache

## Local Run

### 1. Start infrastructure

```bash
docker compose up -d
docker compose ps
```

### 2. Start backend

```bash
cd /Users/alex/Projects/test-task/backend
cp .env.example .env
pnpm install
pnpm build
pnpm lint
pnpm test
pnpm start:dev
```

Backend runs on `http://localhost:3001`.

### 3. Start frontend

```bash
cd /Users/alex/Projects/test-task/frontend
cp .env.example .env
pnpm install
pnpm build
pnpm dev
```

Frontend runs on `http://localhost:5173`.

## Manual Smoke Flow

1. Open `http://localhost:5173`
2. Register a new user
3. Create a promocode
4. Create an order
5. Click an order in `My orders` to prefill the apply form
6. Apply the created promocode
7. Confirm analytics tables update without errors

## Quality Gates

Backend:

```bash
cd /Users/alex/Projects/test-task/backend
pnpm build
pnpm lint
pnpm test
```

Frontend:

```bash
cd /Users/alex/Projects/test-task/frontend
pnpm build
```

## Demo Notes

The fastest demo setup for this repository is:
- frontend deployed to Vercel
- backend kept local or deployed separately
- temporary public access to backend via tunnel if needed

For stable long-lived hosting with the current stack, a small VPS with Docker Compose is the most practical option.

## Important Backend Notes

- Analytics endpoints read from ClickHouse only
- Writes and business validation go through MongoDB
- `apply-promocode` uses Redis lock to reduce race conditions
- Analytics data is cached in Redis and invalidated after mutations

See [backend/README.md](/Users/alex/Projects/test-task/backend/README.md) for backend-specific details and example payloads.
