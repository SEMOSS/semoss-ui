# AGENTS.md - SEMOSS Monorepo

This document provides context for AI coding assistants working with the SEMOSS monorepo.

## Overview

SEMOSS is a React-based analytics platform built as a pnpm monorepo with Turborepo orchestration.

**Dependency Graph:**

Libraries (`libs/*`, publishable):
- `@semoss/sdk` → Core SDK (no internal dependencies)
- `@semoss/ui` → Component library (no internal dependencies)
- `@semoss/i18n` → Internationalization library (no internal dependencies)
- `@semoss/shared` → Shared utilities (depends on i18n, sdk, ui)
- `@semoss/renderer` → Visualization components (depends on sdk, shared, ui)

Applications (`packages/*`, not published):
- `@semoss/client` → Main web application (depends on i18n, renderer, sdk, shared, terminal, ui)
- `@semoss/playground` → Chat (depends on i18n, sdk, shared, ui)
- `@semoss/terminal` → Embedded terminal (depends on i18n, sdk, shared, ui)
- `@semoss/auditlog-package` → Audit log dashboard (depends on i18n, sdk, shared, ui)
- `@semoss/cli` → CLI tooling (depends on sdk)

## Workspace Structure

```
semoss/
├── libs/           # Shared libraries (publishable)
│   ├── sdk/        # @semoss/sdk - Core SDK
│   ├── ui/         # @semoss/ui - Component library
│   ├── i18n/       # @semoss/i18n - Internationalization library
│   ├── shared/     # @semoss/shared - Shared utilities
│   └── renderer/   # @semoss/renderer - Visualization components
├── packages/       # Applications (not published)
│   ├── client/                     # @semoss/client - Main web application
│   ├── playground/                 # @semoss/playground - Chat
│   ├── terminal/                   # @semoss/terminal - Embedded terminal app
│   ├── auditlog/                   # @semoss/auditlog-package - Audit log dashboard
harness
│   └── cli/                        # @semoss/cli - CLI tooling
├── pnpm-workspace.yaml
├── turbo.json
└── biome.json
```

## Requirements

- **Node.js**: >=24.4.0 <25 (see `.nvmrc`)
- **pnpm**: ~10.13.0 (see `engines`; `packageManager` pins `pnpm@10.13.1`)

## Build Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm dev` | Run all packages in dev mode |
| `pnpm dev:client` | Run client with dependencies |
| `pnpm dev:playground` | Run playground with dependencies |
| `pnpm dev:terminal` | Run terminal with dependencies |
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
- **Use `const`** / no `var`: `error`
- **No `debugger`**: `error`
- **Semicolons**: required
- **Trailing commas**: all
- **Quote style**: double quotes
- **Indent**: 4 spaces
- **Line width**: 80
- **Sorted Tailwind classes**: `warn` (safe autofix)

Import organization groups (in order):
1. External packages (excluding `@semoss/**`)
2. `@semoss/**` packages
3. Aliases
4. Relative paths

### Git Hooks

Git hooks are managed by **lefthook** and installed automatically on `pnpm install`
(via the `prepare` script):
- **pre-commit**: runs `biome check --write` on staged files (auto-fixes and re-stages).
- **commit-msg**: runs commitlint to validate the message.

### Commit Messages

