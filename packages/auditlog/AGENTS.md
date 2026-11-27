# AGENTS.md - @semoss/auditlog-package

> **Inherits from:** [root AGENTS.md](../../AGENTS.md): non-negotiables, task skills, and [standards](../../docs/README.md#standards).

## Purpose

A private standalone dashboard for viewing SEMOSS audit logs.

## Boundaries

- **State:** `stores/root.store.ts` (MobX) is the only store and migrates as one scoped change.
  New shared state uses a `StoreState` store ([state standard](../../docs/standards/react.md#state)).
- New features follow the [architecture standard](../../docs/standards/general.md#architecture).
  Do not relocate existing folders, or rename legacy page files
  ([naming](../../docs/standards/general.md#naming)), without explicit migration scope.

## Invariants

- **Sign in is the SDK's `Session`, not an insight.** `main.tsx` calls `void Session.initialize()`
  before the first render (after `app.tsx` sets the module). `pages/AuthenticatedLayout.tsx` gates
  on the session status: a spinner while `INITIALIZING`, `/login` when `UNAUTHENTICATED`, and
  Retry (`useSessionRetry`) on `ERROR`.
- **There is no `InsightProvider`.** The audit log page runs its report and export in the
  session's own insight (`useSessionInsight()`); nothing here calls `useInsight()`.
- **Keep the dense list, filter, and table composition** when restyling; follow
  [DESIGN.md](../../DESIGN.md) and the [styling standard](../../docs/standards/ui.md#styling).

## Validation

```bash
pnpm check
pnpm --filter @semoss/auditlog-package build
pnpm --filter @semoss/auditlog-package test   # --passWithNoTests: success may mean no tests ran
```
