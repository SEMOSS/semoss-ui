---
name: build-feature
description: "Use when adding a new screen, route, or feature to an application (client, playground, collaboration, terminal, automation, auditlog), or extending an existing feature with new model, hooks, api calls, or components."
---

# Build a Feature

## When to Use

Adding or extending a user-facing feature in an app under `packages/`. For a single shared
component use [build-component](./build-component.skill.md); for a dock panel use
[add-workbench-panel](./add-workbench-panel.skill.md).

## Read First

- The owning package's `AGENTS.md`, and the feature folder's `AGENTS.md` if one exists.
- [general.md: Architecture](../docs/standards/general.md#architecture) and
  [general.md: Naming](../docs/standards/general.md#naming)
- [react.md](../docs/standards/react.md) and [typescript.md](../docs/standards/typescript.md)
- [DESIGN.md](../DESIGN.md) for the surface archetype and layout

## Steps

1. State the goal and the smallest change that meets it. Search the package, `@semoss/shared`,
   `@semoss/sdk/react`, and `@semoss/utility` for something to reuse first.
2. Pick the folder: `src/features/<feature>/`. Choose a file prefix and use it for every new file.
3. Write the model first: types and pure functions (`<prefix>-<what>.ts`), no React or SDK. Make
   illegal states unrepresentable.
4. Add backend access in `api/` with SDK primitives
   ([call-backend](./call-backend.skill.md)). Map responses to the model there.
5. Add hooks (`use-<prefix>-<what>.ts`) that orchestrate the model, `api/`, and any store. Shared
   state goes in a `StoreState` store ([add-store](./add-store.skill.md)).
6. Add components (`<prefix>-<what>.tsx`) that only render and wire events, built from
   `@semoss/ui/next`. Forms follow [build-form](./build-form.skill.md).
7. Add or update the route: a thin `<name>.page.tsx` under `pages/` and the `<name>.routes.tsx`
   entry, lazy-loaded where the router does so.
8. Put every user-facing string through i18n
   ([add-translations](./add-translations.skill.md)) in the right casing
   ([ui.md: UI Text](../docs/standards/ui.md#ui-text)).
9. Write tests for the model and hooks, plus one behavior test through the main component
   ([testing.md](../docs/standards/testing.md)).
10. Comment every export with what it is for and any non-obvious why
    ([comments](../docs/standards/general.md#comments)). Put rules in types, tests, and those
    comments. Add a feature `AGENTS.md` only for what the code cannot carry.

## Checklist

- [ ] The model imports no React, SDK, or browser APIs
- [ ] Components make no SDK calls and have no business branching
- [ ] Every new file follows `<prefix>-<what>.<role>`
- [ ] Loading, empty, and error states are handled and accessible
- [ ] Mobile layout works ([ui.md: Responsive](../docs/standards/ui.md#responsive-and-touch))
- [ ] No new MobX or Zustand, no raw palette colors
- [ ] Every new export has a concise comment; comments say why, not what
- [ ] Existing public contracts are unchanged

## Verify

```bash
pnpm exec biome check <touched files>
pnpm --filter <package> test
pnpm --filter <package> type-check
pnpm --filter <package> dev    # exercise the feature in the browser
```

Then run [review-change](./review-change.skill.md).
