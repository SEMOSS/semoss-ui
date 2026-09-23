# AGENTS.md - @semoss/panels

The SEMOSS file panels: seven file *views*, the blueprints that mount them in a dock, three
explorer variants, the MCP toolbox editor, and the resource-permission cache they read.

> **Inherits from:** [../../AGENTS.md](../../AGENTS.md) (root).
> Load the applicable [root skills](../../skills/README.md), including the
> [React standard](../../skills/react-standard.skill.md), for general implementation rules.

## Why this is its own package

The panels are both dock-aware and SEMOSS-aware, and neither existing lib can hold that:

- `@semoss/shared` would have to depend on `@semoss/workbench`, dragging the dock into every
  consumer of shared — including ones that never mount one.
- `@semoss/workbench` cannot take them at all. It exists to be domain-agnostic; these run pixels.

So the layering is one direction, three layers:

```
@semoss/ui ← @semoss/workbench ← @semoss/panels → @semoss/shared → @semoss/sdk
```

Nothing here may import from a host (`packages/*`). `zustand` is a **peer** dependency,
matching the dock. Hosts supply a compatible version and explicitly share the intended
store instances; a peer declaration alone does not guarantee shared state.

## Layout

```
src/
├── components/
│   ├── views/  one component per file kind
│   └── ...     the blueprint factory, the chrome control, explorers, `mcp/` editor UI
├── hooks/      file-panel, explorer, and MCP hooks
├── utility/    file-panel and MCP utility functions
├── types/      access, file-panel, and MCP types
├── constants/  file-panel runtime constants
├── styles/     the Tailwind `@source` every host imports
├── vite/       build-time bits a host cannot skip (see below)
└── index.ts    curated public surface
```

`src/vite/` is Node-side and is **not** in the barrel — it has its own `./vite` export subpath.

## Access is provided by the host

Panels call `useAccess(type, id)` from `@semoss/sdk/react`. The client receives access from its
scoped SDK `SessionProvider`, so permissions sit beside the user they belong to and are cleared on
logout or identity change. A host without a session, such as playground or terminal, creates a
standalone SDK `createAccessStore()` and mounts the SDK `AccessProvider`.

Worth knowing when reasoning about cost: an `INSIGHT` permission resolves to `"EDIT"` with no
network call at all.

`file-explorer-control.tsx` also uses `useAccess`; chrome controls remain under the host-level SDK
provider even though they render outside an individual panel subtree.

## A view renders a file; a host draws its actions

`components/views/` holds one component per `FileEditorKind`. A view owns the read, the buffer
and its own view switch, and renders the file and nothing else. It publishes what it can do
(`FileViewControls`) through `onControls`, and its host draws that.

`createFileViewPanel({ name, view })` is the only host today: it wraps a view as a
`WorkbenchPanelConfig`, republishes the controls as the panel's scratch value, registers
`FileViewControl` so they appear in the tab strip, and subscribes to `FILES_CHANGED`. The
blueprints are a table in `file-panel.components.ts`; there are no per-panel files.

The split is still worth keeping: a view calls no `useWorkbench*` hook, so a host that is not a
dock can mount one by supplying its own chrome and skipping `useFilesChanged`.

## Rules

- **A file view never calls a `useWorkbench*` hook.** They throw outside a provider, and both
  hosts mount the same views. Anything dock-shaped belongs in `createFileViewPanel`.
- **`src/index.ts` is curated, not `export *`.** Of the sixty symbols the source tree used to
  leak, eight had an external consumer. Panel blueprints are not among them — a host registers
  `FILE_PANEL_COMPONENTS`. Add a symbol when a consumer needs it; `export *` also put
  `getImageMimeType(path)` next to `@semoss/shared`'s incompatible `getImageMimeType(extension)`
  in any barrel that re-exported both.
- **`useFilePanel` and `useFileBuffer` are public**, for a host whose editor needs chrome of its
  own. `packages/terminal` builds on them: its editor carries a Run toolbar and a scope guard,
  and the dock allows one control per panel, so it cannot inherit the code editor's blueprint
  wholesale. That is the supported way to reuse the access/read/save/dirty machinery.
