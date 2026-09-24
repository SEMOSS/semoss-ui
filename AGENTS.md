# AGENTS.md - SEMOSS Monorepo

This document provides context for AI coding assistants working with the SEMOSS monorepo.

## Required Skill Routing (All Agents)

Load the relevant skills before implementation or review. The
[skill index](./skills/README.md) applies to all agents, regardless of provider:

- [React standard](./skills/react-standard.skill.md): React/TypeScript implementation and review.
- [Accessibility](./skills/accessibility.skill.md): interactive UI and accessible behavior.
- [Mobile development](./skills/mobile-development.skill.md): responsive and touch interfaces.
- [React form builder](./skills/react-form-builder.skill.md): form fields, validation, and submission.
- [SDK chat](./skills/sdk-chat.skill.md): rooms, messages, agent runs, approvals, and polling lifecycle.
- [Design rulebook](./DESIGN.md): UI composition and styling.

Lint and formatting configuration lives in [biome.json](./biome.json).

## Overview

SEMOSS is a React-based analytics platform built as a pnpm monorepo with Turborepo orchestration.

**Workspace Dependencies:**

These summaries include declared internal dependencies and peers. Package manifests
and the owning guides define the exact public entry points and architectural boundaries.

Libraries (`libs/*`, publishable):
- `@semoss/utility` → Generic date, string, file, clipboard, and JSON helpers
- `@semoss/sdk` → Core SDK (no internal dependencies)
- `@semoss/ui` → Component library (no internal dependencies)
- `@semoss/i18n` → Internationalization library (no internal dependencies)
- `@semoss/shared` → Shared utilities (depends on i18n, sdk, ui, utility)
- `@semoss/renderer` → Visualization components (depends on sdk, shared, ui)
- `@semoss/workbench` → Multi-panel dock shell (depends on ui only — deliberately
  domain-agnostic, so it can never import sdk, shared or i18n)
- `@semoss/panels` → File panels for the dock (depends on i18n, sdk, shared, ui, workbench)

The dock and the panels are two layers, in one direction:
`@semoss/ui ← @semoss/workbench ← @semoss/panels → @semoss/shared → @semoss/sdk`.

Applications (`packages/*`, not published):
- `@semoss/client` → Main web application (depends on automation, i18n, panels, renderer, sdk, shared, terminal, ui, utility, workbench)
- `@semoss/playground` → Chat (depends on i18n, panels, sdk, shared, ui, workbench)
- `@semoss/terminal` → Embedded terminal (depends on i18n, panels, sdk, shared, ui, workbench)
- `@semoss/auditlog-package` → Audit log dashboard (depends on i18n, sdk, shared, ui)
- `@semoss/automation` → Automation workspace app (depends on i18n, sdk, shared, ui, utility;
  no client-store dependency)
- `@semoss/cli` → CLI tooling (depends on sdk)

**Every host that mounts a dock or a file panel** imports
`@semoss/workbench/globals.css` and `@semoss/panels/globals.css`, and takes
`aiSdkStubAlias` + `scopePptxViewerCssPlugin` from `@semoss/panels/vite`. See
[libs/panels/AGENTS.md](./libs/panels/AGENTS.md#what-a-host-has-to-wire-up).

## Workspace Structure

```
semoss/
├── libs/           # Shared libraries (publishable)
│   ├── utility/    # Generic cross-package utility functions
│   ├── sdk/        # @semoss/sdk - Core SDK
│   ├── ui/         # @semoss/ui - Component library
│   ├── i18n/       # @semoss/i18n - Internationalization library
│   ├── shared/     # @semoss/shared - Shared utilities
│   ├── renderer/   # @semoss/renderer - Visualization components
│   ├── workbench/  # @semoss/workbench - Multi-panel dock shell
│   └── panels/     # @semoss/panels - File panels for the dock
├── packages/       # Applications (not published)
│   ├── client/                     # @semoss/client - Main web application
│   ├── playground/                 # @semoss/playground - Chat
│   ├── terminal/                   # @semoss/terminal - Embedded terminal app
│   ├── auditlog/                   # @semoss/auditlog-package - Audit log dashboard
│   ├── automation/                 # @semoss/automation - Automation workspace app
│   ├── browser-automation/         # @semoss/browser-automation - Browser automation harness
│   ├── chrome-extension/           # Chrome extension for browser automation
│   ├── vscode-extension/           # semoss-vscode - VSCode extension
│   └── cli/                        # @semoss/cli - CLI tooling
├── skills/         # Provider-neutral *.skill.md guidance
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

## Design System & Styling

See [DESIGN.md](./DESIGN.md) and the [UI component catalog](./libs/ui/AGENTS.md).

## Incremental Migration

See the React skill's [scope](./skills/react-standard.skill.md#authorities-and-scope) and
[full-file review workflow](./skills/react-standard.skill.md#full-file-review-and-handoff).

## Package Structure Conventions

See the React skill's [architecture](./skills/react-standard.skill.md#architecture-and-exports)
and [naming conventions](./skills/react-standard.skill.md#types-and-naming), plus the owning
package guide below.

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

For validation and handoff, follow the React skill's
[review checklist](./skills/react-standard.skill.md#full-file-review-and-handoff).

## Nested AGENTS.md Files

**Libraries** (`libs/*`):
- [libs/sdk/AGENTS.md](./libs/sdk/AGENTS.md) - Core SDK specifics
- [libs/ui/AGENTS.md](./libs/ui/AGENTS.md) - Component library specifics
- [libs/shared/AGENTS.md](./libs/shared/AGENTS.md) - Shared utilities/components specifics
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
