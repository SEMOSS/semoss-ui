# Testing and Validation Standard

What to test, how to name and select, and which checks prove a change. The
[review-change skill](../../skills/review-change.skill.md) runs these checks before handoff.

## Naming and Selectors

- Name test files `*.test.ts` / `*.test.tsx`, never `*.spec.ts`. Existing `*.spec.ts` files are
  not renamed.
- Select by role and accessible name first. When that is not enough, use a stable id or
  `data-testid="fileName-component-uniqueIdentifier"`.

## What to Test

- Test observable behavior, not implementation details.
- Test a feature's pure model and hooks without real infrastructure; test `api/` modules at the
  seam with SDK mocks ([general.md: Architecture](./general.md#architecture)).
- Hooks: changed inputs, returned actions, independent state across consumers, loading and error
  states. Hooks that own resources: cleanup on input change and unmount, safe under Strict Mode,
  stale async results.
- For relevant app changes: previous-state updates, focus and state preservation, zero-count
  rendering, immutable transforms, storage fallback, and accessible async states.
- Cover normal, boundary, invalid, and error cases, not only the happy path.
- Test each `api/` mapping against realistic payload fixtures, not only through components.
- Test at pinch points: the one function many effects pass through, not every consumer.
- Never delete or weaken a failing test to finish a change; update it only to the intended new
  behavior.
- Performance claims need profiler, browser, or production-bundle evidence, not inference.
- Mocked SDK tests do not prove backend compatibility. Say so when backend behavior is unverified.

## Validation Commands

Run the focused check first, then widen:

```bash
pnpm exec biome check <files>          # lint + format for touched files
pnpm --filter <package> test           # package tests
pnpm --filter <package> type-check     # where the package defines it
pnpm check                             # whole-repo Biome check
```

- [biome.json](../../biome.json) is the source of truth for lint rules, severities, formatting,
  and file exceptions. Do not restate it in guidance.
- Lint does not certify architecture, effect purpose or cleanup, runtime validation, explicit hook
  return types, justified suppressions, accessibility, or performance. Review those separately.
- Biome checks the working tree, not the index. For partially staged files, inspect the staged
  version with `git show :path/to/file`. Do not stage another person's changes.
- Record the actual type-check result and separate introduced failures from baseline errors;
  filtering to touched paths alone can miss broken consumers.
- Report exactly what ran, what failed, and what was not covered. For documentation-only changes,
  verify links, metadata, and examples; do not claim application or WCAG conformance from prose.
