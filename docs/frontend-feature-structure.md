# ADR: Feature-First Frontend Structure

## Status
Accepted – Task 1.1 of the modularization plan.

## Context
The current frontend keeps most domain logic inside `src/app/context/AppContext.tsx` and spreads components/hook utilities across flat folders (`src/app/pages`, `src/hooks`, `src/lib`). Discovering where a capability lives is difficult, side-effects bleed between features, and isolated testing is painful because services/UI/state are not co-located.

## Decision
Adopt a feature-first directory layout where every business capability owns its types, services, hooks, and UI. Shared primitives (design system, API client, configs) live in dedicated `shared` buckets. This keeps code discoverable, reduces cross-feature coupling, and provides clear seams for tests.

### Canonical Directory Skeleton

```
src/
  features/
    <feature-name>/
      components/       # UI pieces unique to the feature
      hooks/            # Feature-specific hooks
      services/         # API clients, mappers, state machines
      state/            # Context, Zustand, or reducers (optional)
      types.ts          # Domain models for the feature
      index.ts          # Re-export public surface
  shared/
    ui/                 # design-system primitives (moved from app/components/ui)
    lib/                # api client, auth, timezone helpers, etc.
    config/             # env parsing, constants
  app/                  # Next.js entrypoints (layout, page shells, providers)
```

### Feature Conventions
- **Naming**: features use kebab-case folder names (`auth`, `transactions`, `investors`, `users`, `insights`). Files inside follow PascalCase for React components and camelCase for hooks/services.
- **Public API**: each feature exposes only what pages need via `src/features/<feature>/index.ts` (e.g., `export * from './hooks/useTransactions'`).
- **Services**: network calls, DTO mappers, and derived calculations live under `services/`. Keep mapping logic (`mapTransactionResponse`, investor aggregations) here instead of duplicating it in hooks.
- **State**: contexts or stores that are feature-scoped live under `state/`. Global providers compose them in `src/app/providers.tsx`.
- **Components**: UI unique to a feature sits under `components/`. Shared layout or widgets go into `src/shared/ui/`.
- **Tests**: colocate unit tests next to the file they cover using `.test.ts(x)` suffixes for easy discovery.

### Migration Guidelines
1. **Create shared buckets first**: move `src/app/components/ui` → `src/shared/ui` and `src/lib` → `src/shared/lib` to unblock imports.
2. **Carve out feature folders incrementally**:
   - Copy domain types + DTO mappers into `types.ts` / `services`.
   - Build feature-specific contexts/hooks and update pages to consume them.
   - Delete the migrated slices from `AppContext` once consumers switch.
3. **Keep imports feature-local**: hooks should import from their feature’s `services`/`types`, not directly from other features.
4. **Document surface area**: update each `index.ts` as the canonical export list to make tests and future refactors easier.
5. **Testing**: when moving logic, add or move tests next to the new modules to ensure behavior parity.

## Consequences
- Clear ownership boundaries enable contributors to locate code quickly and write focused tests.
- Incremental migration is possible: features can be moved one-by-one without breaking the app.
- Shared UI/lib folders prevent regression when multiple features rely on the same primitive.

