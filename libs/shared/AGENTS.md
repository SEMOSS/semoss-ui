# AGENTS.md - @semoss/shared

This document provides context for AI coding assistants working with the SEMOSS shared
utilities and components library.

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Load the applicable
> [root skills](../../skills/README.md); the [React standard](../../skills/react-standard.skill.md)
> owns general implementation, naming, imports, and validation rules.

## Overview

`@semoss/shared` holds the cross-application components, utilities, and types that more than
one app needs. **Check here first** before writing new shared components, utilities, or types.

It is the home of large shared building blocks such as the file explorer, the Monaco
editor wrappers, the FlexLayout wrapper, the shared login page, engine/MCP/prompt/skill UI,
forms, and the workbench primitives.

### The file explorer (`components/file/`)

State lives in `useFileExplorer(options)`, which returns one `FileExplorerApi`; `FileExplorer`,
`FileExplorerHeader`, `FileExplorerItem`, and the context menu are presentational consumers of
it. A host calls the hook, passes the result down as `explorer`, and drives the tree through
`explorer.commands` — a facade whose identity never changes, so it survives being handed to a
surface outside the explorer's React subtree. The whole api object is identity-stable for the
same reason; such a holder sees live behaviour but **not** live state, because it does not
re-render when the explorer does.

Three props are required with no fallback, so every consumer states its intent: `explorer`,
`header` (`null` for none), and `newFileOverlay` (`null` for a browse-only tree). Everything
mode-specific — capabilities and one Pixel per operation — lives in
`file-explorer.adapters.ts`; nothing else branches on `mode.type`.

`FileExplorer` is **not** deprecated — it is the shell `@semoss/panels`'
`FileExplorerPane` renders, and `libs/panels` is its main consumer.

### The file editors are gone (`components/file/file-*.tsx`)

`FileEditor` and the six viewers it dispatched to — `file-code-editor`,
`file-download-view`, `file-html-editor`, `file-image-viewer`,
`file-markdown-editor`, `file-notebook`, `file-pdf-viewer` — have been deleted.
They were superseded by the panels in [`@semoss/panels`](../panels/AGENTS.md),
which do the same reading, saving and downloading through one shared pair of
hooks (`useFilePanel`, `useFileBuffer`). Open a file panel, or build on those
hooks the way `packages/terminal` does. Do not reintroduce a bespoke editor
here.

`components/notebook/` was never part of that island and stays:
`FileNotebookView` renders `Notebook` directly.

## Build System

`@semoss/shared` is **source-only** — it has no bundler and no `dist/`. Its `package.json`
`exports` point directly at `src/`, so consuming apps compile the TypeScript themselves. There
is intentionally **no `build` script**; keep the source type-clean and Biome-clean.

Key `exports`:

| Import | Resolves to |
|--------|-------------|
| `@semoss/shared` | `src/index.ts` (main barrel) |
| `@semoss/shared/globals.css` | `src/styles/globals.css` |
| `@semoss/shared/flexlayout.css` | `src/components/flex-layout/flexlayout.css` |
| `@semoss/shared/assets/img/*` | `src/assets/img/*` |

`sideEffects` is limited to `**/*.css`; consuming bundlers can tree-shake unused code.

## Structure

This library retains its package layout (no `pages/` or router):

| Folder / file | Purpose |
|---------------|---------|
| `assets/` | Images and static files |
| `components/` | Shared components, one folder per feature (file, monaco, flex-layout, mcp, prompts, skills, settings, engine, form, members, …) |
| `constants/` | Shared constant values |
| `contexts/` | React contexts (`<name>.context.tsx`) |
| `hooks/` | React hooks (`use-<name>.ts`) |
| `styles/` | `globals.css` (Tailwind source discovery) and other global CSS |
| `types.ts` | Shared TypeScript types |
| `workbench/` | Workbench primitives shared across apps |
| `index.ts` | Public package entry point |

## Key Dependencies

- `@semoss/sdk`, `@semoss/ui`, `@semoss/i18n`, `@semoss/utility` — workspace libs
- `monaco-editor` / `@monaco-editor/react` — code editor
- `flexlayout-react` — dockable layout
- `echarts` — charts
- `@iconify/react`, `lucide-react` — icons

## Design-System Notes

Follow the root [Design System & Styling](../../AGENTS.md#design-system--styling) rules and
[DESIGN.md](../../DESIGN.md).

- Shared domain components still compose `@semoss/ui/next`; this package is not a second
   component library or token source.
- Promote a composite here only when more than one application needs the same domain contract.
   Application-specific composition stays in its owning package.
- `src/styles/globals.css` supplies Tailwind source discovery only. Do not add design tokens
   there; token ownership remains in `@semoss/ui`.
- `flex-layout/flexlayout.css` is a third-party style bridge. Map its variables to semantic UI
   tokens and use the reason-bearing external-constraint carve-out for unavoidable literals.

## Agent Guardrails

### Do Not Modify

- **`exports` paths in `package.json`** — the `globals.css` / `flexlayout.css` subpaths
  are imported by name across the monorepo; renaming a file requires updating the export.

### Be Cautious With

- **Public entry points and legacy barrels** — preserve the manifest's supported exports
   and compatibility with untouched consumers; follow the React skill's
   [export policy](../../skills/react-standard.skill.md#architecture-and-exports).
- **`src/styles/globals.css`** — source discovery affects styles generated by consuming apps;
   design tokens belong to `@semoss/ui`.

### When Adding Shared Code

1. Put shared code in the matching library folder using the
   [React standard](../../skills/react-standard.skill.md).
2. Expose intentionally public symbols through `src/index.ts`. There is no supported
   `@semoss/shared/api` subpath; use the SDK's public API for backend transport.
3. Because this package is source-only, verify it compiles from a consumer:
   ```bash
   pnpm --filter @semoss/client type-check
   ```

### Testing Changes

```bash
pnpm check                          # Biome lint/format
pnpm --filter @semoss/client type-check   # Compiles shared from a consumer
```
