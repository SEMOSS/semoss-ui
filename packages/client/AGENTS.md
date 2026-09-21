# AGENTS.md - @semoss/client

This document provides context for AI coding assistants working with the SEMOSS client — the
main web application.

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Load the applicable
> [root skills](../../skills/README.md), including the [React standard](../../skills/react-standard.skill.md).

## Overview

`@semoss/client` is the primary SEMOSS web application. Its workspace runtime dependencies
are `@semoss/automation`, `@semoss/i18n`, `@semoss/panels`, `@semoss/renderer`, `@semoss/sdk`,
`@semoss/shared`, `@semoss/terminal`, `@semoss/utility`, `@semoss/ui`, and `@semoss/workbench`.
Reuse their supported public APIs before adding local code.

## Build System

- **Bundler**: Vite 8
- **Framework**: React 19 + TypeScript
- **State**: MobX and Zustand; preserve the owning store's contract
- **Routing**: `react-router` 8
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

Run these from `packages/client`, or use `pnpm --filter @semoss/client <command>`.

### Path Alias

- `@/` → `./src/` (e.g. `import { useSession } from "@/hooks/use-session"`)

## Structure

The existing layout is below. Follow the React skill's
[architecture policy](../../skills/react-standard.skill.md#architecture-and-exports) for new
application features; this inventory does not require moving existing features.

| Folder / file | Purpose |
|---------------|---------|
| `api/` | API / pixel calls grouped by domain (`auth.ts`, `engines.ts`, `projects.ts`, …) |
| `assets/` | Images and static files |
| `components/` | Components grouped by feature area (`project/`, `engine/`, `settings/`, …) |
| `contexts/` | React contexts (`<name>.context.tsx`) |
| `hooks/` | React hooks (`use-<name>.ts`) |
| `pages/` | Routing tree (see below) |
| `stores/` | State owners (`assistant/`, `config/`, `designer/`, `page/`, `session/`, `workbench/`, `workspace/`) |
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

> Older route files may use legacy naming. Follow the React skill's
> [naming policy](../../skills/react-standard.skill.md#types-and-naming); do not turn an
> unrelated edit into a route-file migration.

## State Management

- **Application state** is split among the existing stores, including session and config.
  Use their owning hooks, such as `hooks/use-session.ts` and `hooks/use-config.ts`; there is
  no `stores/root`, `stores/monolith`, or `useRootStore` entry to extend.
- **Domain state** uses its existing context/store contract. See the
  [client workbench guide](./src/components/workbench/AGENTS.md) for dock, assistant,
  permission, database, and model-chat state. General local-state and orchestration rules
  belong to the [React skill](../../skills/react-standard.skill.md#logic-state-and-effects).

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
- Overlay migration and the ECharts exception follow [DESIGN.md](../../DESIGN.md).
- **Scoped reference**: `src/components/ui/section/section.tsx` demonstrates a small local
  composite using `cn()` and token classes. Do not treat an entire application file as a
  blanket design exemplar; audit the specific pattern before reusing it.

## Agent Guardrails

### Be Cautious With

- **`vite.config.ts`** — dev server, build, and test configuration.
- **`stores/session/`** — shared session state and permission ownership affect multiple surfaces.

### Known Gotchas

- TypeScript and lint rules follow the [React standard](../../skills/react-standard.skill.md).
- `usePixel` results expose `error` and `refresh`, but **not** `isError` / `isLoading` or
  iterator methods like `reset`.
- Record the actual type-check result and distinguish introduced failures from unrelated
  baseline errors; filtering to touched paths alone can miss broken consumers:
  ```bash
  pnpm --filter @semoss/client type-check
  ```

### Testing Changes

```bash
pnpm --filter @semoss/client test
pnpm --filter @semoss/client type-check
pnpm --filter @semoss/client dev      # Manual verification
```
