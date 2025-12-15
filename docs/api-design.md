# FinDash API Design

This document translates the current frontend context logic (`frontend/src/app/context/AppContext.tsx`) into the backend REST API that the new FastAPI service will expose. Endpoints are grouped by domain. All routes live under the `/api/v1` prefix and exchange JSON unless noted otherwise.

## 1. Conventions

1. **Auth**: OAuth2 password flow with JWT access tokens. Use `Authorization: Bearer <token>` on authenticated routes. Refresh tokens are HTTP-only cookies or persisted per client.
2. **Roles**: `admin`, `partner`, `staff`. Role gates reuse the same matrix enforced by the frontend router.
3. **Errors**: Consistent JSON payload and correlation ID is echoed via `X-Correlation-ID` header:
  ```json
  { "detail": "Human-readable message", "code": "ERROR_CODE", "correlationId": "<optional-id>" }
  ```
4. **Dates**: ISO 8601 strings in UTC.
5. **Pagination**: Cursor-based (`nextCursor`, `prevCursor`) or simple `page`/`pageSize` where noted.

---

## 2. Authentication & Session

| Method | Path | Description | Roles |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/login` | Exchange email/password for access + refresh tokens. | Public |
| `POST` | `/api/v1/auth/refresh` | Refresh access token using refresh token (stored in HTTP-only cookie). | Authenticated |
| `POST` | `/api/v1/auth/logout` | Revoke refresh token / clear cookie. | Authenticated |
| `GET` | `/api/v1/auth/me` | Return current user profile (+ role). | Authenticated |

**Login request**
```json
{ "email": "admin@findash.com", "password": "password" }
```

**Login response**
```json
{
  "accessToken": "jwt-access",
  "refreshToken": "jwt-refresh",
  "expiresIn": 3600,
  "user": {
    "id": "1",
    "name": "Admin User",
    "email": "admin@findash.com",
    "role": "admin",
    "disabled": false
  }
}
```

**Refresh failure response**
```json
{ "detail": "Refresh token revoked", "code": "TOKEN_REVOKED", "correlationId": "..." }
```

---

## 3. Users & Account Management

These endpoints replace `addUser`, `updateUserRole`, and `disableUser` from the context. Only admins can mutate users.

| Method | Path | Description | Roles |
| --- | --- | --- | --- |
| `GET` | `/api/v1/users` | List users with role/status filters. | `admin` |
| `POST` | `/api/v1/users` | Create new user (staff/partner/admin). | `admin` |
| `GET` | `/api/v1/users/{userId}` | Fetch single user. | `admin` |
| `PATCH` | `/api/v1/users/{userId}` | Update role, name, or email. | `admin` |
| `PATCH` | `/api/v1/users/{userId}/disable` | Soft-disable account. | `admin` |

**Create user request**
```json
{
  "name": "Jane Staff",
  "email": "jane@findash.com",
  "role": "staff",
  "password": "temp-password"
}
```

**List response**
```json
{
  "items": [
    { "id": "1", "name": "Admin User", "email": "admin@findash.com", "role": "admin", "disabled": false }
  ]
}
```

---

## 4. Transactions & Inventory

Mirrors `transactions`, `addTransaction`, and `getAvailableProducts`.

| Method | Path | Description | Roles |
| --- | --- | --- | --- |
| `GET` | `/api/v1/transactions` | Paginated list with filters: `type`, `product`, `person`, `startDate`, `endDate`. | `admin`, `partner`, `staff` (staff read-only) |
| `POST` | `/api/v1/transactions` | Create buy/sell/expense entry. Validates role (staff cannot create). | `admin`, `partner` |
| `GET` | `/api/v1/transactions/{id}` | Fetch transaction detail. | `admin`, `partner`, `staff` |
| `PATCH` | `/api/v1/transactions/{id}` | Update editable fields (notes, price, etc.). | `admin`, `partner` |
| `DELETE` | `/api/v1/transactions/{id}` | Optional soft delete. | `admin` |
| `GET` | `/api/v1/products/available` | Return unique product names derived from `buy` transactions (for sell validation). | `admin`, `partner` |

**Create transaction request**
```json
{
  "type": "sell",
  "productName": "Laptop",
  "quantity": 2,
  "quantityType": "unit",
  "pricePerUnit": 1200,
  "totalAmount": 2400,
  "notes": "Sold to ACME",
  "occurredAt": "2024-12-13T12:00:00Z"
}
```

**List response snippet**
```json
{
  "items": [
    {
      "id": "txn_123",
      "type": "expense",
      "expenseCategory": "rent",
      "totalAmount": 1500,
      "personName": "Admin User",
      "occurredAt": "2024-12-01T00:00:00Z",
      "notes": "Office rent"
    }
  ],
  "page": 1,
  "pageSize": 25,
  "total": 48
}
```

---

## 5. Investors & Capital Activity

Implements `addInvestor`, `addInvestment`, and `addWithdrawal`.

| Method | Path | Description | Roles |
| --- | --- | --- | --- |
| `GET` | `/api/v1/investors` | List investors with aggregate totals. | `admin` |
| `POST` | `/api/v1/investors` | Create new investor profile. | `admin` |
| `GET` | `/api/v1/investors/{id}` | Fetch investor detail plus activity history. | `admin` |
| `POST` | `/api/v1/investors/{id}/activities` | Add investment or withdrawal. Enforces balance rules. | `admin` |

**Create investor request**
```json
{ "name": "Michael Chen" }
```

**Add activity request**
```json
{
  "type": "withdrawal",
  "amount": 5000,
  "notes": "Partial withdrawal",
  "occurredAt": "2024-12-10T10:00:00Z"
}
```

**Investor detail response**
```json
{
  "id": "inv_1",
  "name": "Michael Chen",
  "totalInvested": 50000,
  "totalWithdrawn": 5000,
  "netInvestment": 45000,
  "lastActivityAt": "2024-12-10T10:00:00Z",
  "activities": [
    { "id": "act_1", "type": "investment", "amount": 50000, "occurredAt": "2024-12-01T08:00:00Z", "notes": "Initial investment" }
  ]
}
```

---

## 6. Dashboard & Insights

Provides aggregated metrics for dashboard cards and insights screens.

| Method | Path | Description | Roles |
| --- | --- | --- | --- |
| `GET` | `/api/v1/insights/summary` | Totals for purchases, sales, expenses, net profit, investor cash-in/out filtered by date range. | `admin`, `partner`, `staff` |
| `GET` | `/api/v1/insights/products` | Per-product profit/loss, margin, top/bottom performers. | `admin`, `partner`, `staff` |
| `GET` | `/api/v1/insights/timeseries` | Revenue/expense trends grouped by day/week/month. | `admin`, `partner`, `staff` |

**Summary response**
```json
{
  "filters": { "range": "this_month" },
  "purchases": 4300,
  "sales": 6640,
  "expenses": 1700,
  "profit": 640,
  "investorCashIn": 80000,
  "investorCashOut": 5000
}
```

---

## 7. Utility & Health

| Method | Path | Description | Roles |
| --- | --- | --- | --- |
| `GET` | `/api/v1/health/live` | Liveness probe for orchestrators. | Public |
| `GET` | `/api/v1/health/ready` | Readiness probe verifying DB connection. | Public |

Optionally expose `/metrics` for Prometheus or `/docs`/`/openapi.json` powered by FastAPI.

---

## 8. Sequence Diagrams (Narrative)

1. **Login Flow**
   - User submits email/password → `POST /auth/login`.
   - Backend validates credentials, issues tokens, stores refresh token metadata.
   - Frontend stores access token in memory and redirects to dashboard.
2. **Transaction Creation**
   - User opens Add Entry → fetches `/products/available` + `/transactions?filters`.
   - On submit, call `POST /transactions`; API records person info using JWT claims and returns created record.
   - Frontend invalidates queries (`transactions`, `insights-summary`) to refresh dashboard cards.
3. **Investor Withdrawal**
   - Admin opens Investor detail via `GET /investors/{id}`.
   - Submits withdrawal form → `POST /investors/{id}/activities` with `type="withdrawal"`.
   - Service checks `netInvestment - amount >= 0`; updates aggregates; response returns new totals.

---

Use this API contract while building the FastAPI routers and when refactoring the frontend to consume server data instead of local context state. Any additions (e.g., notifications, audit logs) should extend this document to keep the contract transparent.
