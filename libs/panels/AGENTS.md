# AGENTS.md - @semoss/panels

The SEMOSS file panels: eight editor/viewer blueprints, three explorer variants, the MCP toolbox
editor, and the resource-permission cache they read. Everything here is a `WorkbenchPanelConfig`
or something one of them needs.

> **Inherits from:** [../../AGENTS.md](../../AGENTS.md) (root).

## Why this is its own package

The panels are both dock-aware and SEMOSS-aware, and neither existing lib can hold that:

- `@semoss/shared` would have to depend on `@semoss/workbench`, dragging the dock into every
  consumer of shared — including ones that never mount one.
- `@semoss/workbench` cannot take them at all. It exists to be domain-agnostic; these run pixels.

So the layering is one direction, three layers:

```
@semoss/ui ← @semoss/workbench ← @semoss/panels → @semoss/shared → @semoss/sdk
```

Nothing here may import from a host (`packages/*`). `zustand` is a **peer** dependency, matching
the dock — two copies would mean two store instances and silently divergent state.

## Layout

```
src/
├── access/     the permission cache, its provider, and `useAccess`
├── files/      the panels, their controls, and the two hooks they are built from
├── mcp/        the MCP toolbox editor (canonical copy — see below)
├── styles/     the Tailwind `@source` every host imports
├── vite/       build-time bits a host cannot skip (see below)
└── index.ts
```

`src/vite/` is Node-side and is **not** in the barrel — it has its own `./vite` export subpath.

## Access is provided by the host

Panels call `useAccess(type, id)`, which reads whatever store the nearest `AccessStoreProvider`
carries. The contract is structural (`StoreApi<PermissionCache>`) so a host can fold the cache into
a bigger store:

- **The client** folds `createPermissionCache` into its session store, so permissions sit beside
  the user they belong to and are **cleared on logout** — without that, one user's `OWNER` survives
  into the next user's session in the same tab.
- **A host with no session** (the playground, a test) mounts `createAccessStore()`.

Worth knowing when reasoning about cost: an `INSIGHT` permission resolves to `"EDIT"` with no
network call at all.

`file-explorer-control.tsx` reads `state.permissions[key]` directly rather than through
`useAccess`. That is deliberate — a chrome control renders outside its panel's subtree, so it
cannot reuse the access the panel already resolved.

## The MCP editor is duplicated on purpose

`src/mcp/` is the canonical copy. `packages/client/src/components/shared/mcp-json-editor/` is a
second one kept alive only for the legacy BLOCKS workspace, and is deleted when BLOCKS migrates
off FlexLayout. Do not re-point the panel at the client's copy to remove the duplication — that
would invert the dependency this package exists to establish.

## Rules

- **`src/files/index.ts` is curated, not `export *`.** Of the sixty symbols the folder used to
  leak, eight had an external consumer. Panel blueprints are not among them — a host registers
  `FILE_PANEL_COMPONENTS`. Add a symbol when a consumer needs it; `export *` also put
  `getImageMimeType(path)` next to `@semoss/shared`'s incompatible `getImageMimeType(extension)`
  in any barrel that re-exported both.
- **`useFilePanel` and `useFileBuffer` are public**, for a host whose editor needs chrome of its
  own. `packages/terminal` builds on them: its editor carries a Run toolbar and a scope guard,
  and the dock allows one control per panel, so it cannot inherit `FILE_CODE_EDITOR_PANEL`
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
- **`FILE_PANEL_TYPES` string values are a storage contract.** `applySnapshot` prunes records whose
  type a host no longer registers, so changing one silently drops that panel out of every cached
  layout. The client spreads these into its own `WORKBENCH_COMPONENTS`.
- **`FILE_PANEL_COMPONENTS` defines what "a file panel" *is* at runtime.** `useWorkbenchFilePanels`
  decides which open panels follow a rename by membership in it, never by the shape of a config —
  the Git panels carry the same `{ type, id, name, path }` fields and were being swept up.
- **Never dereference `a.mode.type` in a blueprint `matches`.** It runs inside `selectPanel`, a
  store action outside any error boundary; a config it cannot read must return false, not throw.
  Use `matchesFilePanel`.
- **`file-pptx-viewer-content` has its own export subpath** and must stay separately importable —
  two call sites `lazy()` it, and folding it into the barrel silently loses the chunk split.
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
