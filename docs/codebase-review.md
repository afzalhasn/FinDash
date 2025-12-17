# Codebase Review Notes

## 1. Auth contract mismatches _(Resolved)_
- ✅ Frontend now reads the backend's snake_case fields (`access_token`, `refresh_token`, `expires_in`) and sends `refresh_token` during logout (`frontend/src/app/context/AppContext.tsx`). Tokens persist across reloads and logout revocations succeed because the contract matches `TokenResponse`/`LogoutRequest` on the API (`backend/app/schemas/auth.py:27-32`, `backend/app/api/routes/auth.py:15-41`).

## 2. Transactions list is incompatible _(Resolved)_
- ✅ `useTransactions` now queries the API with the parameters it supports (`type/product/person/start/end`), converts the snake_case payload into the app’s camelCase `Transaction` model, and performs filtering/pagination client-side (`frontend/src/hooks/useTransactions.ts`). This keeps the UI contract consistent without requiring backend changes, so list and history views load correctly again.

## 3. Transaction creation + inventory guardrails fail _(Resolved)_
- ✅ `useCreateTransaction` converts the UI payload into the API’s snake_case schema before posting, and `useAvailableProducts` now calls `/api/v1/transactions/products/available` (`frontend/src/hooks/useTransactions.ts`). Add-entry validations no longer 422, so sell protection and transaction creation work with the live backend.

## 4. Context never syncs transactions with the API _(Resolved)_
- ✅ `AppContext` now loads `/api/v1/transactions` after login, converts the payload to the app’s camelCase model, and stores it in `data.transactions`. Components such as the dashboard widgets and inventory helpers finally receive real data even when `NEXT_PUBLIC_USE_API=true` (`frontend/src/app/context/AppContext.tsx`).

## 5. Admin-only APIs are fetched for all users _(Resolved)_
- ✅ The bootstrap effects now only call `/api/v1/users` and `/api/v1/investors` for admins and immediately mark those steps complete for partner/staff accounts, eliminating the 403/error loops. `disableUser` also sends the required `role` alongside `disabled`, so the backend schema validates (`frontend/src/app/context/AppContext.tsx`, `backend/app/schemas/users.py:21-23`).

## 6. Sensitive password logging _(Resolved)_
- ✅ Removed all `console.log`/`console.warn` calls from the login form so credentials are no longer printed to the browser console during sign-in (`frontend/src/app/pages/LoginPage.tsx`).

## 7. Investor activity metadata remains stale _(Resolved)_
- ✅ The backend now refreshes `last_activity_at` whenever an activity is recorded, and the frontend simply maps the server response without guessing investment history. After adding an investment or withdrawal, “Last Activity” updates immediately (`backend/app/services/investors.py`, `frontend/src/app/context/AppContext.tsx`).

## 8. Security hardening follow-ups _(Resolved)_
- ✅ CORS is now driven by `FINDASH_ALLOWED_ORIGINS` and only enables credentials for explicit hosts, instead of `allow_origins=["*"]`. Refresh token revocation is persisted in a `RevokedToken` table via a repository, so logout/refresh checks survive restarts and scale horizontally (`backend/app/main.py`, `backend/app/core/config.py`, `backend/app/models/revoked_token.py`, `backend/app/services/auth.py`).

## 9. Auth bootstrap loops _(Resolved)_
- ✅ The `/auth/me` bootstrap ran in a loop because the hydration effect depended on `setCurrentPage`, whose identity changes whenever the user state updates. The effect now only depends on auth tokens and uses a ref to invoke the latest `setCurrentPage`, so `/auth/me`, `/users`, and `/investors` requests fire just once per login (`frontend/src/app/context/AppContext.tsx`).
