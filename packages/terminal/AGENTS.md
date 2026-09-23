# AGENTS.md - @semoss/terminal

This document provides context for AI coding assistants working with the SEMOSS embedded
terminal application.

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Load the applicable
> [root skills](../../skills/README.md), including the [React standard](../../skills/react-standard.skill.md).

## Overview

`@semoss/terminal` is the embedded terminal UI. It is a **private** package that is both:
- **consumed by `@semoss/client`** as a component library (its `exports` point at
  `./src/index.ts`), and
- **runnable standalone** for development via Vite (`index.html` + `main.tsx`).

It builds its panels on `@semoss/workbench`, the same dock the client's workbenches and
the playground's room sidebar use, and its file panes on `@semoss/panels`.

## Build System

- **Bundler**: Vite 8 (standalone dev/build); source is consumed directly by the client.

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start standalone dev server |
| `pnpm build` | Production build |
| `pnpm build:dev` | Development build |
| `pnpm type-check` | `tsc --noEmit` type check |
| `pnpm test` | Run tests (`vitest run --passWithNoTests`) |

Run these from `packages/terminal`, or use `pnpm --filter @semoss/terminal <command>`.

### Path Alias

- `@/` → `./src/`

## Structure

A component app with no `pages/` router. The existing layout is below; new application
features follow the [React architecture policy](../../skills/react-standard.skill.md#architecture-and-exports)
without requiring a migration of these embedded components.

| Folder / file | Purpose |
|---------------|---------|
| `assets/` | Images and static files |
| `components/` | Terminal UI (`terminal/`, `terminal-console/`, `terminal-console-panel/`, `embed-terminal/`, `terminal-file/`) |
| `utility/` | Utility functions |
| `types.ts` | Shared TypeScript types |
| `app.tsx`, `main.tsx`, `index.css` | Standalone app entry files |
| `index.ts` | Barrel consumed by `@semoss/client` |

## Key Dependencies

- `@semoss/workbench` — the dock. Three panel types: explorer, file editor, repl
- `@semoss/panels` — `FileExplorerPane` for the tree, and `useFilePanel` /
  `useFileBuffer` for the editor
- `@semoss/ui`, `@semoss/shared`, `@semoss/sdk`, `@semoss/i18n`
- `zustand` — peer of the dock; read its store with `useWorkbench`

## The dock

Five things are worth knowing before changing the layout:

- **`terminal.panels.tsx` holds the three blueprints.** The "+" is a
  `useWorkbenchControl` on the repl panel, not chrome drawn on a tabset, so a
  split pair each get their own — and it reads `allowMultiple` off the panel's
  config, because a chrome control only ever receives its own panel's.
- **Help and User are a `borderSlots` entry.** A rail draws slot content even
  with no panel docked to it, which is what keeps them reachable while Files is
  collapsed. They used to be portaled into FlexLayout's toolbar DOM, found by a
  MutationObserver.
- **`TerminalDockBindings` is a renderless child of the provider.** Opening
  files, the min-one-terminal rule, and tab re-localization all need
  `useWorkbench`, and keeping them out of the shell stops it re-rendering on
  layout changes it does not draw.
- **RTL moves the Files panel to the other border.** `WorkbenchSide` is physical
  by design — the dock does not mirror itself — so the layout is built for the
  side the language wants. There is no `dir="ltr"` fence any more; that existed
  only because FlexLayout's splitter drag math is LTR-only. **Check Arabic when
  you touch the layout.**
- **The layout persists** per (location, multi/single), where a fresh model used
  to be built on every mount.

The editor's config is a `FilePanelMode`, not the wider `FileMode`: buckets have
no read or save reactor, and the scope picker only ever selects INSIGHT, USER or
APP.

## Design-System Notes

Follow the root [Design System & Styling](../../AGENTS.md#design-system--styling) rules and
[DESIGN.md](../../DESIGN.md). Package-specific migration targets:

- **`src/components/tooltip.tsx` is a deprecated local fork** of the lib `Tooltip` — never
  extend it; replace usages with `Tooltip` from `@semoss/ui/next` when touched.
- **`save-modal.tsx` / `upload-modal.tsx`** hand-roll `fixed inset-0` overlays and hand-copy
  `Button` class strings — migrate to `Dialog` + `Button` when touched.

## Agent Guardrails

### Be Cautious With

- **`src/index.ts`** — the surface consumed by `@semoss/client`; changing it affects the app.
- **`vite.config.ts`** — dev server and build configuration.

### When Making Changes

Verify the standalone build, package types, and the client that consumes its source:

```bash
pnpm --filter @semoss/terminal type-check
pnpm --filter @semoss/terminal build
pnpm --filter @semoss/client type-check
```
