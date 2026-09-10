# AGENTS.md - @semoss/workbench

The multi-panel dock shell: core, store, context, hooks. Nothing here may know about SEMOSS,
engines, projects, pixels, or auth.

> **Inherits from:** [../../AGENTS.md](../../AGENTS.md) (root).

## What it is

A multi-panel dock shell (no FlexLayout). The core only knows about a `WorkbenchProvider`
scoped by an arbitrary unique `cacheKey` string; a host supplies the panel blueprints and the
default layout, and gets a dock back. `packages/client` is the first consumer — one
`<Domain>Workbench` component and one isolated store instance per engine and project type —
and the playground and terminal are the reason this is a package rather than a folder.

The model: **blueprints and instances**. A `WorkbenchPanelConfig` (blueprint) describes a
panel *type* — icon, content, capabilities, mount policy. A `WorkbenchPanelRecord` (instance)
is one open panel — a unique id pointing at a type, with its own name and `config`. The layout
is a tree of tabsets plus four collapsible borders; panel bodies render in a flat layer over
measured slots, so moving a tab never unmounts its body.

**The invariant, and the whole reason this package exists:** no import of `@semoss/sdk`,
`@semoss/shared`, `@semoss/i18n`, or anything host-shaped. The only runtime dependencies are
`react`, `@semoss/ui/next`, `lucide-react`, and `zustand` (a peer, so a host cannot end up with
two store instances). Verify with:

```sh
# match import/export specifiers only -- a bare grep also hits prose in comments
grep -rnE '^\s*(import|export)[^;]*from\s+"' src \
  | grep -E '@semoss/(sdk|shared|i18n)|"@/'
```

Two things that used to live here and deliberately do not any more: the **assistant**, which is
an agent harness and owns its own store in the host, and **resource permissions**, which are a
fact about (user, resource) and belong to the host's session. `WorkbenchState` is exactly
`{ layout, loading, command, control }`.

## One context, one hook, one namespace per domain

Everything reaches the per-mount store through `useWorkbench(selector)`. State is grouped by
domain — `layout`, `loading`, `command`, `control` — and each namespace carries its own fields
and its own `actions`:

```ts
const actions = useWorkbench((s) => s.layout.actions); // stable object — never re-renders
const panel = useWorkbench((s) => s.layout.panels[pid]); // narrow state reads
const open = useWorkbench((s) => s.command.isCommandOpen);
```

Select from the namespace that owns the action — `s.command.actions.registerCommand`,
`s.loading.actions.setLoading` — rather than expecting one merged object.

**A host's own stores are its own.** The client's assistant, database, and model stores each
take this store as an injected dependency (`{ workbench: StoreApi<WorkbenchState> }`) and are
provided beside it. The arrow only ever points host -> dock: nothing in this package may
import or assume any of them.

`useWorkbenchStoreApi()` returns the raw `StoreApi` (same context). Reach for it only in the
three cases that a selector genuinely cannot serve, and that are the only ones left in the tree:

- a vanilla `subscribe` that must not re-render (`core/use-workbench-events.ts`)
- wiring one store into another (a domain workbench wiring one store into another)
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

