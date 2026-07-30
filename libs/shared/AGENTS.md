# AGENTS.md - @semoss/shared

This document provides context for AI coding assistants working with the SEMOSS shared
utilities and components library.

> **Inherits from:** [../../AGENTS.md](../../AGENTS.md) for code style, file-naming, package
> structure, commit messages, Biome config, and Node/pnpm requirements.

## Overview

`@semoss/shared` holds the cross-application components, utilities, and types that more than
one app needs. **Check here first** before writing new shared components, utilities, or types.

It is the home of large shared building blocks such as the file explorer/editor, the Monaco
editor wrappers, the FlexLayout wrapper, the shared login page, engine/MCP/prompt/skill UI,
forms, and the workbench primitives.

## Build System

`@semoss/shared` is **source-only** — it has no bundler and no `dist/`. Its `package.json`
`exports` point directly at `src/`, so consuming apps compile the TypeScript themselves. There
is intentionally **no `build` script**; keep the source type-clean and Biome-clean.

Key `exports`:

| Import | Resolves to |
|--------|-------------|
| `@semoss/shared` | `src/index.ts` (main barrel) |
| `@semoss/shared/api` | `src/api/index.ts` |
| `@semoss/shared/globals.css` | `src/styles/globals.css` |
| `@semoss/shared/flexlayout.css` | `src/components/flex-layout/flexlayout.css` |
| `@semoss/shared/assets/img/*` | `src/assets/img/*` |

`sideEffects` is limited to `**/*.css`, so unused code is tree-shaken by consumers.

## Structure

Follows the standard `src/` layout from the root AGENTS.md (a library, so no `pages/` or
router):

| Folder / file | Purpose |
|---------------|---------|
| `api/` | Shared API / pixel calls (exported via `@semoss/shared/api`) |
| `assets/` | Images and static files |
| `components/` | Shared components, one folder per feature (file, monaco, flex-layout, mcp, prompts, skills, settings, engine, form, members, …) |
| `constants/` | Shared constant values |
| `contexts/` | React contexts (`<name>.context.tsx`) |
| `hooks/` | React hooks (`use-<name>.ts`) |
| `styles/` | `globals.css` (theme variables) and other global CSS |
| `types.ts` | Shared TypeScript types |
| `workbench/` | Workbench primitives shared across apps |
| `index.ts` | Main barrel (`export * from "./api" \| "./components" \| "./constants" \| "./hooks" \| "./types"`) |

## Key Dependencies

- `@semoss/sdk`, `@semoss/ui`, `@semoss/i18n` — workspace libs
- `monaco-editor` / `@monaco-editor/react` — code editor
- `flexlayout-react` — dockable layout
- `echarts` / `echarts-for-react` — charts
- `@iconify/react`, `lucide-react` — icons

## Agent Guardrails

### Do Not Modify

- **`exports` paths in `package.json`** — the `globals.css` / `flexlayout.css` / `api` subpaths
  are imported by name across the monorepo; renaming a file requires updating the export.

### Be Cautious With

- **`src/index.ts` and sub-barrels** — this is the public surface; every app imports from it.
- **`src/styles/globals.css`** — the shared theme variables; changing tokens affects all apps.

### When Adding Shared Code

1. Put the component/util/type in the matching folder and follow root naming rules
   (`<name>.context.tsx`, `<name>.store.ts`, `<name>.types.ts`, `use-<name>.ts`, …).
2. **Re-export it from the barrel.** A type used internally is not automatically public — add
   it to the folder `index.ts` (e.g. `export * from "./file.types";`) or consumers cannot
   import it from `@semoss/shared`.
3. Because this package is source-only, verify it compiles from a consumer:
   ```bash
   pnpm --filter @semoss/client type-check
   ```

### Testing Changes

```bash
pnpm check                          # Biome lint/format
pnpm --filter @semoss/client type-check   # Compiles shared from a consumer
```
