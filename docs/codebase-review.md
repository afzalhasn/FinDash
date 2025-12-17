# Codebase Review Notes

## 1. Auth contract mismatches
- `TokenResponse` returns `access_token/refresh_token/expires_in`, and logout expects `refresh_token` (`backend/app/schemas/auth.py:27-32`, `backend/app/api/routes/auth.py:15-41`), but the frontend stores `response.accessToken/refreshToken/expiresIn` and posts `{ refreshToken }` (`frontend/src/app/context/AppContext.tsx:302-348`). Because of the case mismatch, tokens are never persisted, `/auth/me` fails after reload, and logout cannot revoke refresh tokens.

## 2. Transactions list is incompatible
- The frontend always sends `page`, `pageSize`, and `search` plus camelCase fields (`frontend/src/hooks/useTransactions.ts:59-90`) while the backend endpoint only accepts `type/product/person/start/end` and returns a simple `list[TransactionOut]` (`backend/app/api/routes/transactions.py:15-25`). Every request receives HTTP 422, and even a successful call would not match the expected paginated `{ items, total }` response or camelCase property names (`frontend/src/hooks/useTransactions.ts:11-52`).

## 3. Transaction creation + inventory guardrails fail
- `CreateTransactionPayload` and related POSTs use camelCase property names and call `/api/v1/transactions` / `/api/v1/products/available` (`frontend/src/hooks/useTransactions.ts:31-90`, :218-244), but FastAPI expects snake_case fields and exposes products at `/api/v1/transactions/products/available` (`backend/app/api/routes/transactions.py:28-58`). Consequently every create request and sell validation fails with 422, blocking add-entry flows.

## 4. Context never syncs transactions with the API
- `AppContext` initialises `data.transactions` but never fetches or updates it (`frontend/src/app/context/AppContext.tsx:150-433`). Widgets like “Recent Transactions,” `getAvailableProducts`, and all mock-mode analytics read from that empty array (`frontend/src/app/pages/DashboardPage.tsx:14-115`), so the UI shows no data whenever `NEXT_PUBLIC_USE_API=true`.

## 5. Admin-only APIs are fetched for all users
- Immediately after login, `/api/v1/users` and `/api/v1/investors` are fetched for every session (`frontend/src/app/context/AppContext.tsx:248-305`), but those routes require admin tokens (`backend/app/api/routes/users.py:15-44`, `backend/app/api/routes/investors.py:13-44`). Partners/staff therefore see recurring 403 errors during bootstrap. In addition, `disableUser` sends only `{ disabled: true }` even though `UserRoleUpdate` requires `role` (`frontend/src/app/context/AppContext.tsx:399-415`, `backend/app/schemas/users.py:21-23`), making that action impossible.

## 6. Sensitive password logging
- The login form logs the submitted password in plaintext (`frontend/src/app/pages/LoginPage.tsx:27-41`). This is unsafe even in staging and should be removed before any real deployment.

## 7. Investor activity metadata remains stale
- `InvestorService.add_activity` updates totals but never touches `last_activity_at` before returning (`backend/app/services/investors.py:41-60`). The frontend compensates by wiping the `investments` list and guessing activity type by comparing net balances (`frontend/src/app/context/AppContext.tsx:61-80`, :493-510), so “Last Activity” timestamps and activity feeds stay outdated right after a change.

## 8. Security hardening follow-ups
- CORS is configured with `allow_origins=["*"]` and `allow_credentials=True` (`backend/app/main.py:20-34`), which browsers reject and is unsafe for production. Refresh token revocation relies on an in-memory set (`backend/app/services/auth.py:19-36`), so tokens become valid again after a server restart or across multiple instances. Both need attention before launch.
