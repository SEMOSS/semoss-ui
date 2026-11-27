# AGENTS.md - @semoss/browser-automation

> **Inherits from:** [root AGENTS.md](../../AGENTS.md): non-negotiables, task skills, and [standards](../../docs/README.md#standards).

## Purpose

A private Vite harness that drives a browser over sockets for Playwright and automation scenarios,
and exposes a SEMOSS MCP surface (`mcp/pixel_mcp.json`).

## Boundaries

- Generic helpers come from `@semoss/utility/<category>` ([utility guide](../../libs/utility/AGENTS.md));
  domain policy and UI behavior stay here. Keep public compatibility adapters when moving helpers.
- **State:** React state and hooks, no state library. Shared state uses `StoreState`
  ([state standard](../../docs/standards/react.md#state)).
- New features follow the [architecture standard](../../docs/standards/general.md#architecture);
  existing folders are not an implicit migration task.

## Styling Debt

- **The local `@theme` block in `src/index.css` is deprecated**: a rival, dark-only palette on top
  of `@semoss/ui/globals.css`. Add no tokens to it and do not diverge its values. New UI uses the
  semantic classes (`bg-background`, `bg-card`, `text-destructive`, …) per the
  [styling standard](../../docs/standards/ui.md#styling). When touching a file that uses the local
  classes (`bg-surface-raised`, `border-line`, `text-danger`), migrate those usages.

## Validation

```bash
pnpm check
pnpm --filter @semoss/browser-automation type-check
pnpm --filter @semoss/browser-automation build
```
