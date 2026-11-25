# TypeScript Standard

Builds on [general.md](./general.md), which covers naming, exports, comments, and boundaries.
This file covers types only.

- [biome.json](../../biome.json) owns the lint rules. It does not catch `@ts-nocheck`; never use
  it. Narrow `unknown` and guard nullable values instead of asserting.
- A reason-bearing `@ts-expect-error` is allowed only for a type-negative test or a narrowly
  documented external typing defect. Never substitute it for `@ts-ignore` to silence an error.
- TypeScript is not a runtime guarantee. Validate payloads at trust boundaries
  ([general.md](./general.md#boundaries-and-errors)).
- Use type/interface contracts. Stores, store snapshots (`readonly` fields), and config objects get
  explicit interfaces.
- Declare return types on authored custom hooks and complex mapping functions. Trivial inline
  callbacks need no annotation.
- Prefer discriminated unions and literal unions over conflicting boolean flags.
- Use `as const` / `satisfies` for finite maps where useful. `as const` does not freeze objects at
  runtime.
- No magic values: pixel names, status strings, and units are named constants or literal unions.
  Booleans are only for true yes/no meanings.
- Replace stable repeated branching (status → label, command → handler) with a map checked by
  `satisfies Record<Union, …>`, so a new case is a compile error.
- Keep variables in the smallest scope, and never reuse one for a second meaning.
- Keep single-use types next to their owner. Extract shared types only when more than one file
  needs them.
