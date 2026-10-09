# AGENTS.md - @semoss/shared

This document provides context for AI coding assistants working with the SEMOSS shared
utilities and components library.

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Load the applicable
> [root skills](../../skills/README.md); the [React standard](../../skills/react-standard.skill.md)
> owns general implementation, naming, imports, and validation rules.

## Overview

`@semoss/shared` holds the cross-application components, utilities, and types that more than
one app needs. **Check here first** for domain components, adapters, and types.
Generic functions belong in [@semoss/utility](../utility/AGENTS.md); consume their
category subpaths instead of duplicating them inside components.

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

**A host can bring its own source.** Pass `adapter` to `useFileExplorer` to browse something
other than an asset tree, such as a connector's drive: the adapter builds each listing's Pixel,
maps the output to `FileItem`s (`mapEntries(raw, path)` is handed the folder it listed, for a
source whose entries carry no path), and says what the source can do. A source keeps anything
its rows need in `FileItem.data`; `itemActions` adds the host's row button and context-menu
entries, `renderError` draws a failed listing the host's way, and `searchScope: false` hides the
scope choice for a search that always covers everything. `@semoss/connectors`' drive views are
built this way.

**Every row's menu has three ways in.** Right-click, the row's More actions button, and
Shift+F10 or the menu key on a focused row open the same menu, so the context-menu entries a
host adds through `itemActions` are reachable without a right-click: from the keyboard, and on
touch screens, where the button always shows. `tree.openContextMenu` takes the mouse or key
event and places the menu at the pointer, or under the focused element when there is none. The
keys act on the focused row, as in VS Code: `TreeViewItem` leaves focus on a row when it is
clicked and on a folder's chevron while its children load, so they act on the row last clicked.
The header's shortcuts tooltip points mouse users at right-click and the button, not the keys. A
row's state (selected, its menu open, a drop target) highlights the whole row, its icon or
chevron included, through `TreeViewItem`'s `rowClassName`.

`FileExplorer` is **not** deprecated — it is the shell `@semoss/panels`'
`FileExplorerPane` renders, and `libs/panels` is its main consumer.

### Tool views (`components/tool-view/`)

A tool names the view a call is drawn with in `_meta.SMSS_MCP_UI.resourceURI`. A
`component://<library>/<view>?<params>` URI names a React component the host draws in the page,
never in a frame; `system://` and portal paths stay pages. This folder is the contract between
the libraries that provide views and the hosts that draw them, and knows nothing about any one
library:

- `ToolViewProps` is what every view receives: the `call` (its reactor, arguments, result, and
  status), the URI's `params` (such as `intent` and `provider`, which configure the view and never
  carry data), the `mode` (`approval` while the call waits for the user, `result` otherwise), the
  decisions (`onApprove` with edited arguments, `onDecline`, and `onRespond`, which resolves the
  call with what the user did instead, without running it), and the `host`'s offers (sign in,
  save, add to context).
- A library exports a `ToolViewLibrary`, a plain map of views by name, usually lazy. A host passes
  the libraries it draws to `ToolViewProvider`, at module scope, and finds a call's view with
  `useToolView(uri)`, which returns null for a URI it does not draw.
- `ToolViewRenderer` draws a found view with a placeholder while its code loads and the host's
  fallback if it fails (`ToolViewBoundary`). A host shows its generic view for a `component://`
  URI it cannot draw (`isToolViewUri`).

`@semoss/connectors` provides the `mail` and `calendar` libraries; the playground draws them.

### Members (`components/members/`)

`MembersTable` lists a project's or engine's members and opens `AddMembersOverlay` to add more.
When the server can search the organization's Microsoft directory (`msGraphLookup` in
`/api/config`), the host passes `isDirectoryAvailable` and the dialog shows `UserSourceToggle`,
a choice between existing users and the whole organization. The dialog starts on the
organization and sends the choice as `msGraphLookup`. Without the prop it sends nothing and the
backend decides, which means the directory whenever the directory is available. A person picked
from the directory gets an account when their permission is saved. The table reads no config
itself: the client keeps `/api/config` in its own store, and the other apps read it through
`useInsight`.

`AddMembersOverlay` is the one dialog for adding people anywhere in the apps. For a project or
engine, pass `id` and `type`. To add people to something else, such as a team's members or
managers, pass a `people` source instead: it loads the candidates, adds the people picked, and
can retitle the dialog and mark people who cannot be picked, by click or by Enter. With
`people`, the dialog picks people without access levels. When its `add` rejects, the dialog keeps
the people picked and stays open, and the host's list reloads when it closes, since some may have
been added. Add and Delete are disabled while their request runs. Reuse it rather than building
another people picker.

`MembersTable` is likewise the one members table. Teams use it for their members and managers by
passing a `source` that loads, removes and adds people (its `people` goes to the add dialog) and
can rename a member, for example to "Manager". With a `source` the table has no permission column
or edit dialog, and `readOnly` alone decides whether the viewer can change the list. A new
`source` reloads the list from the start with nothing selected, and a failed load shows its error
with Try Again. It marks the signed in user with a star either way.

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
| `assets/` | Images and static files. `assets/img/connectors/` holds each Microsoft 365 and Google Workspace app's logo as an SVG named by app (`outlook.svg`, `gmail.svg`, ...), except Teams, which is `assets/img/MS_TEAMS.svg`; `ConnectorBrandIcon` shows them, and any package can import them as `@semoss/shared/assets/img/connectors/*` |
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
