# PromoCode Manager Backend

NestJS backend for the `PromoCode Manager` test task.

Current scope:
- JWT authentication
- Users, promocodes, orders, promo usages
- CQRS-style split between MongoDB writes and ClickHouse reads
- Redis lock for `apply-promocode`
- Redis cache for analytics endpoints

## Architecture

The backend uses three storage layers with different responsibilities:

- `MongoDB`: source of truth for all mutations and business rules
- `ClickHouse`: denormalized read model for analytics tables
- `Redis`: distributed lock and short-lived analytics cache

Write flow:
1. Request hits NestJS controller
2. DTO is validated by `ValidationPipe`
3. Service writes data to MongoDB
4. Service syncs the updated snapshot to ClickHouse
5. Service invalidates cached analytics in Redis

Read flow:
1. Client requests analytics endpoint
2. Backend checks Redis cache
3. If cache miss, backend queries ClickHouse
4. Response is cached in Redis with a short TTL

## Project Structure

Main backend modules:

- `src/auth`: registration, login, JWT strategy, protected auth routes
- `src/users`: user profile and lifecycle
- `src/promocodes`: promocode CRUD and validation
- `src/orders`: order creation and `apply-promocode`
- `src/analytics`: ClickHouse-backed analytics endpoints and sync service
- `src/infrastructure`: Redis and ClickHouse adapters
- `src/common`: shared config and types

## Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Required variables:

```env
PORT=3001
MONGO_URI=mongodb://admin:password@localhost:27017/promocodes?authSource=admin
JWT_SECRET=change_me
JWT_EXPIRES_IN=1d
REDIS_HOST=localhost
REDIS_PORT=6379
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_USERNAME=admin
CLICKHOUSE_PASSWORD=password
CLICKHOUSE_DATABASE=analytics
```

## Local Run

### 1. Start infrastructure

From the repository root:

```bash
docker compose up -d
docker compose ps
```

Infrastructure services:
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`
- ClickHouse HTTP: `localhost:8123`

### 2. Install and run backend

```bash
pnpm install
pnpm build
pnpm lint
pnpm test
pnpm start:dev
```

Backend will be available at `http://localhost:3001`.

### 3. Verify health

```bash
curl http://localhost:3001/health
```

Expected result: service status plus dependency states for MongoDB, Redis, and ClickHouse.

## Smoke Test

Suggested manual flow:

1. `POST /auth/register`
2. `POST /auth/login`
3. Use returned bearer token for protected routes
4. `POST /promocodes`
5. `POST /orders`
6. `POST /orders/:id/apply-promocode`
7. `GET /analytics/users`
8. `GET /analytics/promocodes`
9. `GET /analytics/promo-usages`

Example register payload:

```json
{
  "email": "demo@example.com",
  "name": "Demo User",
  "phone": "+79990000000",
  "password": "strongpass123"
}
```

Example promocode payload:

```json
{
  "code": "SPRING2026",
  "description": "Seasonal discount",
  "discountPercent": 10,
  "totalUsageLimit": 100,
  "perUserUsageLimit": 1
}
```

Example order payload:

```json
{
  "amount": 1500
}
```

Example apply payload:

```json
{
  "code": "SPRING2026"
}
```

## Quality Gates

Local quality commands:

```bash
pnpm build
pnpm lint
pnpm test
```

CI runs the same checks on pushes and pull requests via GitHub Actions.

## Deployment Notes

### Best demo-friendly option

For a demo build with minimal setup friction:

- frontend: Vercel
- backend: Render or Railway
- MongoDB: Atlas free tier
- Redis: Upstash free tier
- ClickHouse: ClickHouse Cloud trial

This is easy to wire up with GitHub-based deploys, but the stack is not fully free and permanent at production quality.

### Best stable option

For a stable project with this exact stack, the most practical setup is:

- one small VPS
- Docker Compose for backend + MongoDB + Redis + ClickHouse
- optional reverse proxy with HTTPS

That is not free, but it is simpler and more reliable than splitting this stack across several free providers.

## Branching and Review

Recommended workflow:

1. Create a feature branch from `trunk`
2. Make focused changes
3. Open a pull request
4. Wait for green CI
5. Merge into `trunk`

Example:

```bash
git checkout -b feature/readme-and-ci
git push -u origin feature/readme-and-ci
```
