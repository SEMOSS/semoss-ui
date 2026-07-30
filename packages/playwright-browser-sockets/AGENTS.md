# AGENTS.md - @semoss/playwright-browser-sockets

This document provides context for AI coding assistants working with the SEMOSS Playwright
browser sockets harness.

> **Inherits from:** [../../AGENTS.md](../../AGENTS.md) for code style, file-naming, package
> structure, commit messages, Biome config, and Node/pnpm requirements.

## Overview

`@semoss/playwright-browser-sockets` is a **private** Vite harness that drives a browser over
sockets for Playwright/automation scenarios and exposes a SEMOSS MCP surface. It depends on
`@semoss/sdk` and `@semoss/ui`.

## Build System

- **Bundler**: Vite 7 + React
- **Styling**: Tailwind CSS v4

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm build:dev` | Development build |
| `pnpm type-check` | `tsc --noEmit` type check |
| `pnpm lint` | **ESLint** (see Linting below) |
| `pnpm preview` | Preview the production build |

### Linting

Repo-wide **Biome** (`pnpm check` at the root) applies here. This package **additionally**
ships a local **ESLint** config (`eslint.config.js`). Run both:

```bash
pnpm check
pnpm --filter @semoss/playwright-browser-sockets lint
```

## Structure

| Folder / file | Purpose |
|---------------|---------|
| `src/components/` | Components (one per file) |
| `src/hooks/` | React hooks (`use-<name>.ts`) |
| `src/domain/` | Domain logic for the harness |
| `src/semoss/` | SEMOSS integration glue |
| `src/types/` | TypeScript types (`<name>.types.ts`) |
| `src/App.tsx`, `src/main.tsx`, `src/index.css` | App entry files |
| `mcp/` | MCP configuration (`pixel_mcp.json`) |

## Agent Guardrails

### Be Cautious With

- **`vite.config.ts`** — dev server and build configuration.
- **`mcp/pixel_mcp.json`** — the MCP surface definition.
- **`eslint.config.js`** — local lint rules for this package.

### Testing Changes

```bash
pnpm --filter @semoss/playwright-browser-sockets lint
pnpm --filter @semoss/playwright-browser-sockets type-check
pnpm --filter @semoss/playwright-browser-sockets build
```