- **Nothing a panel imports may import `file-panel.components.ts`.** It is an object literal
  over every blueprint, so a module still initializing when it is built lands in the map as
  `undefined` — the dock then renders "no component registered" and `matches` silently falls
  back to a shallow compare, with nothing thrown. That is exactly what homing `isFilePanelType`
  there did: it closed the cycle `file-panel.components` → `file-explorer-panel` →
  `use-workbench-file-panels` → `file-panel.components`, and left the file explorer blueprint
  undefined in every host. The predicate lives in `file-panel.constants.ts`, which imports
  nothing. `file-panel.components.test.ts` states the invariant, and the playground's
  `use-sidebar-panel-active.test.tsx` is what actually reproduces a cycle — it enters through
  the package specifier, the way a host does.
- **`FILE_PANEL_TYPES` string values are a storage contract.** Changing one breaks cached
  layouts that reference the old type; preserve compatibility when changing registrations.
  The client spreads these into its own `WORKBENCH_COMPONENTS`.
- **`FILE_PANEL_COMPONENTS` defines what "a file panel" *is* at runtime.** `useWorkbenchFilePanels`
  decides which open panels follow a rename by membership in it, never by the shape of a config —
  the Git panels carry the same `{ type, id, name, path }` fields and were being swept up.
- **Workbench event names live in `file-panel.constants.ts`, beside the panel types.** That file
  imports nothing, which is what keeps an event name safe to import from anywhere — the same
  cycle rule as `isFilePanelType`. The hook that subscribes is an ordinary hook in `hooks/`.
- **An event with no subscriber does not belong here.** `useFilesChanged` earns its place because
  four explorers and eight file panels consume it; an event added "for later" is surface with no
  consumer, and the dock's own panel-lifecycle events were deleted for exactly that reason.
- **Never dereference `a.mode.type` in a blueprint `matches`.** It runs inside `selectPanel`, a
  store action outside any error boundary; a config it cannot read must return false, not throw.
  Use `matchesFilePanel`.
- **Keep PPTX viewer content lazy-loaded internally.** The manifest exposes only the root,
  `globals.css`, and `vite` entry points, not a `file-pptx-view-content` public subpath.
  Do not turn the heavy viewer into an eager public-barrel import.
- **Monaco needs the `monaco-editor` alias.** Every host that renders a file panel aliases the bare
  specifier at `libs/shared/node_modules/...`; `vite.config.ts` here does the same so the tests run.
- Everything else about panels — blueprints, mount policy, chrome controls, the dirty `*` marker —
  is in [the dock's AGENTS.md](../workbench/AGENTS.md) and
  [the client's](../../packages/client/src/components/workbench/AGENTS.md).

## What a host has to wire up

Three things, each of which fails quietly or late if it is missed:

| | Why |
|---|---|
| `@import "@semoss/panels/globals.css"` (and the dock's) | Tailwind only generates classes it has scanned. A package outside the host's `@source` globs contributes none, and a missing utility renders as an unstyled panel — never a build error. |
| `aiSdkStubAlias` from `@semoss/panels/vite` | `pptx-react-viewer` imports the `ai` package (its unused AI chat panel). It is an optional peer and is not installed, so without the stub the **build fails outright**. |
| `scopePptxViewerCssPlugin` from `@semoss/panels/vite` | The viewer ships its own Tailwind build emitting the same class and token names as the host's. Unscoped, whichever sheet loads last restyles the whole document. |

Plus the `monaco-editor` alias above. All of it lives here rather than in each host's
`vite.config.ts`, so adding a third host is an import rather than an archaeology exercise.

## Validation

This package is source-only; it has no build script. From the repository root:

```bash
pnpm --filter @semoss/panels check-types
pnpm --filter @semoss/panels test
```

Also exercise an affected host when changing its panel or Vite integration.
