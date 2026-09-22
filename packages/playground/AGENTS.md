# AGENTS.md - @semoss/playground

This document provides context for AI coding assistants working with the SEMOSS Playground application.

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Load the applicable
> [root skills](../../skills/README.md), including the [React standard](../../skills/react-standard.skill.md)
> and [SDK chat skill](../../skills/sdk-chat.skill.md) for room work.

## Overview

`@semoss/playground` is the SEMOSS chat application. It is private (not published), with
room, message, workspace, knowledge, and MCP surfaces.

## Structure & Conventions

The existing app uses `components/`, `contexts/`, `stores/`, `hooks/`, and `pages/`.
Follow the React skill's [architecture policy](../../skills/react-standard.skill.md#architecture-and-exports)
for new features and imports; existing feature folders are not an implicit migration task.

## Build System

- **Bundler**: Vite 8
- **Framework**: React 19 with TypeScript
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

Run these from `packages/playground`, or use `pnpm --filter @semoss/playground <command>`.

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

Highest to lowest priority for development: existing process environment,
`.env.development.local`, `.env.development`, `.env.local`, then `.env`.
Mode-specific files are optional; never edit local override files as part of repository work.

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
  "@semoss/i18n": "workspace:*",
  "@semoss/panels": "workspace:*",
  "@semoss/sdk": "workspace:*",
  "@semoss/shared": "workspace:*",
  "@semoss/ui": "workspace:*",
  "@semoss/workbench": "workspace:*"
}
```

Source-only libraries are compiled by the app. Built libraries need their build/watch
process running; use the root `pnpm dev:playground` command for dependency orchestration.

## The room sidebar

The right-hand panel is a `@semoss/workbench` dock. These details are not obvious from the
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
- **`RoomSidebar` always starts from `ROOM_SIDEBAR_LAYOUT`.** The sidebar arrangement is owned by
  the room instance and is not persisted between room sessions. Panels opened while the sidebar
  is closed remain in that room's workbench store until the sidebar mounts.
- **A restored file panel is re-pointed at the room's live insight.** A room binds to a fresh
  insight on every load, and a file panel's `mode.insightId` is what its reads and saves run
  against. `_syncSidebarFileMode` rewrites them once, before anything mounts.
- **Close and maximize live in the sidebar's own header**, because they act on the container. The
  only genuinely per-panel control — "open inline" — is registered by the tool panel with
  `useWorkbenchControl`.
- **The layout is not cached.** Each new `RoomStore` starts with the empty default arrangement,
  so switching rooms cannot bleed panel state between room instances.

Panel ids and the sidebar's default layout live in `stores/room/room-sidebar.ts`; the blueprints
live in `components/room/panels/`. Changing a panel type string affects only the current room
instance.

## Design-System Notes

Follow the root [Design System & Styling](../../AGENTS.md#design-system--styling) rules and
[DESIGN.md](../../DESIGN.md). The playground is an operational chat application, not a
visual sandbox; use the [root skills](../../skills/README.md) for UI behavior and validation.

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

Follow the [React standard](../../skills/react-standard.skill.md) for new-feature layout,
direct internal imports, state ownership, and tests. Preserve the room sidebar contracts above.

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
