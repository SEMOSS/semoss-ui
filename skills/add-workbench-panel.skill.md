---
name: add-workbench-panel
description: "Use when adding a dock panel, a panel chrome control, a domain workbench, a file view, or a new host app that mounts the dock or file panels."
---
# Add a Workbench Panel

## When to Use

- A new panel type in a dock, or a chrome control for an existing panel.
- A new `<Domain>Workbench` for an engine or project type.
- A new file view in `@semoss/panels`, or a new app that mounts the dock or file panels.

## Read First

- [libs/workbench/AGENTS.md](../libs/workbench/AGENTS.md): dock rules; the panel API is documented on
  its symbols in `libs/workbench/src`.
- [libs/panels/AGENTS.md](../libs/panels/AGENTS.md#what-a-host-has-to-wire-up): file panels and host wiring.
- [react.md](../docs/standards/react.md) and [general.md: Naming](../docs/standards/general.md#naming).

## Steps

**Add a panel (3 steps):**

1. Add its id to the host's panel-type constant, `WORKBENCH_COMPONENTS` in the client
   (`packages/client/src/stores/workbench/workbench.constants.ts`). Never use a raw string.
2. Co-export a module-scope blueprint const from the panel file, modeled on `ASSISTANT_PANEL` in
   [assistant-view.tsx](../packages/client/src/components/assistant/assistant-view.tsx). Module
   scope matters: blueprint identity churn remounts panels.
3. Reference it in a domain workbench's module-scope `COMPONENTS` map. If it opens by default,
   add a `WorkbenchPanelRecord` to the layout literal (the client keeps shared singletons in
   `WORKBENCH_PANEL_RECORDS`).

Then set `mount: "keepAlive"` if it holds anything a user would miss after a tab switch. Mark
`config` fields optional unless every opening site sets them. Keep `commands` / `menuItems`
hook-free; register React-dependent commands from the body with `useWorkbenchCommands`. A
resource panel calls `useAccess(type, id)` in its body and draws `WorkbenchPanelLoading` /
`WorkbenchPanelError` until ready.

**Add a chrome control:** call `useWorkbenchControl(id, content)` from the panel body, with
`content` a component in its own `<panel>-<action>-control.tsx` file beside the panel, built on
`WorkbenchChromeButton`. Domain state comes from the domain hook
([database-columns-refresh-control.tsx](../packages/client/src/components/workbench/engine/database/database-columns-refresh-control.tsx));
the panel's own state travels through `value`
([code-app-renderer-refresh-control.tsx](../packages/client/src/components/workbench/project/code/code-app-renderer-refresh-control.tsx)).

**Add a domain workbench:** one file with a module-scope `LAYOUT: WorkbenchLayout`, a
`COMPONENTS` map, a `useWorkbenchCommands([...])` call, and `<Workbench snapshot onUnmount
borderSlots />`. Follow
[function-workbench.tsx](../packages/client/src/components/workbench/engine/function/function-workbench.tsx).

1. Put toolbar controls (command menu, publish, settings toggle) in `borderSlots.left.after`;
   there is no `actions` prop. Add `<WorkbenchMenus />` in `borderSlots.top.before` for the
   View dropdown, passing `translate`, and forward the slot context's `onNavigate` on mobile.
2. The page wraps it in `<WorkbenchProvider components={COMPONENTS}>`. Blueprints go in at
   construction, never pushed later from an effect.
3. Cache the arrangement with `useCacheState` under a name built from what it is open on,
   including runtime variants such as read-only mode, plus a version.
4. Call `Session.permissions.refresh` (not `load`) on mount.
5. Give each command a `category` (`View`, `Go to`, `Editor`, `Project`, `Database`) and no
   icon; don't put the category in `label`.
6. If panels open from outside React or while `<Workbench>` is unmounted, create the store
   with `createWorkbenchStore({ components })`, pass `<WorkbenchProvider store={…}>`, and
   restore with `loadSnapshot` when creating it (the playground's room sidebar does this).

**Add a file view (`@semoss/panels`):** add one component per `FileEditorKind` in
`src/components/views/` that calls no `useWorkbench*` hook and publishes `FileViewControls`
through `onControls`. Wrap it with `createFileViewPanel({ name, view })` in the
`file-panel.components.ts` table. Lazy-load heavy viewers there. Use `matchesFilePanel` in
`matches`.

**Wire up a new host app:**

1. `@import "@semoss/workbench/globals.css"` and `@import "@semoss/panels/globals.css"`.
2. In `vite.config.ts`, add `aiSdkStubAlias` and `scopePptxViewerCssPlugin` from
   `@semoss/panels/vite`, and alias `monaco-editor` to `libs/shared/node_modules/...` as the
   existing hosts do.
3. Register `FILE_PANEL_COMPONENTS` (the client spreads `FILE_PANEL_TYPES` into its own
   `WORKBENCH_COMPONENTS`).
4. Load the `connectors` i18n namespace if it mounts connector viewers.

## Checklist

- [ ] Panel type comes from a constant; blueprint and `COMPONENTS` map are module scope.
- [ ] Mount policy chosen deliberately; `config` optionality matches the opening sites.
- [ ] Controls are separate files on `WorkbenchChromeButton`, not inline arrows.
- [ ] No `permission` / `readOnly` in records, layouts or snapshots.
- [ ] Panel-type strings unchanged (or cache version bumped); no sdk/shared/i18n import in `libs/workbench`.

## Verify

```bash
pnpm --filter @semoss/workbench --filter @semoss/panels check-types && pnpm --filter @semoss/workbench --filter @semoss/panels test
pnpm --filter @semoss/client test    # or the host you changed
```

Run the host: open the panel, switch tabs (keepAlive state survives), move it to a border,
reload (arrangement restores), and check the control tracks live state.
