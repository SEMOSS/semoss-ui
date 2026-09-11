# AGENTS.md - @semoss/playground

This document provides context for AI coding assistants working with the SEMOSS Playground application.

> **Inherits from:** [../../AGENTS.md](../../AGENTS.md) for code style, file-naming, package
> structure, commit messages, Biome config, and Node/pnpm requirements.

## Overview

`@semoss/playground` is a development playground application for testing SEMOSS SDK features and components. It's a private package (not published) used for development and experimentation.

## Structure & Conventions

Follows the standard `src/` layout and file-naming rules from the root AGENTS.md. As an
application it uses `contexts/`, `stores/`, `hooks/`, and a `pages/` router tree
(`router.tsx` / `<name>.routes.tsx` / `<name>.layout.tsx` / `<name>.page.tsx`).

## Build System

- **Bundler**: Vite 7
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest with jsdom

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server on port 5174 |
| `pnpm build` | Production build |
| `pnpm build:dev` | Development build |
| `pnpm test` | Run tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:ui` | Run tests with Vitest UI |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm type-check` | TypeScript type checking |

## Environment Variables

### `.env` (Development Defaults)

```bash
# Server proxy configuration
ENDPOINT=http://localhost:9090    # Backend server URL
MODULE=/Monolith                   # Deployed instance path

# Platform
VITE_PLATFORM_URL="../../client/dist"

# Theming
VITE_NAME="Playground"
VITE_THEME="{}"

# Model configuration
VITE_DEFAUlT_MODEL_ID=""
VITE_DEFAUlT_MODEL_NAME=""
```

### Environment File Precedence

- `.env` - Checked into git, safe defaults
- `.env.local` - Local overrides (gitignored)
- `.env.development` - Development-specific
- `.env.development.local` - Local dev overrides (gitignored)

## Vite Configuration

### Proxy Setup

The dev server proxies API requests to the backend:

```typescript
server: {
  port: 5174,
  proxy: {
    [MODULE]: {
      target: ENDPOINT,
      changeOrigin: true,
      secure: false,
    },
  },
}
```

### Path Aliases

- `@/` → `./src/` (e.g., `import { foo } from "@/components/foo"`)

## Testing Configuration

### Vitest Setup

- **Environment**: jsdom
- **Pool**: vmForks (for isolation)
- **Timeout**: 10 seconds
- **Setup file**: `vitest.setup.ts`

The setup file includes:
- `@testing-library/jest-dom` matchers
- Canvas mock for components using `<canvas>`

### Coverage

Coverage reports output to `./coverage/packages/playground/` and include only `src/components/`.

## Workspace Dependencies

```json
{
  "@semoss/panels": "workspace:*",
  "@semoss/sdk": "workspace:*",
  "@semoss/shared": "workspace:*",
  "@semoss/ui": "workspace:*",
  "@semoss/workbench": "workspace:*"
}
```

Changes to these libraries are immediately reflected in the playground during development.

## The room sidebar

The right-hand panel is a `@semoss/workbench` dock. Five things about it are not obvious from the
code and are easy to undo by accident:

- **The dock store belongs to `RoomStore`, not to `<Workbench>`.** Tools open panels from outside
  React and while the sidebar is closed, and the arrangement has to survive closing it — which
  unmounts the shell. `RoomStore` builds the store and restores its arrangement in its
  constructor; `<WorkbenchProvider store={room.workbench}>` only hands it down.
- **Blueprints are handed to `RoomStore`, not registered later.** They reach into `@/components`,
  which imports `@/stores`, so the store cannot import them without closing a module cycle. The
  composition root passes them instead: `MainLayout` → `ChatStore` → `RoomStore`, plus the two
  places that build a room directly (`new-room-page`, the new-file-explorer menu item). They have
  to be in place before the first `openSidebarPanel`, which for a streaming tool is long before
  anything mounts — without them the dock falls back to a shallow compare of config, and since a
  file panel's `mode` is a fresh object per call, every open would spawn another tab.
- **`RoomSidebar` passes `persistSidebar` as both `onChange` and `onUnmount`.** The first covers
  every rearrangement while the sidebar is on screen; the second catches the close, which is a
  MobX-only change the dock never sees. Both are shell-scoped, so a panel opened into a *closed*
  sidebar is in memory only until one of them next fires — a snapshot is the whole arrangement,
  not a delta, so the next write carries it. `room-sidebar.test.ts` pins that boundary.
- **A restored file panel is re-pointed at the room's live insight.** A room binds to a fresh
  insight on every load, and a file panel's `mode.insightId` is what its reads and saves run
  against. `_syncSidebarFileMode` rewrites them once, before anything mounts.
- **Close and maximize live in the sidebar's own header**, because they act on the container. The
  only genuinely per-panel control — "open inline" — is registered by the tool panel with
  `useWorkbenchControl`.
- **The layout is cached per room** (`smss--playground-room--<roomId>--1`, via `useCacheState`'s
  React-free twins), so switching rooms cannot bleed, and one entry accumulates per room ever
  opened. The name carries the version: bump the suffix in `getRoomSidebarCacheName` when a
  snapshot's shape changes.

Panel ids and the sidebar's default layout live in `stores/room/room-sidebar.ts`; the blueprints
live in `components/room/panels/`. Changing a panel type string drops that panel out of every
cached sidebar.

## Design-System Notes

Follow the root [Design System & Styling](../../AGENTS.md#design-system--styling) rules and
[DESIGN.md](../../DESIGN.md). The playground is an operational chat application, not a looser
visual sandbox: new user-facing UI uses `@semoss/ui/next`, semantic tokens, the standard state
set, and the responsive/accessibility definition of done.

## Agent Guardrails

### Do Not Modify

- **`.env.local`** / **`.env.*.local`** - Local developer overrides (gitignored)
- **Proxy target URLs** in committed `.env` - May contain sensitive endpoints
- **`ACCESS_KEY`** / **`SECRET_KEY`** - Credentials (only in local env files)

### Be Cautious With

- **`vite.config.ts`** - Affects dev server, build, and test configuration
- **Proxy configuration** - Changes affect how API requests are routed
- **`vitest.setup.ts`** - Changes affect all tests

### When Adding Features

1. Use workspace dependencies (`@semoss/sdk`, `@semoss/ui`, `@semoss/shared`)
2. Add tests for new components in `__tests__/` or `*.test.tsx`
3. Use the `@/` alias for imports within the package
4. Follow existing patterns for page/component structure

### Testing Changes

```bash
pnpm test           # Run tests
pnpm type-check     # Verify TypeScript
pnpm dev            # Manual testing
```

### Running with Backend

To connect to a local SEMOSS backend:

1. Start the backend on port 9090 (or update `ENDPOINT` in `.env.local`)
2. Run `pnpm dev`
3. Access at http://localhost:5174
