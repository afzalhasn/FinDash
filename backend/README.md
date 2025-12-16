# FinDash Backend

FastAPI + SQLAlchemy service that powers the FinDash Cash Flow Tracker. It exposes authenticated REST APIs for transactions, investors, insights, users, and admin utilities while running in a Dockerized monorepo with the Next.js frontend.

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│ FastAPI (app/main.py)                                              │
│  ├─ API Routers (app/api/routes/*.py)                              │
│  │   ├─ Auth, Users, Transactions, Investors, Insights, Admin      │
│  │   └─ Dependency injection (app/api/dependencies.py)             │
│  ├─ Service Layer (app/services/*.py)                              │
│  │   ├─ AuthService, TransactionService, InvestorService, etc.     │
│  │   └─ ServiceFactory wires repositories + shared Session         │
│  ├─ Repository Layer (app/repositories/*.py)                       │
│  │   └─ Thin wrappers around SQLAlchemy ORM queries                │
│  ├─ Models (app/models/*.py)                                       │
│  │   └─ SQLAlchemy ORM entities + Alembic migrations               │
│  ├─ Schemas (app/schemas/*.py)                                     │
│  │   └─ Pydantic I/O contracts enforcing validation & IST timezone │
│  ├─ Core utilities (app/core/*.py)                                 │
│  │   ├─ Settings, database engine/session factories                │
│  │   ├─ Security (JWT, password hashing)                           │
│  │   ├─ Logging + correlation IDs                                  │
│  │   └─ timezone helpers (Asia/Kolkata defaults)                   │
│  └─ Seed data + migrations (app/seed_data.py, app/migrations/)     │
└────────────────────────────────────────────────────────────────────┘
```

- **Factory pattern**: `create_app()` builds the FastAPI instance, registers middleware (CORS + correlation IDs), and mounts the versioned router.
- **Dependency wiring**: `app/api/dependencies.py` injects SQLAlchemy sessions and per-request services (auth, transactions, investors, insights, maintenance) so every endpoint can stay thin.
- **IST everywhere**: `app/core/timezone.py` standardizes server defaults, token timestamps, data ingestion, and seed fixtures to Asia/Kolkata. Frontend queries/filters expect the same behavior.

## Feature Summary

| Area                 | Highlights                                                                                           |
|----------------------|------------------------------------------------------------------------------------------------------|
| Authentication       | OAuth2 password flow, PBKDF2 password hashing, JWT access + refresh tokens, logout & refresh routes |
| User Management      | `/users` CRUD with role guards (admin/partner/staff), audit logs for privilege changes               |
| Transactions         | GET/POST/PATCH/DELETE `/transactions`, filtering, pagination hook support, product availability API  |
| Insights             | `/insights/summary`, `/insights/products`, `/insights/timeseries` aggregation queries                |
| Investors            | CRUD + activity logging, withdrawal safeguards, net investment tracking                              |
| Observability        | Structured logging with correlation IDs, `/health/live` & `/health/ready` probes, rotating log files |
| CI & Tooling         | pytest suites (unit + integration), Alembic migrations, Dockerfile, compose stack with Postgres/pgAdmin |

## Getting Started

1. **Install dependencies**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. **Configure environment**
   - Copy `.env.example` to `.env`.
   - Update DB credentials, JWT secrets, and logging options as needed.
3. **Run services**
   - Local: `uvicorn app.main:create_app --factory --reload`
   - Docker: `docker compose up backend db pgadmin`
4. **Database**
   ```bash
   # Apply migrations
   alembic upgrade head
   # Seed demo data
   python app/seed_data.py
   ```

## Testing

```bash
pytest
```

- Unit tests for services/repos (`backend/tests/test_*_service.py`)
- Integration tests for admin + insight APIs (`backend/tests/test_admin_api.py`, `backend/tests/test_insights_api.py`)

## Notable Files

- `app/main.py` – FastAPI factory, middleware, probes
- `app/core/config.py` – Pydantic settings (`.env` driven)
- `app/core/timezone.py` – IST helpers for tokens, ORM defaults, schema validation
- `app/services/factory.py` – Dependency factory instantiating repositories + services per request
- `app/migrations/versions/` – Alembic revisions (`0001_initial_schema.py`, `0002_use_ist_time_zone.py`)
- `Dockerfile` – Multi-stage image (poetry-like caching, non-root runtime)

## API Surface (High Level)

- `POST /api/v1/auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- `GET/POST/PATCH /api/v1/users`
- `GET/POST/PATCH/DELETE /api/v1/transactions`, `GET /transactions/products/available`
- `GET/POST /api/v1/investors`, `POST /investors/{id}/activities`
- `GET /api/v1/insights/summary|products|timeseries`
- `POST /api/v1/admin/reset-database` (admin only)

Refer to `docs/api-design.md` for payloads and frontend expectations.
