# AGENTS.md - SEMOSS Monorepo

This document provides context for AI coding assistants working with the SEMOSS monorepo.

## Required Skill Routing (All Agents)

**Before any task involving React files, every agent must read the full
[React standard](./skills/react-standard.skill.md).** This is mandatory for all
providers and delegated agents when creating, editing, refactoring, debugging,
investigating, planning changes to, or reviewing React code anywhere in the repo.
It covers `.tsx` and `.jsx` files, React components/hooks/context/providers in
`.ts` or `.js` files, and React tests, stories, and examples. Task size and location
outside `src/` do not waive this requirement.

- Read the file itself; a link, skill listing, metadata, or summary is not a
  substitute for its full contents. Do not rely on automatic skill discovery.
- Apply its rules according to the work: React rules govern React code;
  applicable language, architecture, compatibility, and validation rules govern
  other work. Preserve documented exceptions and protected-file restrictions.
- Unrelated documentation, configuration, scripts, and CI tasks do not require
  this skill solely because they are in the repository.
- After reading it, briefly identify `skills/react-standard.skill.md` in a
  progress update; delegated agents must also identify it in their handoff.
- Include this mandatory reading requirement in every delegated React task. Each
  agent is responsible for loading the standard in its own context.
- If context is compacted or lost, reload the standard before continuing unless
  its full contents remain available. If the file cannot be read, report that
  blocker before proceeding with React work.

Read the owning package's `AGENTS.md` and use the [skill index](./skills/README.md)
to load additional skills before the relevant work. Package guides and specialized
skills supplement the standard; they do not waive reading it for React work.

- [Accessibility](./skills/accessibility.skill.md): interactive UI and accessible behavior.
- [Mobile development](./skills/mobile-development.skill.md): responsive and touch interfaces.
- [React form builder](./skills/react-form-builder.skill.md): form fields, validation, and submission.
- [State management](./skills/state-management.skill.md): stores, shared application state,
  `StoreState`, `useStoreSelector`, and work in or migration of MobX and Zustand stores.
- [SDK chat](./skills/sdk-chat.skill.md): rooms, messages, agent runs, approvals, and polling lifecycle.
- [SDK session](./libs/sdk/skills/session.skill.md): sign in, the user, config, permissions, and
  which insight a pixel runs in.
- [Design rulebook](./DESIGN.md): UI composition and styling.

Lint and formatting configuration lives in [biome.json](./biome.json).

## Overview

SEMOSS is a React-based analytics platform built as a pnpm monorepo with Turborepo orchestration.

**Workspace Dependencies:**

These summaries include declared internal dependencies and peers. Package manifests
and the owning guides define the exact public entry points and architectural boundaries.

Libraries:
- `@semoss/utility` → Generic text, date, object, JSON, file, encoding, browser, and other functional helpers
- `@semoss/sdk` → Core SDK (bundles `@semoss/utility`; no runtime dependencies)
- `@semoss/ui` → Component library (no internal dependencies)
- `@semoss/i18n` → Internationalization library (no internal dependencies)
- `@semoss/shared` → Shared utilities (depends on i18n, sdk, ui, utility)
- `@semoss/connectors` → Microsoft 365 and Google Workspace viewers (depends on i18n, sdk,
  shared, ui, utility)
- `@semoss/renderer` → Visualization components (depends on sdk, shared, ui)
- `@semoss/workbench` → Multi-panel dock shell (depends on ui, and may depend on utility for
  generic helpers and `StoreState` — deliberately domain-agnostic, so it can never import sdk,
  shared or i18n)
- `@semoss/panels` → File panels for the dock (depends on i18n, sdk, shared, ui, utility, workbench)
- `@semoss/config` → Shared Vite/Vitest config and `tsconfig.base.json` (private, not published;
  dev dependency of every library and application)

The dock and the panels are two layers, in one direction:
`@semoss/ui ← @semoss/workbench ← @semoss/panels → @semoss/shared → @semoss/sdk`.

Applications:
- `@semoss/client` → Main web application (depends on automation, i18n, panels, renderer, sdk, shared, terminal, ui, utility, workbench)
- `@semoss/playground` → Chat (depends on connectors, i18n, panels, sdk, shared, ui, utility, workbench)
- `@semoss/collaboration` → Collaboration workspace: work, rooms, connectors, routines (depends on
  automation, connectors, i18n, panels, sdk, shared, ui, utility, workbench)
- `@semoss/terminal` → Embedded terminal (depends on i18n, panels, sdk, shared, ui, workbench)
- `@semoss/auditlog-package` → Audit log dashboard (depends on i18n, sdk, shared, ui)
- `@semoss/automation` → Automation workspace app (depends on i18n, sdk, shared, ui, utility;
  no client-store dependency)
- `@semoss/cli` → CLI tooling (depends on sdk)
- `@semoss/browser-automation` → Browser automation harness (depends on sdk, ui, utility)
- `workshop-automation-extension` → Chrome extension (depends on sdk, ui, utility)

