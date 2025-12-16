# FinDash Frontend

Next.js App Router UI for the FinDash Cash Flow Tracker. It consumes the FastAPI backend, renders dashboards, and enforces role-based navigation for admins, partners, and staff.

## Architecture Overview

```
frontend/
├─ app/
│  ├─ layout.tsx          # HTML shell + global styles
│  └─ page.tsx            # Entrypoint that mounts <App/>
├─ src/
│  ├─ app/
│  │  ├─ App.tsx          # Client-side router driven by AppContext
│  │  ├─ context/AppContext.tsx
│  │  └─ pages/*.tsx      # Login, Dashboard, Transactions, Add Entry, Insights, Investor, Accounts
│  ├─ hooks/              # useTransactions, useInsights, etc. (API backed)
│  ├─ lib/
│  │  ├─ api.ts           # Axios wrapper with base URL + interceptors
│  │  ├─ auth.ts          # Token storage helpers (memory + localStorage fallback)
│  │  └─ timezone.ts      # IST-normalized formatting + filter serialization
│  ├─ styles/             # Tailwind/CSS theme
│  └─ tests/e2e/          # Playwright specs for auth + navigation
└─ Dockerfile / package.json / tsconfig.json
```

| Layer              | Description                                                                                                        |
|--------------------|--------------------------------------------------------------------------------------------------------------------|
| UI Components      | Reusable Tailwind + Radix primitives, Lucide icons, Sonner toasts, Embla/Recharts for charts.                      |
| App Routing        | `App.tsx` maps the `currentPage` in context to screen components; gating enforced via role matrix.                |
| State Management   | `AppContext` tracks authenticated user, cached API results, bootstrap status, and exposes actions (CRUD, logout).  |
| Data Fetching      | Hooks (`useTransactions`, `useInvestors`, `useInsightSummary`, etc.) call the REST API via `lib/api.ts`.           |
| Auth Integration   | Context `login/logout/me` hit `/api/v1/auth/*`, store tokens with `lib/auth.ts`, and guard pages based on roles.   |
| Timezone Handling  | `lib/timezone.ts` forces all filters and UI timestamps into IST (Asia/Kolkata) so frontend matches backend logic.  |
| Testing            | Playwright specs under `tests/e2e` exercise login, dashboard, and admin workflows end-to-end.                      |

## Feature Set

- **Authentication UI**: Login form with API error surfacing, demo credential hints, and loading states.
- **Role-Based Workspace**:
  - Dashboard with per-role actions, time filters, summary cards, Recharts visualizations, and recent transactions.
  - Transactions history with search, type/date filters, retry handling, and read-only view for staff.
  - Add Entry form (buy/sell/expense) wired to POST `/transactions`, includes inventory validation feedback.
  - Product Insights charts fed from `/insights/summary`, `/insights/products`, `/insights/timeseries`.
  - Investor management (admin-only) to add investors, log investments/withdrawals, enforce net balance checks.
  - Account management (admin-only) to create users, change roles, disable accounts with optimistic toasts.
- **API Client & Error UX**: Centralized Axios instance adds auth headers, handles 401 refresh/logout, and exposes typed helpers. Toasts show backend validation details.
- **IST-Aware Filtering**: Date pickers serialize to IST boundaries so backend queries align with local business hours; UI displays dates using `Intl` with `Asia/Kolkata`.
- **Docker Ready**: Multi-stage Dockerfile installs deps, builds Next13 app, and runs under `node` user; compose stack shares the same `.env`.
- **Playwright E2E**: `npm run test:e2e` spins up the dev server (or attaches to an existing one) and verifies invalid/valid login plus navigation to Transactions/Investors/Accounts.

## Getting Started

```bash
cd frontend
npm install

# Environment
cp ../.env.example ../.env   # includes NEXT_PUBLIC_* vars
export NEXT_PUBLIC_USE_API=true
export NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

npm run dev        # http://localhost:3000
npm run build
npm start          # serve production build
```

Must-have environment variables:

```
NEXT_PUBLIC_USE_API=true
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Optional for tests:

```
E2E_BASE_URL=http://127.0.0.1:3000
E2E_ADMIN_EMAIL=admin@findash.com
E2E_ADMIN_PASSWORD=password
```

## Architecture Flow

1. **Bootstrap**  
   - App mounts `AppProvider`.  
   - Context checks stored tokens, calls `/auth/me`, and sets `isBootstrapping` until user + baseline data (users, investors) resolve.  
   - `AppRouter` redirects to login until authorized.

2. **Data Fetch & Cache**  
   - Hooks (transactions/insights/investors/users) invoke backend endpoints via `lib/api.ts`.  
   - Success responses update context state; custom events trigger reloads after mutations.  
   - Failures bubble as `ApiError` instances which pages convert into inline alerts/toasts.

3. **Mutations**  
   - Context exposes `addTransaction`, `addInvestor`, `addInvestment`, `addWithdrawal`, `addUser`, `updateUserRole`, `disableUser`.  
   - Each method hits the API, updates context caches, and emits events so dependent hooks refresh.

4. **Role Enforcement**  
   - `AppContext` defines `PAGE_ACCESS`; `setCurrentPage` + `isAuthorized` ensure only permitted pages render.  
   - Buttons in headers respect the current user role (e.g., admin sees New Account, Add Investor).

5. **IST Handling**  
   - `lib/timezone.ts` converts date filter picks into ISO strings aligned to IST midnight/end-of-day.  
   - Pages format all timestamps via `formatIST` so UI matches backend ledger timestamps.

## Testing & QA

```bash
# Unit / lint (if configured)
npm run lint

# End-to-end
npm install
npx playwright install
npm run test:e2e
```

Docs:

- `docs/api-design.md` – REST contracts shared with backend.
- `docs/roadmap.md` – Phase breakdown tracking integration progress.
- `frontend/tests/e2e/README.md` – How to run the Playwright suite.
