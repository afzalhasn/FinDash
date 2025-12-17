# FinDash Frontend Modularization Plan

Goal: restructure the frontend so that each domain feature owns its state, services, and UI. This improves discoverability, keeps responsibilities co-located, and makes isolated testing easier.

## Epic 1: Establish Feature-First Directory Layout
Define the skeleton that every feature (auth, transactions, investors, insights) will follow before moving code.

- **Task 1.1 — Draft the feature-folder blueprint** ✅  
  Document the canonical tree (`src/features/<feature>/{components,hooks,services,types}`) and rules for colocating UI/service/state assets. Captured in [docs/frontend-feature-structure.md](./frontend-feature-structure.md).  
  _Story 1.1.1_: Produce an ADR-style note describing layout conventions, naming, and migration guidelines. ✅

- **Task 1.2 — Create shared infrastructure buckets** ✅  
  Introduce `src/shared/{ui,lib,config}` so cross-feature primitives (design system, api client, auth helpers) have a neutral home. Initial buckets now live under `src/shared/ui` and `src/shared/lib`.  
  _Story 1.2.1_: Move `src/app/components/ui` into `src/shared/ui` and update import paths. ✅  
  _Story 1.2.2_: Move `src/lib/{api,auth,timezone}` into `src/shared/lib` and export re-usable helpers from an index file. ✅

## Epic 2: Extract Feature Modules from AppContext
Break the monolithic `AppContext` into smaller, testable providers/services owned by each feature.

- **Task 2.1 — Create Auth feature module** ✅  
  Build `src/features/auth/{context,services}` that encapsulate login/logout, token persistence, and route guarding. Delivered via `src/features/auth/{types,routes,context.tsx}` and wired through `App.tsx`.  
  _Story 2.1.1_: Move auth-specific types and helpers from `AppContext` into `features/auth/types.ts`. ✅  
  _Story 2.1.2_: Implement `AuthProvider` + `useAuth` hook that exposes the current user and auth actions. ✅  
  _Story 2.1.3_: Update `AppRouter` to consume `useAuth` instead of the legacy context. ✅

- **Task 2.2 — Create Transactions feature module** ✅  
  Own transaction types, inventory logic, and hooks under `src/features/transactions`. The module now ships `types.ts`, `services/api.ts`, and hooks for transactions, inventory, and product helpers.  
  _Story 2.2.1_: Move transaction DTO mappers (`mapTransactionResponse`) into `features/transactions/services/api.ts`. ✅  
  _Story 2.2.2_: Extract the inventory utilities from `AddEntryPage` and expose them as `useInventory` hook. ✅  
  _Story 2.2.3_: Collocate `useTransactions` hook and ensure it only depends on the new module. ✅

- **Task 2.3 — Create Investors & Users modules**  
  Mirror the approach for investors and user management.  
  _Story 2.3.1_: Move investor mapper + CRUD helpers into `features/investors`.  
  _Story 2.3.2_: Move user-role logic (toggle, role update) into `features/users/services`.  
  _Story 2.3.3_: Replace direct `AppContext` calls in pages with feature hooks.

## Epic 3: Introduce Page Shell & Shared Layout Components
Remove repeated layout code and standardize page scaffolding.

- **Task 3.1 — Build `PageLayout` component**  
  Encapsulate shared header/back button/time filter slots under `src/shared/ui/layout`.  
  _Story 3.1.1_: Extract the dashboard header into `PageHeader`.  
  _Story 3.1.2_: Update Add Entry, Transactions, Insights pages to use the shared shell.

- **Task 3.2 — Create reusable filter/date controls**  
  Encapsulate the repeated time range filters and date pickers.  
  _Story 3.2.1_: Implement `DateRangeFilter` component with presets (today/week/month/custom).  
  _Story 3.2.2_: Replace bespoke filter code in Dashboard/ProductInsights with the new component.

## Epic 4: Hardening & Tests
Ensure each module can be tested in isolation.

- **Task 4.1 — Add unit tests for services/hooks**  
  _Story 4.1.1_: Write tests for auth services (token persistence, `isAuthorized`).  
  _Story 4.1.2_: Test transaction inventory math and filtering.  
  _Story 4.1.3_: Cover investor net-balance adjustments.

- **Task 4.2 — Add integration smoke tests per feature**  
  _Story 4.2.1_: Create Playwright scenarios for new feature routes (auth, transactions).  
  _Story 4.2.2_: Add a CI checklist to ensure modules export the expected public API.