Uses Conventional Commits enforced by commitlint (`@commitlint/config-conventional`):
- Format: `type(scope): message`
- Types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`
- Scope is optional and free-form — use the affected package (e.g. `ui`, `client`, `sdk`).
- Subject: imperative, present tense, lowercase, no trailing period.
- Example: `feat(ui): add new Button variant`

## Code Style & Conventions

These rules apply to **all** packages. They are adopted incrementally — see
[Incremental Migration](#incremental-migration) below.

### General

- Write clear, concise code. Favor readability over cleverness.
- Do not add unnecessary abstractions. Follow DRY and KISS, but a little duplication is fine
  when it keeps the code simpler.
- Reuse existing types and common code before writing new ones. Check `@semoss/shared` first
  (it holds most shared components, utilities, and types), then the other libs.
- Comment non-obvious code. Add TSDoc (`/** ... */`) to all functions and document component
  props on their type/interface.

### TypeScript

- **No explicit `any`** — Biome errors on it. Prefer precise types, generics, or `unknown`
  with narrowing.
- **No non-null assertions (`!`)** — Biome forbids them. Guard nullable values explicitly
  instead (early return, optional chaining, or a runtime check).
- Reuse shared types before writing new ones (check `@semoss/shared` first). A type used
  only internally is not public until it is re-exported from the package barrel.
- Back stores and config objects with an explicit `interface` (e.g.
  `<Name>StoreInterface`) rather than an inferred ad-hoc shape.

### Components & Exports

- One component per file. **Exception:** `@semoss/ui` colocates related components.
- Use **named exports** only — never `export default`.
- Expose every folder's public surface through an `index.ts` **barrel** that re-exports its
  members (`export * from "./file";`). A symbol is not importable from the package until it is
  re-exported up the barrel chain (folder `index.ts` → package `src/index.ts`).

### Styling

- Style with **Tailwind CSS** utility classes.
- Use the theme variables defined in `globals.css`
  ([libs/ui/src/styles/globals.css](libs/ui/src/styles/globals.css),
  [libs/shared/src/styles/globals.css](libs/shared/src/styles/globals.css)). Do not hardcode
  colors or invent new design tokens.
- Reuse `@semoss/ui` components (prefer `@semoss/ui/next`) and existing patterns instead of
  building new styles. Prefer them over generic layout wrappers like `Box`.
- Merge class names with `cn()` ([libs/ui/src/lib/utils.ts](libs/ui/src/lib/utils.ts)).
- No inline styles (`style={{ ... }}`). Do not import Material UI or Emotion directly in new code.
- Follow an 8px-based spacing scale via Tailwind spacing tokens.

### Data & API Calls

- Keep API / pixel calls in `api/`, split by domain (`auth.ts`, `engines.ts`, `projects.ts`,
  …), and re-export them from the `api/` barrel.
- Talk to the backend through `@semoss/sdk` primitives (`get`, `post`, `runPixel`, `Env`,
  `CSRF`) — do not call `fetch` directly.
- On failure, surface a real error: `.catch((error) => { throw Error(error); })`, and guard an
  empty/missing payload (e.g. `throw Error("No Config Response")`) so callers never receive
  `undefined`.
- Keep API functions `async` and return the parsed data, not the raw response.

### Accessibility

- Give interactive elements an accessible name (`aria-label`) and the correct `role`. Native
  elements (`<button>`, `<a>`) already carry a role — do not override it.
- Mark purely decorative elements `aria-hidden`.
- `role` doubles as a stable test selector (see [Testing](#testing)) — prefer it over adding a
  separate hook where a semantic role already fits.

### File Naming

Files are **kebab-case** with a **dot role-suffix** marking their role:

| Role | Pattern | Example |
|------|---------|---------|
| Page | `<name>.page.tsx` | `login.page.tsx` |
| Layout | `<name>.layout.tsx` | `authenticated.layout.tsx` |
| Routes | `<name>.routes.tsx` | `project.routes.tsx` |
| Router entry | `router.tsx` | `router.tsx` |
| Store | `<name>.store.ts` | `config.store.ts` |
| Context | `<name>.context.tsx` | `workspace.context.tsx` |
| Types | `<name>.types.ts` | `file.types.ts` |
| Constants | `<name>.constants.ts` | `workbench.constants.ts` |
| Hook | `use-<name>.ts` | `use-root-store.ts` |

> **Hooks are the exception** to the dot-suffix rule — keep the React `use-<name>.ts` idiom
> (the exported symbol stays `useName`).

### Testing

- Give elements stable selectors for tests: `id`, `role` (also used for accessibility), or
  `data-testid`.
- Name test ids `fileName-component-uniqueIdentifier`.

### Incremental Migration

Adopting these standards is **incremental and ongoing** — treat every task as a chance to move
the codebase toward them. When you touch a file, consider the surrounding code and bring it up
to these rules (naming, exports, styling, structure, TypeScript, API, and accessibility) as you
go, making the small in-scope updates that align it with the conventions above.

Stay in scope: do **not** mass-rename or refactor files you are not otherwise changing. Files
that predate these rules (e.g. PascalCase or `*-page.tsx` names) are not automatically wrong —
migrate them as you work on them.

## Package Structure Conventions

**Libraries** (`libs/*`) are publishable and consumed via their `index.ts` barrel — they have
no `pages/` or router. **Applications** (`packages/*`) are not published and add app entry
files (`main.tsx`, `index.css`) and a `pages/` router tree.

Standard `src/` layout (use only the folders a package needs):

| Folder / file | Purpose |
|---------------|---------|
| `assets/` | Images and static files |
| `api/` | API / pixel calls (where applicable) |
| `components/` | Components (one per file) |
| `constants.ts` or `constants/` | Shared constant values |
| `contexts/` | React contexts (`<name>.context.tsx`) |
| `hooks/` | React hooks (`use-<name>.ts`) |
| `pages/` | Routing — applications only (see below) |
| `stores/` | stores (`<name>.store.ts`) |
| `styles/` | Global CSS (libraries) |
| `types.ts` or `types/` | TypeScript types (use a folder when many, grouped logically) |
| `utility/` | Utility functions (`.ts`, grouped logically by type) |

### Routing (`pages/`, applications only)

- `router.tsx` — router entry point.
- `<name>.routes.tsx` — route definitions (e.g. an exported `ROUTES` array).
- `<name>.layout.tsx` — layout for a route subtree.
- `<name>.page.tsx` — a page component.
- Group larger feature areas into subfolders (e.g. `pages/project/`).

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

**Libraries** (`libs/*`):
- [libs/sdk/AGENTS.md](./libs/sdk/AGENTS.md) - Core SDK specifics
- [libs/ui/AGENTS.md](./libs/ui/AGENTS.md) - Component library specifics
- [libs/shared/AGENTS.md](./libs/shared/AGENTS.md) - Shared utilities/components specifics
- [libs/renderer/AGENTS.md](./libs/renderer/AGENTS.md) - Visualization components specifics
- [libs/i18n/AGENTS.md](./libs/i18n/AGENTS.md) - Internationalization library specifics

**Applications** (`packages/*`):
- [packages/client/AGENTS.md](./packages/client/AGENTS.md) - Main web application specifics
- [packages/playground/AGENTS.md](./packages/playground/AGENTS.md) - Playground (chat) app specifics
- [packages/terminal/AGENTS.md](./packages/terminal/AGENTS.md) - Embedded terminal app specifics
- [packages/auditlog/AGENTS.md](./packages/auditlog/AGENTS.md) - Audit log dashboard app specifics
- [packages/cli/AGENTS.md](./packages/cli/AGENTS.md) - CLI tooling specifics
