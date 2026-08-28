# AGENTS.md - @semoss/client

This document provides context for AI coding assistants working with the SEMOSS client — the
main web application.

> **Inherits from:** [../../AGENTS.md](../../AGENTS.md) for code style, file-naming, package
> structure, commit messages, Biome config, and Node/pnpm requirements.

## Overview

`@semoss/client` is the primary SEMOSS web application. It depends on every workspace lib
(`@semoss/renderer`, `@semoss/sdk`, `@semoss/shared`, `@semoss/ui`, `@semoss/i18n`,
`@semoss/terminal`) — reuse those before adding local code.

## Build System

- **Bundler**: Vite 7
- **Framework**: React 18 + TypeScript
- **State**: MobX (`mobx` + `mobx-react-lite`)
- **Routing**: `react-router-dom` 6
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (development mode) |
| `pnpm build` | Production build |
| `pnpm build:dev` | Development build |
| `pnpm type-check` | `tsc --noEmit` type check |
| `pnpm test` | Run tests once |
| `pnpm test:ui` | Vitest UI |
| `pnpm test:watch` | Tests in watch mode |
| `pnpm test:coverage` | Coverage report |

### Path Alias

- `@/` → `./src/` (e.g. `import { useRootStore } from "@/hooks"`)

## Structure

An application, so it uses the full `src/` layout from the root AGENTS.md including `pages/`:

| Folder / file | Purpose |
|---------------|---------|
| `api/` | API / pixel calls grouped by domain (`auth.ts`, `engines.ts`, `projects.ts`, …) |
| `assets/` | Images and static files |
| `components/` | Components grouped by feature area (`project/`, `engine/`, `settings/`, …) |
| `contexts/` | React contexts (`<name>.context.tsx`) |
| `hooks/` | React hooks (`use-<name>.ts`) |
| `pages/` | Routing tree (see below) |
| `stores/` | MobX stores, one folder per store (`root/`, `config/`, `monolith/`, `workspace/`, …) |
| `types/` | TypeScript types (`<name>.types.ts`) |
| `utility/` | Utility functions grouped by type |
| `main.tsx`, `App.tsx`, `index.css` | App entry files |

### Routing (`pages/`)

- `router.tsx` — entry point. Defines the `Router` (`observer`) plus `RouteConfig` and the
  `renderRoute` helper; lazy-loads feature routers with `React.lazy`.
- `<name>.routes.tsx` — exports a route-config array (e.g. `PROJECT_ROUTES` in
  `pages/project/project.routes.tsx`).
- `<name>.layout.tsx` — layout for a route subtree.
- `<name>.page.tsx` — a page component.
- Feature areas live in subfolders (`pages/project/`, `pages/engine/`, `pages/settings/`, …).

> Older route files use the legacy dash form (`login-page.tsx`, `authenticated-layout.tsx`).
> Migrate to the dot role-suffix (`login.page.tsx`, `authenticated.layout.tsx`) as you touch
> them — do not mass-rename.

## State Management

- **Application state — MobX central store.** A single root store composes the others
  (`configStore`, `monolithStore`, …). Access it with the `useRootStore` hook:
  ```typescript
  import { useRootStore } from "@/hooks";

  const { configStore, monolithStore } = useRootStore();
  ```
  Wrap components that read observable state in `observer` from `mobx-react-lite`.
- **Feature state — React context + hook.** Each feature encapsulates its state in a context
  (`<feature>.context.tsx`) exposed through a custom hook (e.g. `EngineContext` → `useEngine`,
  `WorkspaceContext` → `useWorkspace`), keeping feature state isolated from the global store.

## Styling

Follow the root [Design System & Styling](../../AGENTS.md#design-system--styling) rules and
[DESIGN.md](../../DESIGN.md). Client-specific notes:

- **Priority boy-scout targets** (highest violation density — migrate to tokens/components as
  you touch them): `src/components/blocks-workspace/blocks/settings/**` (especially
  `custom/e-charts/**` and `shared/ColorPalatteSettings.tsx` — hex classes, inline colors,
  arbitrary sizes).
- **Ad-hoc status color maps to fold into tokens when touched**:
  `components/engine/engine-metadata-display.tsx` (`BADGE_TONES`),
  `pages/app/app-detail-tabs/commits-tab.tsx`, `pages/project/agent/agent-run-graph.tsx`.
  Use `Badge` variants + `destructive`/`success`/`warning`/`chart-*` tokens instead.
- **Overlays**: 9 hand-rolled `fixed inset-0` modals exist with divergent backdrops
  (`bg-black/50|/40|/30`, `bg-background/50`) and z-hacks (`z-[100]`, `z-[1300]`, `z-[1501]`).
  Never add a tenth — use `Dialog`/`Sheet`; replace hand-rolled ones when touched.
- **ECharts carve-out**: chart option objects need literal colors — take them from the
  `chart-1`…`chart-5` token values via one shared constants map, never per-file hex.
- **Scoped reference**: `src/components/ui/section/section.tsx` demonstrates a small local
  composite using `cn()` and token classes. Do not treat an entire application file as a
  blanket design exemplar; audit the specific pattern before reusing it.

## Agent Guardrails

### Be Cautious With

- **`vite.config.ts`** — dev server, build, and test configuration.
- **`stores/root`** — the root store wires everything together.

### Known Gotchas

- **Biome forbids TypeScript non-null assertions** (`!`) — guard nullable values explicitly.
- **No explicit `any`** — Biome errors on it.
- `usePixel` results expose `error` and `refresh`, but **not** `isError` / `isLoading` or
  iterator methods like `reset`.
- The package currently has many **pre-existing `tsc` errors** in unrelated files. After a
  change, grep the type-check output for *your* files rather than assuming a clean baseline:
  ```bash
  pnpm --filter @semoss/client type-check
  ```

### Testing Changes

```bash
pnpm --filter @semoss/client test
pnpm --filter @semoss/client type-check
pnpm --filter @semoss/client dev      # Manual verification
```
