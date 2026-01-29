# AGENTS.md - @semoss/playground

This document provides context for AI coding assistants working with the SEMOSS Playground application.

> **Inherits from:** [../../AGENTS.md](../../AGENTS.md) for monorepo conventions, commit messages, Biome config, and Node/pnpm requirements.

## Overview

`@semoss/playground` is a development playground application for testing SEMOSS SDK features and components. It's a private package (not published) used for development and experimentation.

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
  "@semoss/sdk": "workspace:*",
  "@semoss/shared": "workspace:*",
  "@semoss/ui": "workspace:*"
}
```

Changes to these libraries are immediately reflected in the playground during development.

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
