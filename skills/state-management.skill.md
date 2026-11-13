---
name: state-management
description: "Load when creating, editing, migrating, or reviewing a store or any shared application state: `*.store.ts` files, `StoreState` from `@semoss/utility/store`, `useStoreSelector`, and existing MobX or Zustand stores and their consumers."
---

# SEMOSS State Management

Shared application state lives in framework-free stores built on `StoreState` from
[`@semoss/utility/store`](../libs/utility/src/store.ts), and React reads them with
`useStoreSelector` from
[`@semoss/utility/react/use-store-selector`](../libs/utility/src/react/use-store-selector.ts).
MobX, Zustand, and hand-rolled listener sets are legacy. The migration is incremental: stores
move one at a time, and each package guide records where its package stands.

Read the [React standard](./react-standard.skill.md) first for React work. This skill owns the
store rules; the standard owns component, hook, and effect rules.

## Quick start

A store is three pieces: a snapshot type, a class that owns the state and its actions, and a
hook that reads it.

```ts
// counter.store.ts
import { StoreState } from "@semoss/utility/store";

/** What the store holds. Every field is readonly. */
export interface CounterSnapshot {
	readonly count: number;
	readonly status: "IDLE" | "SAVING" | "ERROR";
}

const INITIAL: CounterSnapshot = { count: 0, status: "IDLE" };

export class CounterStore {
	private readonly state = new StoreState<CounterSnapshot>(INITIAL);

	getSnapshot = (): CounterSnapshot => this.state.getSnapshot();
	subscribe = (listener: () => void): (() => void) => this.state.subscribe(listener);

	increment = (): void => {
		this.state.update((current) => ({ count: current.count + 1 }));
	};
}
```

```ts
// use-counter.ts
import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import type { CounterSnapshot, CounterStore } from "./counter.store";

export const useCounter = <T>(
	store: CounterStore,
	selector: (snapshot: CounterSnapshot) => T,
): T => useStoreSelector(store, selector);
```

```tsx
const count = useCounter(store, (state) => state.count);
```

| To | Write |
| --- | --- |
| Replace the whole state | `state.set(next)` |
| Change some fields | `state.update({ status: "SAVING" })` |
| Change state based on its current value | `state.update((current) => ({ count: current.count + 1 }))` |
| Add to a list | `state.update((current) => ({ items: [...current.items, item] }))` |
| Read one field in React | `useStoreSelector(store, (state) => state.count)` |
| Read several fields in React | `useStoreSelector(store, (state) => ({ a: state.a, b: state.b }))` |
| Read everything in React | `useStoreSelector(store)` |
| Read outside React | `store.getSnapshot()` |
| Listen outside React | `const stop = store.subscribe(listener)` |

## Direction

- **New shared state** goes in a `StoreState`-backed store. Do not add a MobX store, a Zustand
  store, a `makeAutoObservable` class, an `observer` component over new state, a hand-rolled
  listener `Set`, or another state library.
- **Local UI state** stays in `useState`/`useReducer`. A store is for state that outlives a
  component, is shared across unrelated components, or is read outside React.
- **Existing MobX and Zustand stores keep working.** Preserve their contracts while you work in
  them. Fix a bug in a legacy store in place; do not rewrite the store as a side effect of
  another task. Migrating a store is its own scoped change, agreed first.
