# AGENTS.md - @semoss/panels

> **Inherits from:** [root AGENTS.md](../../AGENTS.md): non-negotiables, task skills, and [standards](../../docs/README.md#standards).

The SEMOSS file panels: file views, the blueprints that mount them in a dock, the file
explorer variants, the MCP toolbox editor, and `useAccess`. Dock mechanics are in
[libs/workbench/AGENTS.md](../../libs/workbench/AGENTS.md).

## Boundaries

- **Why a package:** panels are both dock-aware and SEMOSS-aware. `@semoss/shared` would drag
  the dock into every consumer; `@semoss/workbench` must stay domain-agnostic. The layering is in
  [general.md](../../docs/standards/general.md#architecture).
- **Must not import:** any host (`packages/*`).
- **`src/index.ts` is curated, never `export *`.** Add a symbol when a consumer needs it;
  wildcards once leaked a `getImageMimeType` that clashed with shared's. Do not add viewer
  implementation subpaths.
- **State this package owns uses `StoreState`.** The `zustand` peer exists only for the dock.

## Invariants

- **A file view never calls a `useWorkbench*` hook**; they throw outside a provider.
  `createFileViewPanel` adds everything dock-shaped.
- **Nothing a panel imports may import `file-panel.components.ts`.** A module still initializing
  lands in the map as `undefined`: the dock shows "no component registered" and `matches` falls
  back to a shallow compare, with nothing thrown. Shared names live in
  `constants/file-panel.constants.ts`, which imports nothing. `file-panel.components.test.ts`
  states this; the playground's `use-sidebar-panel-active.test.tsx` reproduces a cycle.
- **`FILE_PANEL_TYPES` string values are a storage contract** for cached layouts.
- **Keep each OOXML viewer (DOCX, PPTX, VSDX, XLSX) lazy-loaded at the registry**, absent from
  the views barrel, so one format never loads the others.
- **An event with no subscriber does not belong here.**

## What a host has to wire up

Three things, each of which fails quietly or late if missed:

| | Why |
|---|---|
| `@import "@semoss/panels/globals.css"` (and the dock's) | Tailwind only generates classes it has scanned. A package outside the host's `@source` globs contributes none, and a missing utility renders as an unstyled panel — never a build error. |
| `aiSdkStubAlias` from `@semoss/panels/vite` | `pptx-react-viewer` imports the `ai` package (its unused AI chat panel). It is an optional peer and is not installed, so without the stub the **build fails outright**. |
| `scopePptxViewerCssPlugin` from `@semoss/panels/vite` | The viewer ships its own Tailwind build emitting the same class and token names as the host's. Unscoped, whichever sheet loads last restyles the whole document. |

Plus a `monaco-editor` alias to `libs/shared/node_modules/...` in every host that renders a
file panel (this package's `vite.config.ts` does the same for tests). Hosts register
`FILE_PANEL_COMPONENTS`; the client spreads `FILE_PANEL_TYPES` into its `WORKBENCH_COMPONENTS`.
A route that already read a permission seeds it with `Session.permissions.sync(type, id, permission)`.

## Validation

```bash
pnpm --filter @semoss/panels check-types
pnpm --filter @semoss/panels test
```

Also run an affected host when changing its panel or Vite integration. Tests give views their
own session with `<SessionProvider session={new SessionStore({ config: new ConfigStore() })}>`.

## Reference

- Dock model, mount policy, controls: [libs/workbench/AGENTS.md](../../libs/workbench/AGENTS.md)
- Adding a file view or host: [skills/add-workbench-panel.skill.md](../../skills/add-workbench-panel.skill.md)
