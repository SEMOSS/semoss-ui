# AGENTS.md - @semoss/ui Component Library

> **Inherits from:** [root AGENTS.md](../../AGENTS.md): non-negotiables, task skills, and [standards](../../docs/README.md#standards).

## Purpose

The single source of truth for design: shadcn/ui and Radix primitives styled with Tailwind CSS v4
(CSS-first; there is no `tailwind.config.*`). Tokens live in
[src/styles/globals.css](src/styles/globals.css); components live in [src/next/](src/next/), and
`src/next/index.ts` is the inventory. To add or change a component, use
[build-component](../../skills/build-component.skill.md).

## Boundaries

- **Never import `@semoss/utility`**, and own no store: components keep state in React
  (`useState`, context, controlled props).
- Consumers import only from `@semoss/ui/next`, and add `@import "@semoss/ui/globals.css";` once
  at the top of each app's `index.css`.
- The `@/*` alias (`@/lib/utils`) is internal to this package. Consumers never use it.
- Exception to the root rule: related components share a file (`Card`, `CardHeader`, `CardContent`).

## Invariants

- **Tokens:** a new token needs light (`:root`) and dark (`.dark`) values plus an `@theme inline`
  mapping, and changes every app. There is no `info` token; propose one before inventing blue
  status styling. Exceptions follow the [carve-outs](../../docs/standards/ui.md#carve-outs).
- **Reuse existing `cva` variant names**; never add synonyms. Every part carries `data-slot`, and
  `className` goes last in `cn()`.
- Peer dependency versions stay in sync with consuming packages. Never edit `dist/`. Be careful
  with `src/next/index.ts`, `src/index.ts`, `vite.config.ts`, and `components.json`: they affect
  every consumer.

## Validation

```bash
pnpm exec biome check libs/ui
pnpm --filter @semoss/ui build
```

Then check the change in a consumer (`pnpm --filter @semoss/playground dev`).

## Reference

- [DESIGN.md](../../DESIGN.md) for composition, and the
  [styling standard](../../docs/standards/ui.md#styling) for class usage
- [build-component](../../skills/build-component.skill.md) for the authoring pattern
