# AGENTS.md - @semoss/terminal

> **Inherits from:** [root AGENTS.md](../../AGENTS.md): non-negotiables, task skills, and [standards](../../docs/README.md#standards).

## Purpose

The embedded terminal UI. A private package that `@semoss/client` consumes as source, and that
also runs standalone through Vite for development.

## Boundaries

- The dock supplies the explorer, file editor, and repl panels; `@semoss/panels` supplies
  `FileExplorerPane`, `useFilePanel`, `useFileBuffer`.
- `zustand` is only a peer of the dock; read the dock with `useWorkbench`. State the terminal owns
  uses a `StoreState` store ([state standard](../../docs/standards/react.md#state)), never Zustand.
- `src/index.ts` is the surface the client consumes. Changing it changes the app.
- New features follow the [architecture standard](../../docs/standards/general.md#architecture);
  existing components do not move.

## Invariants

- **Standalone sign in is the SDK `Session`, not an insight.** `main.tsx` calls
  `void Session.initialize()` before first render. `app.tsx` composes `LoginPage` (gated on
  `useSession` status) > `InsightProvider` > `EmbedTerminal`, so the insight is made only after
  sign in. Log out with `useSession((state) => state.logout)`: the insight's `actions.logout` does
  not notify `Session`. In the client, the client supplies its own session gate and insight.
- **RTL moves Files to the other border.** `WorkbenchSide` is physical, so the layout is built for
  the language's side. Check Arabic when you touch the layout.
- **The layout persists** per location and per multi/single mode.
- **Buckets have no read or save reactor**, so the editor's scope picker selects only INSIGHT,
  USER, or APP.

## Styling Debt

Follow [DESIGN.md](../../DESIGN.md) and the [styling standard](../../docs/standards/ui.md#styling).
Migrate these when you touch them:

- `src/components/tooltip.tsx` is a deprecated fork. Never extend it; use `Tooltip` from
  `@semoss/ui/next`.
- `save-modal.tsx` and `upload-modal.tsx` hand-roll `fixed inset-0` overlays and copy `Button`
  class strings. Use `Dialog` and `Button`.

## Validation

Check the standalone build and the client that consumes the source:

```bash
pnpm --filter @semoss/terminal type-check
pnpm --filter @semoss/terminal build
pnpm --filter @semoss/client type-check
```

## Reference

- [Workbench guide](../../libs/workbench/AGENTS.md) and
  [add-workbench-panel](../../skills/add-workbench-panel.skill.md)
- [Panels guide](../../libs/panels/AGENTS.md)
