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

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm build:dev` | Development build |
| `pnpm type-check` | `tsc --noEmit` type check |
| `pnpm lint` | Declared ESLint command; missing configuration (see below) |
| `pnpm test` | Vitest (`--passWithNoTests`; success may mean no tests ran) |
| `pnpm preview` | Preview the production build |

Run these from `packages/browser-automation`, or use
`pnpm --filter @semoss/browser-automation <command>`.

### Linting

Follow the [React validation guidance](../../skills/react-standard.skill.md#validation).
The manifest declares `lint: eslint .`, but this package has no `eslint.config.js` and no
repository-root config to inherit. Treat ESLint validation as blocked until the package
configuration is repaired in a separately authorized change; do not report it as passing.

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
- **The declared `lint` script** — its missing configuration is a known validation gap.

### Testing Changes

```bash
pnpm --filter @semoss/browser-automation type-check
pnpm --filter @semoss/browser-automation build
```

Report the ESLint gap above separately from the checks that can run.
