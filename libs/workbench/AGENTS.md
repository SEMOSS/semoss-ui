# AGENTS.md - @semoss/workbench

> **Inherits from:** [root AGENTS.md](../../AGENTS.md): non-negotiables, task skills, and [standards](../../docs/README.md#standards).

The multi-panel dock shell (no FlexLayout). A host supplies panel blueprints and a snapshot and
gets a dock back. It has no id (a host wanting a fresh dock passes a React `key`) and stores
nothing (the host owns persistence). It knows nothing about SEMOSS, engines, pixels, auth, or
permissions; `@semoss/panels` adds the SEMOSS file panels on top. Adding a panel, control, or
domain workbench: [add-workbench-panel](../../skills/add-workbench-panel.skill.md).

## Boundaries

- `@semoss/utility` is allowed but not declared yet; declare it in the change that first uses it.
- **Must not import:** `@semoss/sdk`, `@semoss/shared`, `@semoss/i18n`, `@semoss/panels`, any
  host, or a host's stores. Host stores take the dock as `{ workbench: StoreApi<WorkbenchState> }`.
- **Public entry point:** `src/index.ts`, with no `export *`; add a symbol only when a consumer
  needs it, and try deriving it first (`ComponentProps<typeof Workbench>`). Legacy barrels in
  `hooks/` and `stores/` stay for old consumers.
- **The component folder graph is acyclic:** `shell → {dock, panel, command, mobile}`,
  `dock → {panel, menu}`, `mobile → dock`; `chrome`, `menu`, `command`, `panel` point at nothing
  above them. Import defining files, never sibling barrels.
- **Every host imports `@semoss/workbench/globals.css`**, or the dock renders unstyled silently.

## Store

- **Slice writes nest:** `set((root) => ({ layout: { ...root.layout, tree } }))`. A missing spread
  drops the namespace, so bulk writes go through the slice's commit helper.
- **Transient writes stay plain `set`s** (`measureSlots`, `setPanelValue`, `setDragging`, …).
  Routing one through `commit` makes `onChange` persist it every frame
  (`use-workbench-life-cycle.test.tsx` pins this).
- **Moving off Zustand** to `StoreState` is one scoped change, since hosts hold a
  `StoreApi<WorkbenchState>`. Until then new dock state goes in the existing slices (`zustand` is a
  host-supplied peer).

## Panels

- **Type is not id.** Instances may share a type; never index `layout.values` by type or assume a
  well-known id outside the domain workbench that seeds it.
- **Blueprints are construction data** passed to `createWorkbenchStore`. Without them,
  `matchPanels` falls back to a shallow config compare and every file open spawns a tab.
- **Three channels between panels:** an event (`emit` / `useWorkbenchEvent`, only mounted panels
  hear it), `setValue` (current state or an api a late panel still needs), `selectPanel` (open
  now). Poking another panel's `values` is none of these.
- **A control does not re-render with its panel.** It is its own component in
  `<panel>-<action>-control.tsx`, subscribing to what it draws: domain state from its hook, panel
  state through the scratch `value`, and, to drive its panel, an identity-stable api the panel
  publishes there. An inline arrow or a closure over the panel's `useState` silently goes stale
  and remounts on every chrome render.
- **Drag to open:** intent lives in the drag type key, because only `dataTransfer.types` is
  readable during `dragover`, and `dropEffect` must be in the source's `effectAllowed` or `drop`
  never fires.

## Persistence and Access

- **The host owns where layouts live** and versions its cache names. `loadSnapshot` applies once
  per `snapshot` identity, so keep it stable; never pass `onChange` with a `snapshot` whose
  identity changes.
- **Panel type strings and the snapshot format are a storage contract.** A renamed type turns
  cached instances into "no component registered" placeholders.
- **Authorization is runtime state, never layout:** no `permission` or `readOnly` in records or
  snapshots. Resource panels call `useAccess` (`@semoss/panels`); domain workbenches call
  `Session.permissions.refresh` on mount. A background refresh never covers a working panel.

## Styling

- **`WorkbenchSide` is physical**, so a host wanting the rail on the other side in RTL moves the
  panel to the other border. Everything except the side-specific classes is logical.
- **`bg-black/50`** in the stage backdrop and busy scrim breaks the raw-color rule: known debt,
  not an exemption. It matches the `Dialog` overlay; the likely fix is a shared scrim token.

## Validation

```bash
pnpm --filter @semoss/workbench check-types
pnpm --filter @semoss/workbench test
rg -n '@semoss/(sdk|shared|i18n)|@/' libs/workbench/src --glob '*.{ts,tsx}'   # must stay empty
```
