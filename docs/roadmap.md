# FinDash Development Roadmap

This roadmap breaks work into phases for backend and frontend teams. Complete each epic in order to keep the system stable while migrating from mock data to live APIs.

---

## Backend Roadmap

### Phase 1 – Foundations & Infrastructure
- **Epic: Monorepo & Environment Setup**
  - Story: Initialize backend project structure.
    - Task 1 ✅: Scaffold FastAPI app with application factory (`backend/app/main.py`).
    - Task 2 ✅: Add core modules (`config`, `database`, `security`, `logging`).
  - Story: Containerize services.
    - Task 1 ✅: Create backend Dockerfile (multi-stage).
    - Task 2 ✅: Define `docker-compose.yml` entries for backend, frontend, Postgres, pgAdmin.
    - Task 3 ✅: Provide `.env.example` and document setup.

### Phase 2 – Database & Models
- **Epic: Persistence Layer**
  - Story: Define SQLAlchemy models + Alembic migrations.
    - Task 1 ✅: Model `User`, `Transaction`, `Investor`, `InvestmentActivity`, `AuditLog`.
    - Task 2 ✅: Create initial Alembic revision and upgrade scripts.
    - Task 3 ✅: Seed demo data (admin/partner/staff; sample transactions & investors).
  - Story: Repository & service factories.
    - Task 1 ✅: Implement repositories per entity.
    - Task 2 ✅: Build service factory functions for auth, transactions, investors, insights.

### Phase 3 – Authentication & User Management
- **Epic: Auth Stack**
  - Story: Implement OAuth2 password flow.
    - Task 1 ✅: Hash passwords with `passlib`.
    - Task 2 ✅: Implement JWT generation/verification, refresh tokens, and revocation list.
    - Task 3 ✅: Add `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` routes + tests.
- **Epic: Account Management**
  - Story: User CRUD APIs.
    - Task 1 ✅: Implement `/users` endpoints with role guards.
    - Task 2 ✅: Add audit logging for role/disable updates.
    - Task 3 ✅: Write unit tests for repositories and services.

### Phase 4 – Transactions & Insights
- **Epic: Transaction Management**
  - Story: CRUD endpoints for transactions.
    - Task 1 ✅: Implement GET/POST `/transactions`.
    - Task 2 ✅: Add filters (type, date range, text search) + pagination.
    - Task 3 ✅: Add PATCH/DELETE endpoints with validation (sell requires stock).
  - Story: Product availability helper.
    - Task 1 ✅: Implement `/products/available` endpoint.
    - Task 2 ❌: Cache results when dataset grows (optional) — skipped for now.
- **Epic: Insights Services**
  - Story: Dashboard summaries.
    - Task 1 ✅: Build aggregation queries for purchases, sales, expenses, profit, investor cash.
    - Task 2 ✅: Implement `/insights/summary`, `/insights/products`, `/insights/timeseries`.
    - Task 3: Add integration tests using seeded data.

### Phase 5 – Investor Management & Finalization
- **Epic: Investor Services**
  - Story: Investor CRUD and activity logging.
    - Task 1 ✅: Implement `/investors` list/create endpoints.
    - Task 2 ✅: Implement `/investors/{id}` detail + `/activities` endpoints with balance checks.
    - Task 3 ✅: Ensure transactions are atomic, add tests.
- **Epic: Observability & Hardening**
  - Story: Add health/metrics endpoints and structured logging.
    - Task 1 ✅: `/health/live` and `/health/ready`.
    - Task 2 ✅: Configure logging format and correlation IDs.
    - Task 3 ✅: Add CI jobs (lint, tests, migrations) and finalize Docker images.

---

## Frontend Roadmap

### Phase A – Preparation & API Client
- **Epic: API Client & State Refactor**
  - Story: Establish API layer & contracts.
    - Task 1 ✅: Create `src/lib/api.ts` with base client and interceptors.
    - Task 2 ✅: Introduce React Query/SWR setup for data fetching and shared error handling.
    - Task 3 ✅: Document API contracts/error states with backend (`docs/api-design.md` alignment).
  - Story: Context cleanup preparation.
    - Task 1: Isolate UI-only state vs. data state inside `AppContext`.
    - Task 2: Add feature flags/env vars to switch between mock and API data and set `NEXT_PUBLIC_API_BASE_URL`.

### Phase B – Authentication Integration
- **Epic: Auth Flow Migration**
  - Story: Wire login/logout to backend.
    - Task 1: Replace `login()` to call `/auth/login`, store user profile from API.
    - Task 2: Decide token storage strategy (HTTP-only cookie vs memory) and handle refresh & logout (`/auth/logout`) in context/middleware.
    - Task 3: Update protected navigation logic to use backend role info.

### Phase C – Transactions & Dashboard
- **Epic: Transaction Data Source Swap**
  - Story: Fetch transactions from API.
    - Task 1: Implement `useTransactions(filters)` hook calling GET `/transactions`.
    - Task 2: Update TransactionsPage to consume hook and remove local state.
  - Story: Add Entry mutation.
    - Task 1: Wire form submission to POST `/transactions`.
    - Task 2: On success, invalidate transaction/insight caches; remove local `addTransaction`.
- **Epic: Dashboard Insights**
  - Story: Replace local computations with API.
    - Task 1: Fetch `/insights/summary` for cards.
    - Task 2: Fetch `/insights/products` + `/insights/timeseries` for charts.
    - Task 3: Remove redundant calculations from frontend.

### Phase D – Investors & Accounts
- **Epic: Investor Management Integration**
  - Story: Fetch investor list/detail from API.
    - Task 1: Replace `investors` state with GET `/investors`.
    - Task 2: Wire Add Investor form to POST `/investors`.
    - Task 3: Wire investment/withdrawal forms to POST `/investors/{id}/activities`.
  - Story: Remove mock investor data from context.
- **Epic: Account Management Integration**
  - Story: User CRUD UI.
    - Task 1: Fetch `/users` to populate admin table.
    - Task 2: Wire new account form to POST `/users`.
    - Task 3: Wire role/disable actions to PATCH endpoints.

### Phase E – Cleanup & Polish
- **Epic: Remove Legacy State**
  - Story: Delete mock data & localStorage persistence.
    - Task 1: Remove initial transaction/investor/user arrays from `AppContext`.
    - Task 2: Delete `localStorage` hydration/effects, relying on API queries.
  - Story: UX Enhancements.
    - Task 1: Show loading/error states from React Query.
    - Task 2: Surface backend validation errors via toasts/forms.
    - Task 3: Add end-to-end tests (Cypress/Playwright) covering auth, transactions, investors, and final QA against Figma.

---

### Tracking Tips
1. Work through backend phases sequentially; unblock frontend dependencies before migrating UI features.
2. Use GitHub Projects/Jira to map each task to an issue; note start/end dates for velocity tracking.
3. Keep `docs/api-design.md` and this roadmap updated whenever endpoints or priorities shift.
