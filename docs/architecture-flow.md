# FinDash Monorepo Architecture Flow

This document describes how the FinDash Cash Flow Tracker evolves into a Dockerized monorepo with a FastAPI backend, PostgreSQL database, and the existing Next.js frontend. Follow each step sequentially when setting up or extending the system.

## 1. Goals & Scope
1. Support the current frontend without rewrites by exposing equivalent APIs for login, transactions, investors, dashboards, and account management.
2. Adopt a FastAPI backend that uses the factory pattern to wire services, making testing and dependency injection straightforward.
3. Persist all business data in PostgreSQL and offer pgAdmin for database inspection.
4. Run every component locally through Docker Compose so onboarding only requires Docker and a `.env` file.

## 2. Monorepo Layout
1. `frontend/` – Next.js App Router project (existing code). Contains UI components, context, and styling.
2. `backend/` – FastAPI service implemented with modules for routers, schemas, services, repositories, and models plus Alembic migrations.
3. `docs/` – Product, architecture, and onboarding documentation (this file lives here).
4. `infra/` *(optional but recommended)* – Shared infrastructure artifacts such as `docker-compose.yml`, Makefiles, and helper scripts.
5. `db/` *(optional folder)* – Seed SQL files or ER diagrams referenced during migrations.

## 3. Environment & Configuration Flow
1. Copy `.env.example` in the repo root to `.env`. The file contains shared variables (e.g., `POSTGRES_USER`, `POSTGRES_PASSWORD`, `JWT_SECRET`, `NEXT_PUBLIC_API_BASE_URL`).
2. The backend container reads common env vars plus service-specific overrides defined in `backend/.env`.
3. The frontend reads `NEXT_PUBLIC_API_BASE_URL` at build time. When running in Docker, use the service name (`http://backend:8000`); when developing outside Docker, point to `http://localhost:8000`.
4. Docker Compose injects env vars into each service; sensitive values never hard-coded in source.

## 4. Dockerized Runtime Flow
1. `docker-compose.yml` spins up four services:
   - `frontend`: Builds `frontend/Dockerfile`, mounts source for hot reload (`npm run dev`) or builds static output for production.
   - `backend`: Builds `backend/Dockerfile`, launches `uvicorn app.main:create_app --factory --host 0.0.0.0 --port 8000`.
   - `postgres`: Uses the official PostgreSQL 15 image; runs init scripts that create the FinDash database and seed reference data.
   - `pgadmin`: Optional but recommended; maps to `http://localhost:5050` with credentials stored in `.env`.
2. Each service depends on Postgres being healthy. Compose waits for the DB before starting the backend; the frontend can retry requests until the backend is ready.
3. Local development workflow:
   - `docker compose up --build` to start everything.
   - `docker compose logs -f backend` or `frontend` for troubleshooting.
   - `docker compose down -v` when you want to reset volumes and data.

## 5. Backend Architecture Flow (Factory Pattern)
1. **Application Factory**
   - `app/main.py` exposes `def create_app() -> FastAPI` that configures settings, logging, CORS, middleware, and router registration.
   - Uvicorn loads this factory (`uvicorn app.main:create_app --factory`) ensuring consistent initialization for prod and tests.
2. **Core Modules**
   - `app/core/config.py`: Pydantic settings for DB URLs, JWT secrets, CORS origins.
   - `app/core/database.py`: SQLAlchemy engine/session creation and dependency injection helpers.
   - `app/core/security.py`: Password hashing (`passlib`), JWT encode/decode, OAuth2 dependencies, and role-based guards.
3. **Domain Layers**
   - `app/models`: SQLAlchemy models (`User`, `Transaction`, `Investor`, `InvestmentActivity`, `AuditLog`).
   - `app/schemas`: Pydantic request/response objects mirroring frontend contracts.
   - `app/repositories`: Reusable DB operations (e.g., `TransactionRepository` with CRUD + filter queries).
   - `app/services`: Business logic classes (e.g., `TransactionService`, `InvestorService`). Each service is created via factory functions that accept repositories and other dependencies.
     ```python
     def make_transaction_service(db: Session) -> TransactionService:
         repo = TransactionRepository(db)
         validator = InventoryValidator(db)
         return TransactionService(repo=repo, validator=validator)
     ```
4. **API Routers**
   - `app/api/v1/routes`: Modules for `auth`, `users`, `transactions`, `investors`, `insights`, `health`.
   - Each router pulls the appropriate service through FastAPI dependencies (`Depends(make_transaction_service))`.
   - Responses stay consistent with frontend needs (totals, filters, role restrictions).
5. **Migrations & Seeds**
   - Alembic lives under `backend/migrations`.
   - `docker compose run backend alembic upgrade head` executes migrations.
   - Seed scripts (SQL or Python) insert admin/partner/staff demo accounts and sample transactions.

## 6. Database Flow
1. Entities map closely to the current frontend context:
   - `users` with roles (`admin`, `partner`, `staff`), status flags, and hashed passwords.
   - `transactions` capturing buys, sells, expenses, and metadata (quantity, price per unit, notes).
   - `investors` storing aggregates plus `investment_activities` for history.
   - Optional `audit_logs` for compliance and troubleshooting.
2. Constraints/indices:
   - Unique index on `users.email`.
   - Partial indexes for filtering transactions by type/date.
   - Foreign keys with cascading deletes disabled to preserve history.
3. Backup & visibility:
   - Volumes store Postgres data locally (`./.postgres-data`).
   - pgAdmin connects using docker service name `postgres` to run manual queries or inspect schemas.

## 7. Frontend Integration Flow
1. Initialize an API client layer inside `frontend/src/lib/api.ts` (or similar) to wrap `fetch` calls and handle token refresh automatically.
2. Replace the in-memory `AppContext` persistence with server-backed hooks:
   - `login()` -> call `/auth/login`, store session data in context.
   - `useTransactions(filters)` -> call `/transactions`.
   - Dashboard components -> fetch `/insights/summary` and `/insights/products`.
   - Investor and account pages -> call `/investors` and `/users` endpoints respectively.
3. Introduce React Query (or SWR) for caching and invalidation so UI updates stay consistent after each mutation.
4. Gradually phase out `localStorage` usage once every domain talks to the backend.

## 8. Testing & CI Flow
1. Backend:
   - `pytest` + `coverage` run inside the container. Use the application factory to spin up a test app with an in-memory (or SQLite) database where possible.
   - Integration tests spin up a disposable Postgres via Docker Compose override.
2. Frontend:
   - `npm test` for component/unit coverage.
   - `npm run lint` and `npm run type-check` enforced in CI.
3. Pipeline:
   - Lint → Test → Build Docker images → Run Alembic migrations → Publish artifacts.
   - Git hooks can run `pre-commit` checks (formatting, linting) before pushes.

## 9. Deployment Flow (Preview)
1. Build production images using the Dockerfiles (multi-stage to keep runtime lean).
2. Push to a registry (ECR/GCR/Docker Hub).
3. Deploy via container orchestrator (ECS, Kubernetes, or Docker Swarm). Use environment variables/secrets manager to inject runtime config.
4. Configure HTTPS ingress (e.g., Nginx or Traefik) to route `/api` to FastAPI and `/` to the Next.js frontend.
5. Schedule regular Postgres backups and monitor services via logs/metrics (Prometheus or hosted alternative).

---

Use this flow as a checklist whenever you onboard new contributors or introduce new features. Each section can be expanded into more detailed guides (e.g., API contracts, ER diagrams, or deployment runbooks) inside the `docs/` folder.