- **Not everything named a store is in scope.** The SDK's `InsightStore`, `AgentStore`,
  `RoomStore`, and `Env` are a different kind of object and stay as they are; see the
  [SDK guide](../libs/sdk/AGENTS.md#session-config-and-permissions).
- **Check the dependency boundary first.** `@semoss/ui`, `@semoss/i18n`, and `@semoss/cli` may
  not depend on `@semoss/utility` ([root guide](../AGENTS.md#utility-ownership)), and none of
  them owns a store. `@semoss/workbench` may depend on it; see its
  [guide](../libs/workbench/AGENTS.md).

## Writing a store

- **Compose, do not extend.** The store owns one private `StoreState` and forwards
  `getSnapshot` and `subscribe`. It never exposes the `StoreState`, so only its own actions can
  write.
- **Type the snapshot first.** Export an interface with `readonly` fields and `readonly`
  arrays, pass it as the type argument (`new StoreState<Snapshot>(INITIAL)`), and annotate
  `getSnapshot` with it. The initial value is then checked against the contract.
- **Use arrow-function fields** for `getSnapshot`, `subscribe`, and every action, so they keep
  `this` and a stable identity when handed to React or destructured.
- **Name the file `<name>.store.ts`** and its hook `use-<name>.ts`, colocated with the feature.
- **One instance per owner.** Prefer a store made by a page, a room, or a mount and handed down
  through context over a module-level singleton, which every importer, every test in a file,
  and in Node every request shares.
- **Keep only plain data in the snapshot.** Class instances, DOM nodes, promises, timers, and
  `AbortController`s belong in private fields of the store.
- A store may declare `implements ReadableStore<Snapshot>` (from `@semoss/utility/store`) to
  have its two reading functions checked. Stores in `@semoss/sdk` do not: SDK declarations are
  not bundled, so its public types must not name a utility type.

The SDK stores are the reference implementation:
[`ConfigStore`](../libs/sdk/src/stores/config/config.store.ts),
[`SessionStore`](../libs/sdk/src/stores/session/session.store.ts), and
[`LoginsStore`](../libs/sdk/src/stores/logins/logins.store.ts).

## Changing state

`StoreState` holds one immutable snapshot and replaces it on every change. It cannot see a
change made in place.

- **Never mutate a snapshot** or anything reachable from it: no `snapshot.items.push(x)`, no
  `snapshot.user.name = y`, no `delete`, no sorting in place. The write succeeds, no listener is
  told, and React does not render. Build the next value instead.
- **Copy what you change, reuse what you do not.** Unchanged branches must keep their
  reference so selectors over them do not render.
- **Use the function form when the next value depends on the current one:**
  `set((current) => next)` or `update((current) => ({ field }))`.
- **`update` is for plain-object state.** It does not compile for an array, `Map`, `Set`,
  `Date`, or primitive, and throws a `TypeError` for a class instance. Replace that state with
  `set`.
- **`update` takes only the state's own fields with their own types,** so a field cannot be
  written as `undefined` unless its type allows it. That check needs `strictNullChecks`. Most
  packages here compile with `strict: false`, where `null` and `undefined` pass every type;
  there, guard nullable values yourself before writing them.
- **A write that changes nothing tells no one.** `set` with the current state, or `update`
  whose fields all already hold their values (compared with `Object.is`), keeps the snapshot. A
  new array or object with equal contents is still a change; reuse the existing reference when
  nothing in it changed.
- **State cannot be a function.** The constructor throws; wrap it in an object.
- **Listeners should not throw.** When one does, the others are still told, and then the write
  throws what it threw (an `AggregateError` for several). The state has already changed by
  then, so an action must not treat that throw as a failed write.

## Async actions

`StoreState` is synchronous, so two writes can never interleave. Races come from the time
between reading state and writing it.

- **Read at the moment of writing, never before an `await`.** Spreading a snapshot captured
  before an `await` into `set` discards every write made while waiting. The function form reads
  the state as it writes; `update({ field })` is also safe because it merges into the current
  snapshot.
- **Drop results that land late.** Keep a private version counter, bump it on every reset and
  every newer request, and ignore a result whose version is no longer current.
  [`SessionInsightStore`](../libs/sdk/src/stores/session/session-insight.store.ts) and
  [`SessionPermissionStore`](../libs/sdk/src/stores/session/session-permissions.store.ts) do
  this.
- **Join a request in flight** instead of starting a second: keep the promise in a private
  field, return it, and clear it in `finally`.
- **Put loading and failure in the snapshot** as an upper-case status
  (`IDLE | LOADING | READY | ERROR`) with the error. Never leave a store in `LOADING` when a
  request throws.
- **There is no batching.** Several writes are several notifications. Fold them into one write
  when a plain subscriber must not see the state between them. React already renders once for
  writes made in the same event.

## Reading from React

- **Always read through `useStoreSelector`.** It takes anything with `subscribe` and
  `getSnapshot`. Do not call `useSyncExternalStore` on a store yourself, and do not write
  another selection cache.
- **Select the least a component needs.** `useStoreSelector(store)` with no selector returns
  the whole snapshot and renders on every change.
- **A selector may build an object or an array.** The hook returns the last selection again
  when a new one holds the same entries, compared one level deep with entries by identity. A
  selector that builds nested objects (`{ user: { name } }`) or maps items to new objects
  renders on every change; select the existing references and derive from them during render.
- **A selector must tolerate a missing entity.** It runs on every change, before a parent has
  rendered again, so `state.items[id].name` can run after that item was removed. Return
  `undefined` rather than throwing.
- **Give each store a named hook** with a declared return type, as in the
  [quick start](#quick-start), so components do not find the store themselves.
- **Derive values during render** or in a pure function over the snapshot. There is no
  `computed`: keep derived data out of the snapshot unless it is expensive, and then compute it
  once in the action that changes its inputs.
- **A store update is always synchronous for React.** Updating a store inside `startTransition`
  does not make it a transition, and suspending on a store value shows the nearest `Suspense`
  fallback. Do not drive `use(promise)` or `lazy` from store state.
- React code in `@semoss/utility` lives only under `src/react/`, one hook per file, each with
  its own entry in the package's `exports`. Add a hook there only when it is generic to every
  store; a hook for one store stays with that store.
- Nothing in the repo renders on a server. If that changes, create the store per request.

## Reading outside React

- Call `store.getSnapshot()` for the current value and `store.subscribe(listener)` to hear
  about changes; call the function it returns to stop. A listener receives no arguments and
  reads the state itself, so it always sees the newest snapshot.
- To react to one field, remember the last value in the subscriber and compare. There is no
  `reaction` or `autorun`.
- Every `subscribe` call is its own subscription. A listener that stops during a change is not
  told about it; one that starts during a change hears the next one.
- A listener may write to the store; everyone is then told about the newest state, once. Make
  sure it stops writing once the state is where it wants it.
- Each JavaScript context has its own store instances. Browser tabs, Tauri windows, web
  workers, and a Chrome extension's service worker, content scripts, and panel do not share
  memory, and an extension service worker loses its memory when it is stopped. State that must
  cross a context or survive one is sent or persisted explicitly (`postMessage`,
  `chrome.storage`, a backend), with the store as the in-memory copy on each side.
- `StoreState` uses no browser API. Keep `window`, `document`, `localStorage`, and
  browser-only timers out of store constructors and module scope, or guard them, so the store
  loads in Node.

## Migrating a store

One store per change. Never mix libraries inside one store.

1. Write down the store's public contract: what it exposes, who reads it, and every place
   outside React that reads or writes it.
2. Build the `StoreState` store and its hook beside the old one, with tests, and move
   consumers in the same change or behind a thin adapter. Remove the adapter when its last
   consumer moves.
3. Delete the old store and, once a package has no other consumer, its library dependency.

### From Zustand

These are vanilla `createStore` stores read through `useStore(store, selector)`, so the mapping
is direct.

| Zustand | `StoreState` store |
| --- | --- |
| `store.getState()` | `store.getSnapshot()` |
| `setState(partial)` | `state.update(partial)` |
| `setState((s) => partial)` | `state.update((current) => partial)` |
| `setState(next, true)` | `state.set(next)` |
| `store.subscribe((state, previous) => …)` | `store.subscribe(() => …)`, reading `getSnapshot()` and keeping the previous value yourself |
| `useStore(store, selector)`, with or without `useShallow` | `useStoreSelector(store, selector)` |

`update` refuses state that is not a plain object, where Zustand replaces it. A store that
takes the dock's `StoreApi<WorkbenchState>` keeps that dependency until the dock itself moves.

### From MobX

This is a rewrite of the store, not a port.

- Every in-place write (`this._store.a.b = x`, `push`, `splice`, `delete`) becomes an immutable
  update. Search for all of them; one left behind changes nothing on screen and throws nothing.
- Class getters (`makeAutoObservable` turns them into computeds) become pure functions over the
  snapshot. `computed(() => ...).get()` in a component becomes a read through the store's hook.
- `observer` comes off a component only when everything it reads has moved. While a component
  reads both, keep `observer` and add the hook; the two coexist in one tree.
- Do not read a `StoreState` store inside a MobX getter, `computed`, or `reaction`. MobX cannot
  track it and the derived value goes stale. Read it in the component, or pass the value in.
- `runInAction` after an `await` becomes a plain write that follows the
  [async rules](#async-actions). `toJS` goes away: the snapshot is already plain data.
- `reaction` and `autorun` become a `subscribe` call owned by the store, stopped when the store
  is disposed.
- Stores that track many entities independently (the renderer's block state) need structural
  sharing designed before they move, because every reader's selector runs on every write.
  Profile before and after.

## Tests

Test stores without React, in `*.test.ts` beside the store.

- The snapshot keeps its identity when an action changes nothing and gets a new one when
  something does; the previous snapshot is unchanged afterwards.
- Unchanged branches keep their reference across an update to a sibling.
- Listeners are told once per change and not after unsubscribing.
- A late result is dropped after a reset or a newer request; a joined request runs once; a
  failed request ends in `ERROR`, not `LOADING`.
- Test the hook through a consumer: it renders on a change to what it selects and not on a
  change to anything else.

Check types and behavior before handoff with the owning package's `type-check` and `test`
scripts, then follow the React standard's
[review checklist](./react-standard.skill.md#full-file-review-and-handoff).
