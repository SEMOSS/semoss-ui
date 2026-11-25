# AGENTS.md - @semoss/shared

> **Inherits from:** [root AGENTS.md](../../AGENTS.md): non-negotiables, task skills, and [standards](../../docs/README.md#standards).

## Purpose

Domain components, adapters, and types that more than one app needs: sign in, the file explorer,
Monaco wrappers, engine/MCP/prompt/skill UI, members, usage limits, chat reply parts, tool views,
the activity log. **Check here first** before building a domain component in an app.

## Boundaries

- Generic helpers belong in [@semoss/utility](../utility/AGENTS.md); backend transport uses the
  SDK.
- Composes `@semoss/ui/next`; not a second component library or token source. Promote a composite
  here only when more than one app needs the same domain contract.
- No state library. Shared state uses `StoreState` ([state standard](../../docs/standards/react.md#state));
  migrate the listener set in `hooks/use-catalog-image.ts` when touched.
- Source-only: consumers compile it. Do not rename an exported path without updating `exports`.

## Invariants

- **Sign in is the session's, never an insight's.** A host calls `Session.initialize()` once (after
  `Env.update` and any `waitForEmbedAuth()`), gates on `LoginPage`, and mounts its
  `InsightProvider` inside the gate. Apps with their own route gate take Retry from
  `useSessionRetry()`.
- **`PersonIdentity` is the only way to show a person.** Extend it; do not build another row or
  avatar. A stack of bare avatars is the one exception.
- **The old file editors are gone.** Never reintroduce `FileEditor` or bespoke viewers here; use
  `@semoss/panels` file panels or `useFilePanel`/`useFileBuffer`. `components/notebook/` stays.

## Validation

```bash
pnpm check
pnpm --filter @semoss/client type-check   # compiles shared from a consumer
```
