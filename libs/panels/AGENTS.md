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
└── index.ts
```

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
