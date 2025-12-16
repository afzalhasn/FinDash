# FinDash Verification Roadmap (Backend & Frontend)

Goal: walk every screen and API path to ensure the UI reflects live FastAPI/Postgres data—no hardcoded mock data or stale caches. Complete each checklist in order; only proceed once tests pass for the current item.

---

## Backend Verification Tasks

1. **Auth & Session APIs**
   - [x] Confirm `/api/v1/auth/login`, `/auth/me`, `/auth/logout`, `/auth/refresh` work end-to-end with seeded credentials.
   - [x] Verify JWT expiry/refresh flows and ensure tokens are stored/cleared correctly.
   - [x] Run `pytest backend/tests/test_auth_service.py`.

2. **User Management**
   - [x] Hit `/api/v1/users` list/create/update/disable endpoints using seeded admin token.
   - [x] Ensure audit logs write and timestamps are IST-aware.
   - [x] Run `pytest backend/tests/test_user_service.py`.

3. **Transactions**
   - [x] Validate GET `/api/v1/transactions` filters (`type`, `search`, `start`, `end`) against DB data.
   - [x] Add buy/sell/expense via POST; confirm persisted rows and available product list update.
   - [x] Run `pytest backend/tests/test_transaction_service.py`.

4. **Insights**
   - [x] Check `/api/v1/insights/summary|products|timeseries` reflect transaction mutations.
   - [x] `pytest backend/tests/test_insights_api.py`.

5. **Investors & Activities**
   - [x] Exercise `/api/v1/investors` CRUD plus `/activities` (investment/withdrawal) validating net balance logic.
   - [x] `pytest backend/tests/test_investor_service.py`.

6. **Observability & Admin**
   - [x] `/health/live` & `/health/ready` respond when DB is reachable.
   - [x] `/api/v1/admin/reset-database` gated to admins and reseeds data.
   - [x] Verify log rotation + daily files under `backend/logs/`.

---

## Frontend Verification Tasks

1. **Global Bootstrap**
   - [ ] Ensure `AppContext` boots with `NEXT_PUBLIC_USE_API=true`, fetches `/auth/me`, `/users`, `/investors`.
   - [ ] Confirm `isBootstrapping` overlay hides once API calls resolve.

2. **Login Page**
   - [ ] Attempt invalid creds; UI should display backend error message.
   - [ ] Valid login must hit FastAPI, set tokens, and redirect to dashboard.

3. **Dashboard Page**
   - [ ] Summary cards and charts should match `/insights` responses (no mock arrays).
   - [ ] Recent transactions list should reflect live `/transactions` data, including new entries.

4. **Transactions Page**
   - [ ] Search/type/date filters must call backend each time (verify network calls).
   - [ ] After adding a transaction, list updates without manual refresh (hook refetch/event).

5. **Add Entry Page**
   - [ ] Forms submit to POST `/transactions`.
   - [ ] Sell validation uses `/transactions/products/available`.
   - [ ] Toasts display backend validation errors (e.g., selling unavailable product).

6. **Product Insights Page**
   - [ ] Charts/tables consume `/insights/*` endpoints; confirm values change after seeding new data.

7. **Investor Management Page**
   - [ ] Investor list pulled from `/investors`.
   - [ ] Adding investor/investment/withdrawal uses API and refreshes list/activity.

8. **Account Management Page**
   - [ ] `/users` table reflects backend.
   - [ ] Creating/disabling/changing roles hits API and refreshes context state.

9. **Auth/Tokens**
   - [ ] Confirm logout clears tokens and returns to login.
   - [ ] Token expiry scenario logged out gracefully (simulate by deleting tokens).

10. **End-to-End Tests**
   - [ ] Update Playwright specs if UX changed.
   - [ ] Run `npm run test:e2e` (after `npx playwright install`).

---

### Execution Notes
- Perform backend checks before frontend to guarantee APIs are reliable.
- Document any failures with reproduction steps, logs, and proposed fixes before moving to the next item.
- After each completed task, mark it ✅ and commit with an informative message tying back to this roadmap.
