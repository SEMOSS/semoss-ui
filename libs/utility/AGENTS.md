# AGENTS.md - @semoss/utility

> **Inherits from:** [root AGENTS.md](../../AGENTS.md): non-negotiables, task skills, and [standards](../../docs/README.md#standards).

## Purpose

Small, reusable, framework-independent helpers shared across SEMOSS libraries and applications.
UI behavior and domain logic belong in their owning packages. Search for an existing helper before
adding one; categories and import examples are in the [README](./README.md).

## Boundaries

- **Runtime-independent.** `@semoss/sdk` bundles the categories it imports into its published
  build, so every helper stays free of framework imports.
- **React lives only in `src/react/`.** Nothing outside it imports `react` or `src/react/`, and the
  root does not export it, so every category stays usable without React and in Node. One hook per
  file with its own `exports` entry, no `index.ts`, and no SEMOSS, SDK, or UI knowledge. The SDK
  bundles these into its React entry and keeps `react` external.
- Import the defining category, not a compatibility re-export.

## StoreState

`StoreState` ([`src/store.ts`](./src/store.ts)) is the basis for shared application state across
the repo. The [state standard](../../docs/standards/react.md#state) owns how stores are built on
it, and [`store.test.ts`](./src/store.test.ts) pins what it guarantees. A change to the class is a
change to every store built on it: add a test for each behavior you rely on or alter, and keep it
free of external dependencies.

## Validation

```bash
pnpm --filter @semoss/utility test
pnpm --filter @semoss/utility type-check   # several tests assert what must not compile
pnpm check
```
