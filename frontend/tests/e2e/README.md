# Playwright End-to-End Tests

This suite validates the most critical FinDash user journeys (auth, dashboard navigation, and admin flows) using [Playwright](https://playwright.dev/).

## Prerequisites
1. Install dependencies from the `frontend` folder:
   ```bash
   npm install
   npx playwright install
   ```
2. Ensure the backend, database, and frontend run via Docker or `npm run dev`.
3. Required environment variables:
   - `NEXT_PUBLIC_USE_API=true`
   - `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` (or wherever FastAPI runs)
   - `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` (defaults to `admin@findash.com` / `password`).
   - Optional: `E2E_BASE_URL` (defaults to `http://127.0.0.1:3000` when tests spawn the dev server).

## Running the Suite
From `frontend/`:
```bash
npm run test:e2e
```

- Set `E2E_SKIP_SERVER=1` if the frontend is already running (for example, inside Docker) so Playwright does not spawn another dev server.
- Use `npx playwright test --headed --project=chromium` for interactive debugging.

Test artifacts (videos, traces, screenshots) are stored under `tests/e2e/results/`.
