# AGENTS.md - Workbench

Covers the workbench feature: `components/workbench/` (this folder), its paired state in
`stores/workbench/`, `contexts/workbench.context.tsx`, and `hooks/use-workbench*.ts`.

> **Inherits from:** [../../../AGENTS.md](../../../AGENTS.md) (client) and
> [../../../../../AGENTS.md](../../../../../AGENTS.md) (root).

## What it is

A FlexLayout-based multi-panel editor shell, **not tied to engines specifically** — the core
(`workbench.tsx`, `stores/workbench/`, `contexts/workbench.context.tsx`, `use-workbench.ts`)
only knows about a `WorkbenchProvider` scoped by an arbitrary unique `id` string. Consumers are
the engine types (database, function, model, storage, vector, guardrail) and the project types
(notebook, code, skill, agent), each with one `<Domain>Workbench` component and one isolated store
instance scoped by an `id`.

**BLOCKS is the last project type still on the legacy `components/workspace/` shell**
(`WorkspaceManager` + MobX `WorkspaceStore`). Until it migrates, don't delete
`components/workspace/`, `stores/workspace/`, or `components/app-workspace/` — the latter also
backs the standalone `/app/:appId/files` route.

## File map

| File/folder | Role |
|---|---|
| `workbench.tsx` | Shared renderer — takes `layout`, `components` map, optional `actions`; renders `FlexLayout.Layout` + command palette + loading overlay |
| `workbench.constants.ts` | Re-exports `WORKBENCH_COMPONENTS`; defines `WORKBENCH_PANEL_TABS` (shared tab payloads) |
| `workbench-command-palette.tsx` | Cmd/Ctrl+Shift+P or F1 palette over `state.commands` |
| `workbench-reset-button.tsx` | Restores the default layout; rendered by `workbench-actions.tsx` unless the workbench is `readOnly` |
| `engine/` | Engine-scoped panels/controls shared across engine domains: file explorer, file editor, MCP editor, settings panel + toggle |
| `engine/<domain>/` (`database/`, `function/`, `model/`, `storage/`, `vector/`, `guardrail/`) | One `<Domain>Workbench` per engine type |
| `project/` | Project-scoped (`APP` mode) equivalents of the `engine/` panels: file explorer, file editor, MCP editor, terminal, insight explorer, settings toggle, publish button. Sibling of `engine/`, **not** inside it |
| `project/<domain>/` (`notebook/`, `code/`, `skill/`, `agent/`) | One `<Domain>Workbench` per project type |
| `stores/workbench/workbench.store.ts` | `createWorkbenchStore(id, domainSlice?)` merges base slices + optional domain slice |
| `stores/workbench/slices/` | `layout` (FlexLayout model, open/close/rename/update panel, **localStorage persistence**), `loading` (`isLoading`), `command` (registry) |
| `stores/workbench/<domain>/` | Optional namespaced domain slice (only `database/` has one) |
| `contexts/workbench.context.tsx` | `WorkbenchProvider` — one store per mount |
| `hooks/use-workbench.ts`, `use-<domain>-workbench.ts` | Selector hooks into the scoped store |

## Rules

- **Keep the core domain-agnostic** — `workbench.tsx`, `workbench.store.ts`,
  `workbench.types.ts`, `slices/`, `workbench.context.tsx`, and `use-workbench.ts` must not
  import engine-specific things (`useEngine`, engine api calls, etc.). Domain-specific
  dependencies belong in `<domain>/` (or a shared folder like `engine/`), never in the core.
- **New panel** → add its id to `WORKBENCH_COMPONENTS` (`stores/workbench/workbench.constants.ts`)
  first. Never use a raw string literal as a component id.
- **Reuse before building** — check `engine/` (engine-scoped) or `project/` (project-scoped) for
  an existing panel (file explorer/editor, MCP editor, terminal, settings) before writing a new
  one. The two sets are not interchangeable: `engine/` panels call `useEngine()` and run
  `*EngineAsset*` pixels, `project/` panels call `useProject()` and run `*AppAsset*` pixels.
- **New domain workbench** → one `<Domain>Workbench` in its own folder, building a
  `FlexLayout.IJsonModel` + a `components: Record<string, WorkbenchPanelConfig>` map, rendered
  via `<Workbench layout={...} components={...} />`. Wire it up from its own page with
  `<WorkbenchProvider id={<unique-instance-id>}>` — `id` just needs to be unique per instance,
  it does not have to be an `engine_id`.
- **New domain state** → add it as its own namespaced key (e.g. `database: {...}`), never
  spread flat into `WorkbenchState`. Add a typed selector hook mirroring
  `use-database-workbench.ts` (cast state to `WorkbenchState & <Domain>SliceState`, select the
  namespaced key).
- **`openPanel(id, options, target)`** requires an explicit tab `options` payload — there's no
  default panel fallback. `target` is `{ type: "TAB", id? }` or `{ type: "BORDER", location }`.
- **One store per workbench instance** — never share a `WorkbenchProvider`/store across
  instances (engine or otherwise).
- **Panels that belong to every project type go in `project/`**, not in a `project/<domain>/`
  folder — `ProjectPublishButton` and `ProjectInsightExplorerPanel` are shared by code/skill/agent.
  A component that registers a command should register it itself (see
  `project-publish-button.tsx`), so a workbench gets both the button and the palette entry by
  rendering one thing.
- **Layout is cached per `id`** under `getWorkbenchCacheKey(id)`
  (`smss-workbench--<id>-v1`). A cached layout shadows the default forever, so **bump the `-v1`
  suffix** whenever a default layout changes shape — old entries are orphaned, not migrated.
  Nothing else needs wiring: `loadLayout` hydrates on mount and `onModelChange`/`setModel` persist.

## Be cautious with

- `workbench.constants.ts` (both copies) and `workbench.store.ts` / `workbench.tsx` — shared by
  every domain workbench.
- `workbench-layout.slice.ts`'s `closePanel` — non-closeable tabs can't be deselected in
  FlexLayout, so it falls back to deselecting the border or selecting a sibling tab; re-read
  before changing panel close/select behavior.