1. Add its id to `WORKBENCH_COMPONENTS` (the host's panel-type constant). Never use
   a raw string literal as a panel type.
2. Co-export a module-scope blueprint const from the panel file
  (`export const MY_PANEL: WorkbenchPanelConfig<MyPanelConfig> = { name, icon, content, … }`) —
  see the client's `FILE_CODE_EDITOR_PANEL` or `ASSISTANT_PANEL`. Module scope matters:
   blueprint identity churn remounts panels.
3. Reference it in a domain workbench's module-scope `COMPONENTS` map; if it should be open by
   default, add a `WorkbenchPanelRecord` to the layout literal (the client keeps its shared
   singletons in `WORKBENCH_PANEL_RECORDS`).

**Typing a panel.** `WorkbenchPanelConfig<P, V>` is generic: `P` is the shape of the `config`
its instances are opened with, `V` its scratch value. Annotate the blueprint once and every
renderer's props follow — `content`, `icon`, `header`, `matches`, `commands`, and
`menuItems` all get a typed `config` with no casts:

```tsx
export interface MyPanelConfig { path: string }

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
initialPath: "/public" }} />`. `useWorkbenchPanel(pid, location?)` (`core/use-workbench-panel.ts`) is
the one hook that builds these; `workbenchPanelProps(layout, pid)`
(`store/workbench-panel-props.ts`) is its pure, React-free twin for the vanilla
derivations.

**Panel type is not panel id.** `type` selects a blueprint; `id` identifies one instance of
that blueprint. Static layouts may deliberately seed a singleton whose `id` equals its `type`,
but that is a local layout convenience, not a workbench invariant. JSON-defined layouts and
runtime `spawnPanel` calls may assign arbitrary instance ids, and several instances may share
one type.

- A panel or control uses the `id` supplied in its props to read or update its own scratch
  `value`; never index `layout.values` by `type` or by a `WORKBENCH_COMPONENTS` value.
- Shared hooks and components locate another panel with `getPanel` / `findPanels` and its
  record/config, or use `selectPanel(type, config)` when reveal-or-create is the intent. They
  must not assume a well-known instance id.
- An owning domain workbench may access `layout.values[STATIC_PANEL_ID]` only when its own
  static layout literal/factory seeds that exact instance id. Keep that assumption local to
  the workbench. Do not copy it into panels, hooks, stores, or reusable helpers.
- When layouts become data-driven, commands must resolve the target instance from the loaded
  records/config instead of relying on the static-layout exception.

**Authorization is runtime state, never layout config.** Resource panels call
`useAccess(type, id)` directly in their body — it returns a discriminated union
(`"loading"` / `"error"` / `"ready"`), narrowing to `permission`/`readOnly` only once resolved.
Do not serialize `permission` or `readOnly` into a panel record, DB layout, or localStorage
snapshot. Backend authorization remains authoritative.

**The permission cache lives on the session store, not here.** A permission is a fact about
(user, resource), so two workbenches open on the same project can never disagree about whether
it is editable. Two consequences: a domain workbench calls `refreshPermission` (not
`loadPermission`) on mount, because the shared entry would otherwise be as old as whenever some
other workbench last fetched it — the `refreshing` / `refreshError` fields keep the stale
permission readable meanwhile, so nothing flashes to read-only; and the session clears the cache
on logout, because it outlives every workbench and would otherwise hand one user's access to
the next.

**`config` optionality is a claim.** `props.config` is backed by `record.config ?? {}`, so a
required field that no seeding site actually sets is `undefined` at runtime despite its type.
Mark a field optional unless every `selectPanel`/layout-literal that opens the panel sets it.

**`commands` / `menuItems` run outside React** — no hooks. They receive `(panel, get)` and
reach generic workbench state through `get`. When a command needs domain or React state,
register it from inside the body with `useWorkbenchCommands` instead.

**Mount policy — read this twice.** The default is `"lazy"`: a hidden panel UNMOUNTS. Any
panel with user-visible local state (unsaved editor buffer, terminal session, chat scroll,
search text, an iframe) MUST declare `mount: "keepAlive"`. Audit question: *"does it useState
anything a user would miss after a tab switch?"* If yes → keepAlive. `"eager"` additionally
mounts before first show (the assistant uses it to initialize while its border is collapsed).

## Adding a domain workbench

One file: module-scope `LAYOUT: WorkbenchLayout` + `COMPONENTS` map + a
`useWorkbenchCommands([...])` call + `<Workbench layout components borderSlots />`. Toolbar
controls (command menu, publish, settings toggle) go in `borderSlots.left.after` — there is no
separate `actions` prop. The page wraps it in
`<WorkbenchProvider cacheKey={<unique-cache-key>}>`; the key isolates all persisted workbench
state and should include runtime variants such as read-only mode. Follow
`engine/function/function-workbench.tsx` as the exemplar.

**Commands**: register palette commands with `useWorkbenchCommands([...])` (`hooks/use-workbench-commands.ts`) from the component that owns them — a domain workbench or a panel.
The array may be an inline literal: the hook re-registers only when
ids/categories/labels/descriptions change and executed handlers always run the latest closures,
so there are no effect dependencies to manage. Unregistration happens on unmount.

Commands carry no icons. Every command sets a `category` from the small fixed set — `View`
(open/close panels, borders, maximize, reset), `Go to` (panel navigation), `Editor`,
`Project`, `Database` — and the palette displays it as `Category: Label` (Title Case), sorted
alphabetically. Don't bake the prefix into `label`.

**Controls**: a panel contributes at most one chrome control with
`useWorkbenchControl(id, content)` (`hooks/use-workbench-control.tsx`) from inside its body —
there is no blueprint slot for this, precisely so `content` can reach the panel's own refs and
state. `content` receives `WorkbenchChromeProps` and owns its label, disabled state, and
click handling; the core only places it — in the **header row of the panel's stack**, and only
for that stack's **active** tab. A dock's header row is its tab strip (the control lands beside
the maximize button); a border has no strip, so the shell draws one over the open body and the
control sits there. The rail carries navigation only — it is one `chromeButton` wide, which
fits a glyph and nothing else. There are no effect dependencies to manage: the hook keeps
`content` in a ref it refreshes every render and registers one stable wrapper, so registration
churns only when a control appears or disappears, and a keepAlive panel's registration simply
waits, hidden, until its tab is front again.

**A control does not re-render with its panel — read this twice.** It draws inside
`WorkbenchPanelControls` (`core/workbench-panel-header.tsx`), a separate subtree subscribed only
to `s.control.controls[pid]` and to `useWorkbenchPanel(pid, location)`. Refreshing the ref
schedules nothing, so a fresh closure sits unread until the *chrome* re-renders for its own
reasons — a control closed over a panel's `useState` silently never updates.

So **a control is its own component in its own file** (the repo's one-component-per-file rule),
named `<panel>-<action>-control.tsx` beside the panel, subscribing to whatever live state it
draws. Live domain state comes from the domain hook (the chrome sits under the same
`WorkbenchProvider`); the panel's own state has to travel through the store, which is what the
never-persisted scratch `value` is for — the panel gets `value`, the control gets `setValue`:

```tsx
// database-columns-refresh-control.tsx — live state off the domain store
export const DatabaseColumnsRefreshControl: FC<WorkbenchChromeProps> = () => {
	const isLoading = useDatabaseWorkbench((s) => s.structure.status === "LOADING");
	…
};

// code-app-renderer-refresh-control.tsx — the panel's own state, via `value`
export const CodeAppRendererRefreshControl: FC<
	WorkbenchChromeProps<WorkbenchPanelParams, number>
> = ({ setValue }) => <Button onClick={() => setValue((count = 0) => count + 1)}>…</Button>;
```

`useWorkbenchControl` infers `P`/`V` from the component's annotation, so a typed control needs
no cast (the registry erases them behind `WorkbenchControlAny`, same as `WorkbenchPanelConfigAny`).
The three live controls — `engine/database/database-columns-refresh-control.tsx`,
`engine/database/database-new-query-control.tsx`, `project/code/code-app-renderer-refresh-control.tsx`
— are the exemplars. An inline arrow is a second cost on top of the staleness: it takes a new
identity every render, so whenever the chrome *does* re-render, React sees a new element type at
the wrapper's child and remounts the control, resetting an open popover or focus inside it.

A blueprint that draws its own heading sets `enableBorderHeader: false` to suppress the shell's
row (`components/assistant/assistant-view.tsx` is the one case). That opts out of the control
slot too — such a panel owns its whole chrome and draws its actions in its own heading. Note
the mobile shell renders no controls at all; it has no rails and no per-panel header row.

**Publishing a whole api on `value`.** The four file-explorer panels show the pattern for a
control that needs to *drive* its panel rather than just show a flag: `useFileExplorer` returns
an identity-stable api object, so the panel publishes it once —
`useEffect(() => setValue(explorer), [explorer])` — and `file-explorer-control.tsx` reads
`value` and calls `value.commands.*`. Two constraints come with it:

- **`setValue` is not identity-stable.** `useWorkbenchPanel` rebuilds a panel's methods whenever
  its `value` changes, so listing `setValue` in that effect's dependencies loops forever. Omit
  it (with a `biome-ignore` naming the reason) and depend only on the stable payload.
- **The control still does not re-render with its panel.** It sees live *behaviour*, not live
  *state*, so it must draw only fixed content. That is why `FileExplorerRefreshAction` has no
  loading spinner: a status-driven glyph in the chrome would freeze mid-animation.

- `selectPanel(type, config?, opts?)` reveals an existing instance matching `config` (blueprint
  `matches`, shallow-equal default) or spawns a new one. `matches` does **not** imply
  uniqueness — `spawnPanel` bypasses it — so when several instances match, the one already on
  screen wins. It returns the selected or created **instance id**. Commands should use it —
  never target tabset ids (the empty-tabset fallback regenerates them).
- **`closePanel` deletes the instance.** There is no reopen history: the record and its scratch
  `value` are dropped, so `layout.panels` always means exactly "what is open". Anything that
  looks a panel up by config depends on that — a lingering record for a closed panel would keep
  matching forever and get revealed instead of a live one. A cache written before this was true
  is pruned on load (`applySnapshot`).
- `spawnPanel(type, opts?)` always creates a new instance; `opts.target` supports
  `{ kind: "border", side }` and `{ kind: "join", tabsetId }`.
- File-style panels dedupe via blueprint `matches` on `config.path` — ids are minted, never
  encode data in them.

**Dropping something in from outside the dock.** `core/workbench-spawn-drag.ts` owns a small
protocol: a native HTML5 drag that carries `WORKBENCH_SPAWN_DRAG_TYPE` (write it with
`writeSpawnDragSpec`) asks the shell to open a panel where it lands. `WorkbenchDragLayer` picks
these up alongside its pointer-event tab drags, resolves them through the same
`useWorkbenchHitTest` geometry, and commits with `spawnPanel` followed by `movePanel`.

Both halves are deliberate. **`spawnPanel`, not `selectPanel`**: a drag is a request for a
*new* view, so dragging a file that is already open leaves the open instance exactly where it
is and adds a second one — blueprint `matches` dedupe still applies to `selectPanel`, which is
what clicking the file in the explorer uses. **Then `movePanel`**, because `spawnPanel` honours
only `border` and `join` targets itself, so routing every drop through the move is what makes
`split` and `root` work.

Two more constraints worth knowing before touching this:

- **The payload is additive.** The same drag still carries the explorer's own move payload, so
  a row-to-row file move inside the tree is unaffected. Only `dataTransfer.types` is readable
  during `dragover`, which is why the intent lives in the key and the spec is read on `drop`.
- **`dropEffect` must be one of the operations the source's `effectAllowed` names.** The
  explorer's rows allow `copyMove`; the dock asks for `copy` (the file stays put) and a folder
  row asks for `move`. Ask for something outside `effectAllowed` and the browser resolves the
  drag to "none" — it still paints the drop preview and then silently never fires `drop`.

## File map

| File/folder | Role |
|---|---|
| `core/` | The dock core: shell (`workbench.tsx`), stage/tabset/tab/strip/border, panel layer + hosts (never-unmount bodies), drag layer + drop geometry, resizers, context menu, mobile shell + its drawer, events bridge, command palette + menu button, reset button |
| `core/workbench-command-palette.tsx` | Cmd/Ctrl+Shift+P or F1 palette: registered commands + layout-derived entries (built only while open), icon-less `Category: Label` rows in a deterministic alphabetical order |
| `core/workbench-mobile-drawer.tsx` / `core/workbench-reset-button.tsx` | On desktop the reset control rides at the end of the left rail, appended to `borderSlots.left.after`. The mobile layout has no rails, so `WorkbenchMobile` passes that slot to its **drawer** instead: the pager bar's ☰ opens a bottom drawer leading with that slot content + reset as an actions row, then every open panel as one full-width row that switches to it. Reset restores the default layout (hidden when `readOnly`) |
| `core/use-workbench-hit-test.ts` | The ordered geometric drop resolution, shared by the pointer-event tab drag and native spawn drags |
| `core/workbench-spawn-drag.ts` | The `dataTransfer` protocol for "dropping me should open a panel" |
| `store/workbench.types.ts` | Every workbench type: `WorkbenchLayout`, `WorkbenchPanelConfig`, `WorkbenchPanelProps`, `WorkbenchComponent`, plus `WorkbenchCommand` and `WorkbenchSlice`. One file — don't start a second |
| `store/workbench-panel-props.ts` | Pure builders for a panel's flat props (no React) — used by the hook and the vanilla command/menu derivations |
| `store/slices/workbench-layout.slice.ts` | The dock state + `actions` (registry, slots, persistence, ephemeral UI) |
| `store/slices/workbench-layout.tree.ts` | Pure, DOM-free tree ops |
| `store/slices/workbench-layout.commands.ts` | Layout-derived palette entries |
| `store/slices/workbench-controls.slice.ts` | Panel-contributed chrome controls, keyed by panel id; each control is its own `*-control.tsx` file beside its panel |
| `workbench.context.tsx` | `WorkbenchProvider` — one store per mount |
| `index.ts` | The public surface — deliberately explicit, not `export *`. Shell internals (tabset, tab, stage, border, drag layer, panel hosts) stay private; the `WorkbenchTabset` **component** in particular would collide with the `WorkbenchTabset` layout-node type |

## Rules

- **Keep it domain-agnostic.** This is the package's reason to exist; see the grep above.
- **The mobile drawer is mobile-only, and its state is local.** `WorkbenchMobile` owns one
  `useState` boolean and renders `WorkbenchMobileDrawer` itself; the shell does not. Nothing
  outside that view can open it, so it has no representation in the layout store — don't add
  one back. It does one thing: pick a panel. Rename, move, and close are desktop affordances
  (tab context menu, drag, tab close button); mobile deliberately has no per-panel menu.
- **`canRename` gates user affordances only** (double-click, F2, context menu). Programmatic
  `renamePanel`/`rename` always works — a host's dirty `*` marker depends on it.
- **Layout is cached by the `WorkbenchProvider.cacheKey`** as a `WorkbenchSnapshot`. A cached
  layout shadows the default forever, so a host must change its provider key whenever the
  default's shape changes, and include runtime variants such as read-only mode in the key so
  they cannot hydrate incompatible layouts. Old entries are orphaned, not migrated.
  `loadLayout` hydrates on mount and every structural commit persists.
- **Panel type ids are host data, and the storage format is a contract.** `WorkbenchPanelType`
  is `string`; the core never enumerates ids. `applySnapshot` prunes records whose type the
  host no longer registers, so changing a panel-id *string* silently drops that panel out of
  every saved layout. The persistence keys (`smss-workbench--layout--<cacheKey>--1`,
  `smss-workbench--commands--<cacheKey>--1`) are part of that contract too.
- **`layout.cacheKey` is read-only state.** Exposed so a sibling store can scope itself to the
  same workbench without being handed the key twice; it is not persisted (`buildSnapshot`
  picks fields explicitly).
- **readOnly** blocks structural edits (move/split/pin/user-rename/reset) at the store level
  and hides their affordances; navigation, opening files, and closing closable panels still
  work, and the instance still persists under its own id.

## Be cautious with

- `workbench.store.ts` and `core/workbench.tsx` — shared by every consumer.
- **Mount policy** — re-read the "read this twice" note above before changing a blueprint's.
- **Control re-render semantics** — likewise. A control does not re-render with its panel.
