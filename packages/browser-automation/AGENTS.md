# AGENTS.md - @semoss/browser-automation

This document provides context for AI coding assistants working with the SEMOSS Playwright
browser sockets harness.

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Load the applicable
> [root skills](../../skills/README.md), including the [React standard](../../skills/react-standard.skill.md).

## Overview

`@semoss/browser-automation` is a **private** Vite harness that drives a browser over
sockets for Playwright/automation scenarios and exposes a SEMOSS MCP surface. It depends on
`@semoss/sdk` and `@semoss/ui`.

## Build System

- **Bundler**: Vite 8 + React 19
- **Styling**: Tailwind CSS v4
- **State**: React state and hooks; no state library. Any shared store uses `StoreState` per
  the [state management skill](../../skills/state-management.skill.md)

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm build:dev` | Development build |
| `pnpm type-check` | `tsc --noEmit` type check |
| `pnpm test` | Vitest (`--passWithNoTests`; success may mean no tests ran) |
| `pnpm preview` | Preview the production build |

Run these from `packages/browser-automation`, or use
`pnpm --filter @semoss/browser-automation <command>`.

### Linting

Follow the [React validation guidance](../../skills/react-standard.skill.md#validation).
Linting and formatting use Biome from the repository root (`pnpm check`); this package has
no local lint configuration.

## Structure

The existing layout is below. New application features follow the
[React architecture policy](../../skills/react-standard.skill.md#architecture-and-exports);
existing folders are not an implicit migration task.

| Folder / file | Purpose |
|---------------|---------|
| `src/components/` | Components (one per file) |
| `src/hooks/` | React hooks (`use-<name>.ts`) |
| `src/domain/` | Domain logic for the harness |
| `src/semoss/` | SEMOSS integration glue |
| `src/types/` | TypeScript types (`<name>.types.ts`) |
| `src/App.tsx`, `src/main.tsx`, `src/index.css` | App entry files |
| `mcp/` | MCP configuration (`pixel_mcp.json`) |

## Design-System Notes

Follow the root [Design System & Styling](../../AGENTS.md#design-system--styling) rules and
[DESIGN.md](../../DESIGN.md).

- **The local `@theme` block in `src/index.css` is deprecated** (`--color-canvas`,
  `--color-surface`, `--color-ink`, `--color-accent`, `--color-danger`, …). It is a rival,
  dark-only palette on top of `@semoss/ui/globals.css`. Do **not** add tokens to it or diverge
  its values further; new UI uses the standard semantic classes (`bg-background`, `bg-card`,
  `text-destructive`, …). When touching a file that uses the local classes
  (`bg-surface-raised`, `border-line`, `text-danger`), migrate those usages to `@semoss/ui`
  semantic classes. Full migration off the block is planned future work.

## Agent Guardrails

### Be Cautious With

- **`vite.config.ts`** — dev server and build configuration.
- **`mcp/pixel_mcp.json`** — the MCP surface definition.

### Testing Changes

```bash
pnpm check
pnpm --filter @semoss/browser-automation type-check
pnpm --filter @semoss/browser-automation build
```

## Generic utilities

Import reusable helpers from `@semoss/utility/<category>`, a direct workspace dependency.
Follow the [utility guide](../../libs/utility/AGENTS.md). Keep domain policy and
UI behavior here, and preserve public compatibility adapters when moving helpers.
