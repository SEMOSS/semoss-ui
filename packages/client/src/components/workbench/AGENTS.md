# AGENTS.md - Workbench

Covers the workbench feature: `components/workbench/` (this folder), its paired state in
`stores/workbench/`, `contexts/workbench.context.tsx`, and `hooks/use-workbench*.ts`.

> **Inherits from:** [../../../AGENTS.md](../../../AGENTS.md) (client) and
> [../../../../../AGENTS.md](../../../../../AGENTS.md) (root).

## What it is

A multi-panel dock shell (no FlexLayout — the dock core lives in `core/`), **not tied to
engines specifically**. The core only knows about a `WorkbenchProvider` scoped by an arbitrary
unique `id` string. Consumers are the engine types (database, function, model, storage, vector,
guardrail) and the project types (notebook, code, skill, agent), each with one
`<Domain>Workbench` component and one isolated store instance.

The model: **blueprints and instances**. A `WorkbenchPanelConfig` (blueprint) describes a
panel *type* — icon, content, capabilities, mount policy. A `WorkbenchPanelRecord` (instance)
is one open panel — a unique id pointing at a type, with its own name and `config`. The layout
is a tree of tabsets plus four collapsible borders; panel bodies render in a flat layer over
measured slots, so moving a tab never unmounts its body.

**BLOCKS is the last project type still on the legacy `components/workspace/` shell**
(`WorkspaceManager` + MobX `WorkspaceStore`). Until it migrates, don't delete
`components/workspace/`, `stores/workspace/`, or `components/app-workspace/` — the latter also
backs the standalone `/app/:appId/files` route. The settings admin query page mounts
`AdminQueryWorkbench` (`engine/database/admin-query-workbench.tsx`) — the database workbench
panels over a synthetic `EngineContext`, initialized in `ADMIN_SQL` mode so structure and
queries run the admin-permission pixels.

## One context, one hook, one namespace per domain

Everything reaches the per-mount store through `useWorkbench(selector)`. State is grouped by
domain — `layout`, `loading`, `command`, `assistant`, `notifications` — and each namespace
carries its own fields and its own `actions`:

```ts
const actions = useWorkbench((s) => s.layout.actions); // stable object — never re-renders
const panel = useWorkbench((s) => s.layout.panels[pid]); // narrow state reads
const open = useWorkbench((s) => s.command.isCommandOpen);
```

Select from the namespace that owns the action — `s.command.actions.registerCommand`,
`s.loading.actions.setLoading` — rather than expecting one merged object. There are no other
React contexts.

`useWorkbenchStoreApi()` returns the raw `StoreApi` (same context). Reach for it only in the
three cases that a selector genuinely cannot serve, and that are the only ones left in the tree:

- a vanilla `subscribe` that must not re-render (`core/use-workbench-events.ts`)
- wiring one store into another (`engine/database/database-workbench.tsx`)
- reading live state per animation frame (`core/workbench-drag-layer.tsx`'s hit-test)

Needing a *fresh* read inside an imperative handler is not one of them — that belongs on a query
action beside `canClose` / `findPanels` / `getPanel`, where it closes over the slice's own `get()`
and costs no subscription.

**Adding a slice.** Type it `WorkbenchSlice<TState>`. `set`/`get` are the whole store's, so a
slice owns its namespace explicitly — `get().layout.hydrated`, and every write nests:

```ts
set((root) => ({ layout: { ...root.layout, tree } }));
```

Miss the spread and you drop the rest of the namespace, so route bulk writes through one commit
helper the way the layout slice does. Reaching across namespaces is just another read off
`get()`; the third argument is the root `StoreApi`, for `api.subscribe`.

## Adding a panel (3 steps)

1. Add its id to `WORKBENCH_COMPONENTS` (`stores/workbench/workbench.constants.ts`). Never use
   a raw string literal as a panel type.
2. Co-export a module-scope blueprint const from the panel file
   (`export const MY_PANEL: WorkbenchPanelConfig<MyPanelConfig> = { name, icon, content, … }`) —
   see `ENGINE_FILE_EDITOR_PANEL` or `WORKBENCH_ASSISTANT_PANEL`. Module scope matters:
   blueprint identity churn remounts panels.
3. Reference it in a domain workbench's module-scope `COMPONENTS` map; if it should be open by
   default, add a `WorkbenchPanelRecord` to the layout literal (shared singletons live in
   `WORKBENCH_PANEL_RECORDS`, `components/workbench/workbench.constants.ts`).

**Typing a panel.** `WorkbenchPanelConfig<P, V>` is generic: `P` is the shape of the `config`
its instances are opened with, `V` its scratch value. Annotate the blueprint once and every
renderer's props follow — `content`, `icon`, `header`, `matches`, `commands`, and
`menuItems` all get a typed `config` with no casts:

```tsx
export interface MyPanelConfig { path: string; readOnly?: boolean }

export const MyPanel: WorkbenchComponent<MyPanelConfig> = ({ config, rename }) => …;

export const MY_PANEL: WorkbenchPanelConfig<MyPanelConfig> = {
	matches: (a, b) => a.path === b.path,   // a.path is `string`, not `unknown`
	icon: ({ name, className }) => …,       // flat props, no `ctx`/`api` wrapper
	content: MyPanel,
};
```

Panel renderers receive `WorkbenchPanelProps` **flat** — `id`, `type`, `name`, `config`,
`value`, `isVisible`, `rename`, `close`, `moveTo`, `setConfig`, `setValue`,
`select`. Chrome slots (`icon`/`header`) get the same object plus `location` and
`status`. Wrapping another panel is a spread: `<Other {...props} config={{ ...props.config,
readOnly: true }} />`. `useWorkbenchPanel(pid, location?)` (`core/use-workbench-panel.ts`) is
the one hook that builds these; `workbenchPanelProps(layout, pid)`
(`stores/workbench/workbench-panel-props.ts`) is its pure, React-free twin for the vanilla
derivations.

**`config` optionality is a claim.** `props.config` is backed by `record.config ?? {}`, so a
required field that no seeding site actually sets is `undefined` at runtime despite its type.
Mark a field optional unless every `selectPanel`/layout-literal that opens the panel sets it.

**`commands` / `menuItems` run outside React** — no hooks. They receive `(panel, get)`; reach
store state through `get`, and a domain store through its vanilla accessor (e.g.
`getDatabaseWorkbenchStore(get())`, see `DATABASE_COLUMNS_PANEL`). When a command needs React
state, register it from inside the body with `useWorkbenchCommands` instead.

**Mount policy — read this twice.** The default is `"lazy"`: a hidden panel UNMOUNTS. Any
panel with user-visible local state (unsaved editor buffer, terminal session, chat scroll,
search text, an iframe) MUST declare `mount: "keepAlive"`. Audit question: *"does it useState
anything a user would miss after a tab switch?"* If yes → keepAlive. `"eager"` additionally
mounts before first show (the assistant uses it to initialize while its border is collapsed).

## Adding a domain workbench

One file: module-scope `LAYOUT: WorkbenchLayout` + `COMPONENTS` map + a
`useWorkbenchCommands([...])` call + `<Workbench layout components borderSlots />`. Toolbar
controls (command menu, publish, settings toggle) go in `borderSlots.left.after` — there is no
separate `actions` prop. The page wraps
it in `<WorkbenchProvider id={<unique-instance-id>}>` — `id` just needs to be unique per
instance. Follow `engine/function/function-workbench.tsx` as the exemplar.

**Commands**: register palette commands with `useWorkbenchCommands([...])` (`hooks/
use-workbench-commands.ts`) from the component that owns them — a domain workbench or a panel.
The array may be an inline literal: the hook re-registers only when
ids/categories/labels/descriptions change and executed handlers always run the latest closures,
so there are no effect dependencies to manage. Unregistration happens on unmount.

Commands carry no icons. Every command sets a `category` from the small fixed set — `View`
(open/close/reopen panels, borders, maximize, reset), `Go to` (panel navigation), `Editor`,
`Project`, `Database` — and the palette displays it as `Category: Label` (Title Case), sorted
alphabetically. Don't bake the prefix into `label`.

**Controls**: a panel contributes at most one chrome control with
`useWorkbenchControl(id, content)` (`hooks/use-workbench-control.tsx`) from inside its body —
there is no blueprint slot for this, precisely so `content` can close over the panel's own refs
and state. `content` receives `WorkbenchChromeProps` and owns its label, disabled state, and
click handling; the core only places it — in the **header row of the panel's stack**, and only
for that stack's **active** tab. A dock's header row is its tab strip (the control lands beside
the maximize button); a border has no strip, so the shell draws one over the open body and the
control sits there. The rail carries navigation only — it is one `chromeButton` wide, which
fits a glyph and nothing else. An inline `content` is fine (the hook registers one stable
wrapper, so identity churn never remounts it), and a keepAlive panel's registration simply
waits, hidden, until its tab is front again. See `project/code/code-app-renderer-panel.tsx`
(the refresh control) as the exemplar.

A blueprint that draws its own heading sets `enableBorderHeader: false` to suppress the shell's
row (`assistant/workbench-assistant-view.tsx` is the one case). That opts out of the control
slot too — such a panel owns its whole chrome and draws its actions in its own heading. Note
the mobile shell renders no controls at all; it has no rails and no per-panel header row.

- `selectPanel(type, config?, opts?)` reveals an existing instance matching `config` (blueprint
  `matches`, shallow-equal default), restores a closed match, or spawns a new one. Commands
  should use it — never target tabset ids (the empty-tabset fallback regenerates them).
- `spawnPanel(type, opts?)` always creates a new instance; `opts.target` supports
  `{ kind: "border", side }` and `{ kind: "join", tabsetId }`.
- File-style panels dedupe via blueprint `matches` on `config.path` — ids are minted, never
  encode data in them.

## Domain state (database is the template)

Domain state gets a **dedicated store**, not a slice: `stores/workbench/database/
database-workbench.store.ts` exports `createDatabaseWorkbenchStore(deps)`. The domain
workbench creates it once, attaches it via `actions.attachDomainStore(store)`, and a flat hook
(`hooks/use-database-workbench.ts`) reads it back with one documented cast. No provider
component, no generics. Layout coupling is explicit: paired panels carry `config.sourcePanel`,
titles derive reactively (custom `header` reading the workbench store), and cleanup runs
through the shell's `onPanelClose(pid, record)` prop.

## File map

| File/folder | Role |
|---|---|
| `core/` | The dock core: shell (`workbench.tsx`), stage/tabset/tab/strip/border, panel layer + hosts (never-unmount bodies), drag layer + drop geometry, resizers, context menu, panel sheet/drawer, mobile shell, events bridge, command palette + menu button, reset button |
| `workbench.constants.ts` | Re-exports `WORKBENCH_COMPONENTS`; defines `WORKBENCH_PANEL_RECORDS` (shared instance records) |
| `core/workbench-command-palette.tsx` | Cmd/Ctrl+Shift+P or F1 palette: registered commands + layout-derived entries (built only while open), icon-less `Category: Label` rows in a deterministic alphabetical order |
| `core/workbench-panel-sheet.tsx` / `core/workbench-reset-button.tsx` | On desktop the reset control rides at the end of the left rail, appended to `borderSlots.left.after`, and the panel sheet is a right-side panel manager. The mobile layout has no rails: the pager bar's ☰ opens the sheet as a bottom drawer that leads with that same slot content + reset as an actions row, followed by every open panel as a tappable row. Reset restores the default layout (hidden when `readOnly`) |
| `engine/`, `engine/<domain>/` | Engine-scoped panels + one `<Domain>Workbench` per engine type |
| `project/`, `project/<domain>/` | Project-scoped (`APP` mode) equivalents; sibling of `engine/`, **not** inside it |
| `stores/workbench/workbench.types.ts` | Every workbench type: the dock domain (`WorkbenchLayout`, `WorkbenchPanelConfig`, `WorkbenchPanelProps`, `WorkbenchComponent`, …) plus `WorkbenchCommand` and `WorkbenchSlice`. One file — don't start a second |
| `stores/workbench/workbench-panel-props.ts` | Pure builders for a panel's flat props (no React) — used by the hook and the vanilla command/menu derivations |
| `stores/workbench/slices/workbench-layout.slice.ts` | The dock state + `actions` (registry, slots, persistence, ephemeral UI) |
| `stores/workbench/slices/workbench-layout.tree.ts` | Pure, DOM-free tree ops |
| `stores/workbench/slices/workbench-layout.commands.ts` | Layout-derived palette entries |
| `stores/workbench/database/` | The database domain store (the dedicated-store template) |
| `contexts/workbench.context.tsx` | `WorkbenchProvider` — one store per mount |

## Rules

- **Keep the core domain-agnostic** — `core/`, the layout slice/tree/commands,
  `workbench.context.tsx`, and `use-workbench.ts` must not import engine/project-specific
  things. Domain dependencies belong in `engine/`/`project/`.
- **Engine vs project panels are not interchangeable**: `engine/` panels call `useEngine()` and
  run `*EngineAsset*` pixels; `project/` panels call `useProject()` and run `*AppAsset*`
  pixels. Reuse before building.
- **Relative imports inside this folder** — never import `@/components/workbench` (the barrel)
  from within it; that creates cycles.
- **Panels that belong to every project type go in `project/`**, not in a `project/<domain>/`
  folder. A component that owns a command should register it itself via
  `useWorkbenchCommands` (see `project-publish-button.tsx`).
- **`canRename` gates user affordances only** (double-click, F2, menu, sheet). Programmatic
  `renamePanel`/`rename` always works — the file editors' dirty `*` marker depends on it.
- **Layout is cached per `id` and per layout version** as a
  `WorkbenchSnapshot`. A cached layout shadows the default forever, so **bump that
  `WorkbenchLayout.version`** whenever the default's shape changes — old entries are orphaned,
  not migrated. The version is per-workbench, so a bump only invalidates its own layout.
  `loadLayout` hydrates on mount and every structural commit persists.
- **readOnly** blocks structural edits (move/split/pin/user-rename/reset) at the store level
  and hides their affordances; navigation, opening files, and closing closable panels still
  work, and the instance still persists under its own id.

## Be cautious with

- `workbench.constants.ts` (both copies), `workbench.store.ts`, and `core/workbench.tsx` —
  shared by every domain workbench.
- **Store composition order** in `workbench.store.ts`: the assistant-notification slice
  subscribes to the assistant slice and must stay composed after it.
- **The assistant blueprint is `mount: "eager"`** — it must initialize (and surface
  notifications) while its border is collapsed. Don't "optimize" it to lazy.
- **The database close cascade** (`onPanelClose` → `handlePanelClosed`): closing a query panel
  closes its paired results panel and prunes store state. Re-read before changing panel
  close/select behavior.
- **`DatabaseWorkbenchMode` is three-valued** (`SQL | SPARQL | ADMIN_SQL`): `ADMIN_SQL` is
  always SQL-language but runs the admin-permission pixels and has no category fetch or CSV
  export. Gate query-language behavior on `mode !== "SPARQL"`, never `mode === "SQL"`, or the
  admin query page silently loses it.
