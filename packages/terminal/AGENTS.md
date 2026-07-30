# AGENTS.md - @semoss/terminal

This document provides context for AI coding assistants working with the SEMOSS embedded
terminal application.

> **Inherits from:** [../../AGENTS.md](../../AGENTS.md) for code style, file-naming, package
> structure, commit messages, Biome config, and Node/pnpm requirements.

## Overview

`@semoss/terminal` is the embedded terminal UI. It is a **private** package that is both:
- **consumed by `@semoss/client`** as a component library (its `exports` point at
  `./src/index.ts`), and
- **runnable standalone** for development via Vite (`index.html` + `main.tsx`).

It builds terminal panels on top of `flexlayout-react`.

## Build System

- **Bundler**: Vite 7 (standalone dev/build); source is consumed directly by the client.

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start standalone dev server |
| `pnpm build` | Production build |
| `pnpm build:dev` | Development build |
| `pnpm type-check` | `tsc --noEmit` type check |
| `pnpm test` | Run tests (`vitest run --passWithNoTests`) |

### Path Alias

- `@/` → `./src/`

## Structure

A component app (no `pages/` / router). Follows the standard `src/` layout from the root
AGENTS.md:

| Folder / file | Purpose |
|---------------|---------|
| `assets/` | Images and static files |
| `components/` | Terminal UI (`terminal/`, `terminal-console/`, `terminal-console-panel/`, `embed-terminal/`, `terminal-file/`) |
| `utility/` | Utility functions |
| `types.ts` | Shared TypeScript types |
| `app.tsx`, `main.tsx`, `index.css` | Standalone app entry files |
| `index.ts` | Barrel consumed by `@semoss/client` |

## Key Dependencies

- `flexlayout-react` — dockable terminal panels
- `@semoss/ui`, `@semoss/shared`, `@semoss/sdk`, `@semoss/i18n`

## Agent Guardrails

### Be Cautious With

- **`src/index.ts`** — the surface consumed by `@semoss/client`; changing it affects the app.
- **`vite.config.ts`** — dev server and build configuration.

### When Making Changes

Verify both the standalone build and the client that consumes it:

```bash
pnpm --filter @semoss/terminal type-check
pnpm --filter @semoss/client type-check
```
