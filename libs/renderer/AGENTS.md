# AGENTS.md - @semoss/renderer

> **Inherits from:** [root AGENTS.md](../../AGENTS.md): non-negotiables, task skills, and [standards](../../docs/README.md#standards).

## Purpose

Renders SEMOSS app and insight **block JSON** into a live UI: the block engine plus the built-in
block and cell definitions that apps compose at runtime.

## Boundaries

- Workspace packages are peers, so hosts supply them.
- `src/index.ts` is curated; export a symbol only when a consumer needs it
  ([architecture](../../docs/standards/general.md#architecture)).

## Invariants

- **State stays on the existing MobX store, and this library migrates last.** Block state is
  mutated in place behind `dispatch` and read through `observer` and `computed`, here and in
  `@semoss/client`. Moving to `StoreState` ([state standard](../../docs/standards/react.md#state))
  needs an agreed design for immutable, structurally shared block updates and a profile of large
  apps first. Until then new block and cell state uses the existing store and its `dispatch`
  actions; add no second mechanism.
- **Block and cell definition shapes are a runtime contract** that apps depend on.
- **Styling carve-out:** `src/components/block-defaults/**/*Block.tsx` may render user-configured
  colors, fonts, and sizes. Mark each runtime inline-style site with the reason-bearing
  `inline-visual-style` suppression defined in [DESIGN.md](../../DESIGN.md); the folder is not
  otherwise exempt. The renderer's own chrome (toolbars, menus, editors, settings panels) follows
  the [styling standard](../../docs/standards/ui.md#styling) fully.

## Validation

```bash
pnpm --filter @semoss/renderer test
pnpm --filter @semoss/renderer build
```
