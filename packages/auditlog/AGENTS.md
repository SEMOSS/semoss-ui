# AGENTS.md - @semoss/auditlog-package

This document provides context for AI coding assistants working with the SEMOSS audit log
dashboard application.

> **Inherits from:** [../../AGENTS.md](../../AGENTS.md) for code style, file-naming, package
> structure, commit messages, Biome config, and Node/pnpm requirements.

## Overview

`@semoss/auditlog-package` is a standalone dashboard application for viewing SEMOSS audit
logs. It is a **private** package built with Vite, MobX, and `react-router-dom`.

## Build System

- **Bundler**: Vite 7
- **State**: MobX (`mobx` + `mobx-react-lite`)
- **Routing**: `react-router-dom` 6
- **Styling**: Tailwind CSS v4

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm lint` | **ESLint** (see Linting below) |
| `pnpm preview` | Preview the production build |

### Linting

Repo-wide **Biome** (`pnpm check` at the root) applies here like everywhere else. This package
**additionally** ships a local **ESLint** config (`eslint.config.js`,
`eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`). Run **both**:

```bash
pnpm check                          # Biome (repo-wide)
pnpm --filter @semoss/auditlog-package lint   # ESLint (react hooks/refresh)
```

## Structure

An application, so it uses the `src/` layout from the root AGENTS.md including `pages/`:

| Folder / file | Purpose |
|---------------|---------|
| `assets/` | Images and static files |
| `components/` | Components (one per file) |
| `contexts/` | React contexts (`<name>.context.tsx`) |
| `hooks/` | React hooks (`use-<name>.ts`) |
| `pages/` | Routing tree — `router.tsx`, layouts, pages |
| `stores/` | MobX stores (`<name>.store.ts`) |
| `types.d.ts` | Ambient TypeScript types |
| `app.tsx`, `main.tsx`, `index.css` | App entry files |

> Some page files use the legacy PascalCase form (`AuthenticatedLayout.tsx`, `LoginPage.tsx`,
> `MainLayout.tsx`) alongside newer kebab files (`root-layout.tsx`). Migrate to the dot
> role-suffix (`authenticated.layout.tsx`, `login.page.tsx`) as you touch them.

## Agent Guardrails

### Be Cautious With

- **`vite.config.ts`** — dev server and build configuration.
- **`eslint.config.js`** — local lint rules for this package.

### Testing Changes

```bash
pnpm --filter @semoss/auditlog-package lint
pnpm --filter @semoss/auditlog-package build
```
