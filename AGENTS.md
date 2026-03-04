# AGENTS.md - SEMOSS Monorepo

This document provides context for AI coding assistants working with the SEMOSS monorepo.

## Overview

SEMOSS is a React-based analytics platform built as a pnpm monorepo with Turborepo orchestration.

**Dependency Graph:**
- `@semoss/sdk` → Core SDK (no internal dependencies)
- `@semoss/ui` → Component library (no internal dependencies)
- `@semoss/shared` → Shared utilities (depends on sdk, ui)
- `@semoss/renderer` → Visualization components (depends on sdk, ui)
- `@semoss/client` → Main application (depends on renderer, sdk, ui, shared)
- `@semoss/playground` → Development playground (depends on sdk, shared, ui)

## Workspace Structure

```
semoss/
├── libs/           # Shared libraries (publishable)
│   ├── sdk/        # @semoss/sdk - Core SDK
│   ├── ui/         # @semoss/ui - Component library
│   ├── shared/     # @semoss/shared - Shared utilities
│   └── renderer/   # @semoss/renderer - Visualization components
├── packages/       # Applications (not published)
│   ├── client/     # @semoss/client - Main web application
│   ├── playground/ # @semoss/playground - Chat
│   └── cli/        # @semoss/cli - CLI tooling
├── pnpm-workspace.yaml
├── turbo.json
└── biome.json
```

## Requirements

- **Node.js**: >=24.4.0 <25 (see `.nvmrc`)
- **pnpm**: ~10.13.0 (specified in `packageManager`)

## Build Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm dev` | Run all packages in dev mode |
| `pnpm dev:client` | Run client with dependencies |
| `pnpm dev:playground` | Run playground with dependencies |
| `pnpm build` | Production build all packages |
| `pnpm build:dev` | Development build all packages |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm check` | Run Biome linting/formatting check |
| `pnpm fix` | Auto-fix Biome issues |

## Code Quality

### Biome Configuration

Biome handles linting and formatting. Key rules:
- **No unused variables/imports**: `error`
- **No explicit `any`**: `error`
- **Use `const`**: `error`
- **Semicolons**: required
- **Trailing commas**: all
- **Quote style**: double quotes
- **Indent**: 4 spaces

Import organization groups (in order):
1. External packages (excluding `@semoss/**`)
2. `@semoss/**` packages
3. Aliases
4. Relative paths

### Commit Messages

Uses Conventional Commits via commitlint:
- Format: `type(scope): message`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Example: `feat(ui): add new Button variant`

## Agent Guardrails

### Do Not Modify
- **`pnpm-lock.yaml`** - Managed by pnpm, never edit manually
- **`pom.xml`** - Maven build configuration for deployment
- **`*.local`** files - Local environment overrides (gitignored)
- **`settings.xml`** - Maven settings for deployment

### Be Cautious With
- **`turbo.json`** - Affects build caching and task dependencies
- **`biome.json`** - Changes affect all packages
- **Root `package.json`** - Engine constraints affect all developers

### Testing Changes

Always run after making changes:
```bash
pnpm check          # Verify linting
pnpm build          # Verify builds pass
pnpm test           # Verify tests pass
```

## Nested AGENTS.md Files

- [libs/i18n/AGENTS.md](./libs/i18n/AGENTS.md) - Internationalization library specifics
- [libs/ui/AGENTS.md](./libs/ui/AGENTS.md) - Component library specifics
- [packages/playground/AGENTS.md](./packages/playground/AGENTS.md) - Playground app specifics
