# AGENTS.md - Workbench

Covers the workbench feature: `components/workbench/` (this folder), its paired state in
`stores/workbench/`, `contexts/workbench.context.tsx`, and `hooks/use-workbench*.ts`.

> **Inherits from:** [../../../AGENTS.md](../../../AGENTS.md) (client) and
> [../../../../../AGENTS.md](../../../../../AGENTS.md) (root).

## What it is

A FlexLayout-based multi-panel editor shell, **not tied to engines specifically** — the core
(`workbench.tsx`, `stores/workbench/`, `contexts/workbench.context.tsx`, `use-workbench.ts`)
only knows about a `WorkbenchProvider` scoped by an arbitrary unique `id` string. Today every
consumer is an engine type (database, function, model, storage, vector, guardrail), each with
one `<Domain>Workbench` component and one isolated store instance scoped by an `id`.

## File map

| File/folder | Role |
|---|---|
| `workbench.tsx` | Shared renderer — takes `layout`, `components` map, optional `actions`; renders `FlexLayout.Layout` + command palette + loading overlay |
| `workbench.constants.ts` | Re-exports `WORKBENCH_COMPONENTS`; defines `WORKBENCH_PANEL_TABS` (shared tab payloads) |
| `workbench-command-palette.tsx` | Cmd/Ctrl+Shift+P or F1 palette over `state.commands` |
| `engine/` | Panels/controls shared across domains: file explorer, file editor, MCP editor, settings panel + toggle |
| `engine/<domain>/` (`database/`, `function/`, `model/`, `project/`, `storage/`, `vector/`, `guardrail/`) | One `<Domain>Workbench` per engine type |
| `stores/workbench/workbench.store.ts` | `createWorkbenchStore(id, domainSlice?)` merges base slices + optional domain slice |
| `stores/workbench/slices/` | `layout` (FlexLayout model, open/close/rename/update panel), `loading` (`isLoading`), `command` (registry) |
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
- **Reuse before building** — check `engine/` for an existing panel (file explorer/editor, MCP
  editor, settings) before writing a new one; those are engine-specific though, so a non-engine
  domain (e.g. `project/`) will need its own equivalents rather than importing from `engine/`.
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

## Be cautious with

- `workbench.constants.ts` (both copies) and `workbench.store.ts` / `workbench.tsx` — shared by
  every domain workbench.
- `workbench-layout.slice.ts`'s `closePanel` — non-closeable tabs can't be deselected in
  FlexLayout, so it falls back to deselecting the border or selecting a sibling tab; re-read
  before changing panel close/select behavior.
