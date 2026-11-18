# AGENTS.md - @semoss/auditlog-package

This document provides context for AI coding assistants working with the SEMOSS audit log
dashboard application.

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Load the applicable
> [root skills](../../skills/README.md), including the [React standard](../../skills/react-standard.skill.md).

## Overview

`@semoss/auditlog-package` is a standalone dashboard application for viewing SEMOSS audit
logs. It is a **private** package built with Vite, MobX, and `react-router`.

## Build System

- **Bundler**: Vite 8
- **State**: MobX (`mobx` + `mobx-react-lite`), legacy. `stores/root.store.ts` is the only
  store; new shared state uses a `StoreState`-backed store per the
  [state management skill](../../skills/state-management.skill.md), and the root store
  migrates as one scoped change.
- **Routing**: `react-router` 8
- **Styling**: Tailwind CSS v4

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm test` | Vitest (`--passWithNoTests`; success may mean no tests ran) |
| `pnpm preview` | Preview the production build |

Run these from `packages/auditlog`, or use `pnpm --filter @semoss/auditlog-package <command>`.

### Linting

Follow the [React validation guidance](../../skills/react-standard.skill.md#validation).
Linting and formatting use Biome from the repository root (`pnpm check`); this package has
no local lint configuration.

## Structure

The existing layout is below. New application features follow the
[React architecture policy](../../skills/react-standard.skill.md#architecture-and-exports);
do not relocate existing features without explicit migration scope.

| Folder / file | Purpose |
|---------------|---------|
| `assets/` | Images and static files |
| `components/` | Components (one per file) |
| `contexts/` | React contexts (`<name>.context.tsx`) |
| `hooks/` | React hooks (`use-<name>.ts`) |
| `pages/` | Routing tree — `router.tsx`, layouts, pages |
| `stores/` | Stores (`<name>.store.ts`); MobX today, `StoreState` for new ones |
| `types.d.ts` | Ambient TypeScript types |
| `app.tsx`, `main.tsx`, `index.css` | App entry files |

### Sign in

Sign in is the SDK's `Session`, not an insight. `main.tsx` calls `void Session.initialize()`
before the first render (after `app.tsx` set the module). `pages/AuthenticatedLayout.tsx`
gates on `useSession((state) => state.status)`: a spinner while `INITIALIZING`, `/login` when
`UNAUTHENTICATED`, and `layout.loadFailed` with Retry (`useSessionRetry` from `@semoss/sdk/react`) on `ERROR`. Once
`AUTHENTICATED` it renders the pages. The app has no `InsightProvider`: the audit log page
runs its report and export in the session's own insight (`useSessionInsight()`), so nothing
here calls `useInsight()`. `LoginPage` renders the shared `LoginForm` and redirects once
`AUTHENTICATED`.

> Some page files retain legacy names. Apply the React skill's
> [naming policy](../../skills/react-standard.skill.md#types-and-naming) without unrelated renames.

## Design-System Notes

Follow the root [Design System & Styling](../../AGENTS.md#design-system--styling) rules and
[DESIGN.md](../../DESIGN.md). Preserve the audit dashboard's dense list/filter/table
composition; responsive and accessible behavior follow the [root skills](../../skills/README.md).

## Agent Guardrails

### Be Cautious With

- **`vite.config.ts`** — dev server and build configuration.

### Testing Changes

```bash
pnpm check
pnpm --filter @semoss/auditlog-package build
```