**Every host that mounts a dock or a file panel** imports
`@semoss/workbench/globals.css` and `@semoss/panels/globals.css`, and takes
`aiSdkStubAlias` + `scopePptxViewerCssPlugin` from `@semoss/panels/vite`. See
[libs/panels/AGENTS.md](./libs/panels/AGENTS.md#what-a-host-has-to-wire-up).

**Every host that mounts a connector viewer** imports `@semoss/connectors/globals.css` and loads
the `connectors` i18n namespace. See
[libs/connectors/AGENTS.md](./libs/connectors/AGENTS.md#what-a-host-has-to-wire-up).

## Workspace Structure

```
semoss/
├── libs/           # Shared libraries
│   ├── utility/    # Generic cross-package utility functions
│   ├── sdk/        # @semoss/sdk - Core SDK
│   ├── ui/         # @semoss/ui - Component library
│   ├── i18n/       # @semoss/i18n - Internationalization library
│   ├── shared/     # @semoss/shared - Shared utilities
│   ├── connectors/ # @semoss/connectors - Microsoft 365 and Google Workspace viewers
│   ├── renderer/   # @semoss/renderer - Visualization components
│   ├── workbench/  # @semoss/workbench - Multi-panel dock shell
│   ├── panels/     # @semoss/panels - File panels for the dock
│   └── config/     # @semoss/config - Shared Vite/Vitest/tsconfig (private)
├── packages/       # Applications (not published)
│   ├── client/                     # @semoss/client - Main web application
│   ├── playground/                 # @semoss/playground - Chat
│   ├── collaboration/              # @semoss/collaboration - Collaboration workspace
│   ├── terminal/                   # @semoss/terminal - Embedded terminal app
│   ├── auditlog/                   # @semoss/auditlog-package - Audit log dashboard
│   ├── automation/                 # @semoss/automation - Automation workspace app
│   ├── browser-automation/         # @semoss/browser-automation - Browser automation harness
│   ├── chrome-extension/           # Chrome extension for browser automation
│   └── cli/                        # @semoss/cli - CLI tooling
├── skills/         # Provider-neutral *.skill.md guidance
├── pnpm-workspace.yaml
├── turbo.json
└── biome.json
```

## Requirements

- **Node.js**: >=26.0.0 <27 (see `.nvmrc`)
- **pnpm**: ~12.18.0 (see `engines`; `packageManager` pins `pnpm@12.18.0`)

## Build Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm dev` | Run all packages in dev mode |
| `pnpm dev:client` | Run client with dependencies |
| `pnpm dev:playground` | Run playground with dependencies |
| `pnpm dev:collaboration` | Run collaboration with dependencies |
| `pnpm dev:terminal` | Run terminal with dependencies |
| `pnpm build` | Production build all packages |
| `pnpm build:dev` | Development build all packages |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm check` | Run Biome linting/formatting check |
| `pnpm fix` | Auto-fix Biome issues |
| `pnpm clean` | Run Knip to find unused files, dependencies, and exports |

Name test files `*.test.ts` / `*.test.tsx`, never `*.spec.ts`. Existing `*.spec.ts` files
are not renamed.

## Design System & Styling

See [DESIGN.md](./DESIGN.md) and the [UI component catalog](./libs/ui/AGENTS.md).

## State Management

Shared application state is moving to framework-free stores built on `StoreState` from
`@semoss/utility/store`, read in React through `useStoreSelector`. MobX, Zustand, and
hand-rolled listener sets are legacy. Load the
[state management skill](./skills/state-management.skill.md) before creating, editing,
migrating, or reviewing a store; it owns the store shape, update, async, React, and migration
rules.

- **New shared state** uses a `StoreState`-backed store. Do not add a MobX or Zustand store, an
  `observer` component over new state, a hand-rolled listener set, or another state library.
- **React reads stores** with `useStoreSelector` from
  `@semoss/utility/react/use-store-selector`, never by calling `useSyncExternalStore` on a store
  directly. React code in `@semoss/utility` lives only under `src/react/`, one hook per file.
- **Existing stores keep their contracts.** The migration is incremental, one store per scoped
  change. Do not rewrite a legacy store as a side effect of other work.
- **Dependency boundaries still hold.** `@semoss/ui`, `@semoss/i18n`, and `@semoss/cli` cannot
  import `@semoss/utility`; none of them owns a store today. Do not add the dependency to follow
  this direction. `@semoss/workbench` may depend on `@semoss/utility`, so the dock's store can
  move; it still may not import sdk, shared, or i18n.

Where each package stands:

| Package | Today | Direction |
|---------|-------|-----------|
| `@semoss/sdk` | Session, config, logins, permissions, and session insight on `StoreState` | Reference implementation; `InsightStore`, `AgentStore`, `RoomStore`, and `Env` are out of scope |
| `@semoss/collaboration`, `@semoss/connectors`, `@semoss/shared` | Hand-rolled `getSnapshot`/`subscribe` stores and module listener sets | Adopt `StoreState` when touched |
| `@semoss/client` | MobX (designer, workspace) and Zustand (assistant, page, workbench domains) | New state on `StoreState`; migrate per store |
| `@semoss/playground` | MobX (root, chat, room, message, tool) plus the dock's Zustand store | New state on `StoreState` or SDK hooks; migrate per store |
| `@semoss/renderer` | MobX block and notebook state | Last to move; needs a structural-sharing design first |
| `@semoss/auditlog-package` | One MobX root store | Migrate as one change |
| `@semoss/workbench`, `@semoss/panels`, `@semoss/terminal` | The dock's Zustand store and its peer | The dock's store migrates as one scoped change; hosts and the peer follow it |
| `@semoss/automation`, `@semoss/browser-automation` | React state and module listener sets | `StoreState` for any new shared state |

## Incremental Migration

See the React skill's [scope](./skills/react-standard.skill.md#authorities-and-scope) and
[full-file review workflow](./skills/react-standard.skill.md#full-file-review-and-handoff).

## Package Structure Conventions

See the React skill's [architecture](./skills/react-standard.skill.md#architecture-and-exports)
and [naming conventions](./skills/react-standard.skill.md#types-and-naming), plus the owning
package guide below.

## Agent Guardrails

### Utility Ownership

- Put reusable generic functions in `libs/utility`, grouped into flat files by function.
  Import from the supported `@semoss/utility/<category>` subpath; use defining files
  for imports within a package. See [the utility guide](./libs/utility/AGENTS.md).
- Search individual files, nested functions, callbacks, and repeated expressions as
  well as utility directories before adding helpers. Equivalent implementations can
  use different names or syntax.
- Keep feature policy, UI composition, SDK transport, and orchestration in their
  owning packages. Preserve dependency boundaries: this does not authorize adding
  utility dependencies to UI, i18n, or CLI; workbench may depend on utility. The SDK may import utility
  category subpaths only as a devDependency that its build bundles into `dist`, and
  its public types must not reference utility types, since its declarations are
  not bundled.
- Preserve whitespace, timezone, rounding, null/fallback, filename, and error behavior.
  Use compatibility re-exports or small adapters for existing public contracts.
- Prefer native operations over unnecessary wrappers. Do not add option-heavy
  abstractions just to combine helpers with materially different contracts.

### Do Not Modify
- **`pnpm-lock.yaml`** - Managed by pnpm, never edit manually
- **`pom.xml`** - Maven build configuration for deployment
- **`*.local`** files - Local environment overrides (gitignored)
- **`settings.xml`** - Maven settings for deployment

### Be Cautious With
- **`turbo.json`** - Affects build caching and task dependencies
- **`biome.json`** - Changes affect all packages
- **Root `package.json`** - Engine constraints affect all developers

For validation and handoff, follow the React skill's
[review checklist](./skills/react-standard.skill.md#full-file-review-and-handoff).

## Nested AGENTS.md Files

**Libraries** (`libs/*`):
- [libs/utility/AGENTS.md](./libs/utility/AGENTS.md) - Generic utility ownership and public categories
- [libs/sdk/AGENTS.md](./libs/sdk/AGENTS.md) - Core SDK specifics
- [libs/ui/AGENTS.md](./libs/ui/AGENTS.md) - Component library specifics
- [libs/shared/AGENTS.md](./libs/shared/AGENTS.md) - Shared utilities/components specifics
- [libs/connectors/AGENTS.md](./libs/connectors/AGENTS.md) - Microsoft 365 and Google Workspace viewers
- [libs/renderer/AGENTS.md](./libs/renderer/AGENTS.md) - Visualization components specifics
- [libs/i18n/AGENTS.md](./libs/i18n/AGENTS.md) - Internationalization library specifics
- [libs/workbench/AGENTS.md](./libs/workbench/AGENTS.md) - Workbench dock shell specifics
- [libs/panels/AGENTS.md](./libs/panels/AGENTS.md) - File panels for the dock

**Applications** (`packages/*`):
- [packages/client/AGENTS.md](./packages/client/AGENTS.md) - Main web application specifics
- [packages/playground/AGENTS.md](./packages/playground/AGENTS.md) - Playground (chat) app specifics
- [packages/terminal/AGENTS.md](./packages/terminal/AGENTS.md) - Embedded terminal app specifics
- [packages/auditlog/AGENTS.md](./packages/auditlog/AGENTS.md) - Audit log dashboard app specifics
- [packages/automation/AGENTS.md](./packages/automation/AGENTS.md) - Automation workspace app specifics
- [packages/browser-automation/AGENTS.md](./packages/browser-automation/AGENTS.md) - Browser automation harness specifics
- [packages/cli/AGENTS.md](./packages/cli/AGENTS.md) - CLI tooling specifics
