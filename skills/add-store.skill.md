---
name: add-store
description: "Use when adding shared application state, writing a `*.store.ts` on `StoreState`, or migrating a MobX or Zustand store to `StoreState` and `useStoreSelector`."
---
# Add Store

## When to Use

- State must outlive a component, be shared by unrelated components, or be read outside React.
- You are writing or changing a `*.store.ts` built on `StoreState`.
- You are migrating one MobX or Zustand store (agreed as its own scoped change).

Local UI state stays in `useState`/`useReducer`; you do not need this skill for it. Fix a bug
in a legacy store in place, without this skill.

## Read First

- [docs/standards/react.md#state](../docs/standards/react.md#state): store shape, update rules, async
  rules, React reads, migration mappings.
- [docs/architecture/packages.md#state-migration](../docs/architecture/packages.md#state-migration): where the
  owning package stands.
- [general.md: Naming](../docs/standards/general.md#naming)
- The owning package's `AGENTS.md` (its Boundaries section says whether it may own a store),
  and [libs/utility/AGENTS.md](../libs/utility/AGENTS.md).

## Steps

### New store

1. Confirm the package may depend on `@semoss/utility`, and that the state is shared, not local.
2. Write the snapshot interface with `readonly` fields and an `INITIAL` constant.
3. Write `<name>.store.ts`: a class with one private `StoreState<Snapshot>`, arrow-function
   `getSnapshot`, `subscribe` and actions. Keep non-plain data in private fields.
4. Write async actions with the function form or `update`, a version counter for late results,
   a joined in-flight promise, and an upper-case status that never sticks at `LOADING`.
5. Write `use-<name>.ts`: a named hook over `useStoreSelector` with a declared return type.
6. Create one instance per owner (page, room or mount) and pass it through context.
7. Write `<name>.store.test.ts` beside the store, plus a hook test through a consumer.

### Migrating a store

1. Write down the store's public contract: what it exposes, who reads it, and every place
   outside React that reads or writes it.
2. Build the `StoreState` store and its hook beside the old one, with tests, using the Zustand
   or MobX mapping in the standard.
3. Move consumers in the same change, or behind a thin adapter. Remove the adapter when its
   last consumer moves.
4. For MobX, search for every in-place write and every getter; keep `observer` until a
   component reads nothing from MobX.
5. Delete the old store and, once the package has no other consumer, its library dependency.
6. Report other stores that should migrate; do not migrate them in this change.

## Checklist

- [ ] No new MobX, Zustand, `observer`, hand-rolled listener set, or other state library.
- [ ] `StoreState` is private; only the store's actions write.
- [ ] No snapshot is mutated in place; unchanged branches keep their reference.
- [ ] No snapshot captured before an `await` is spread into a write.
- [ ] Nullable values guarded before writing in `strict: false` packages.
- [ ] No `window`, `document`, `localStorage` or timers in the constructor or module scope.
- [ ] React reads only through `useStoreSelector`; selectors pick existing references and
      tolerate a missing entity.
- [ ] SDK stores do not name utility types in public types.
- [ ] One library per store; any adapter has a removal path.
- [ ] Tests: snapshot identity kept when nothing changes and new when something does; the
      previous snapshot unchanged afterwards.
- [ ] Tests: unchanged branches keep their reference across a sibling update.
- [ ] Tests: listeners told once per change and not after unsubscribing.
- [ ] Tests: a late result is dropped after a reset or newer request; a joined request runs
      once; a failed request ends in `ERROR`, not `LOADING`.
- [ ] Tests: the hook renders on a change to what it selects and not on other changes.

## Verify

```bash
pnpm check
pnpm --filter <package> type-check   # or check-types: use the name in its package.json
pnpm --filter <package> test
```

Profile before and after when migrating a store that tracks many entities.
