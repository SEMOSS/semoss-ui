# AGENTS.md - @semoss/utility

Inherits the [root guide](../../AGENTS.md) and
[React/TypeScript standard](../../skills/react-standard.skill.md).

## Purpose

`@semoss/utility` provides small, reusable, framework-independent helpers shared
across SEMOSS libraries and applications. UI behavior and domain-specific logic
belong in their owning packages.

## Organization

Helpers live in flat files under `src/`, grouped by function. Import from the
matching category, such as `@semoss/utility/text` or `@semoss/utility/date`.
Reuse existing helpers before adding new ones, and keep abstractions simple.

This package is source-only; consuming applications compile it. `@semoss/sdk` bundles
the categories it imports into its published build, so every helper must stay
runtime-independent and free of framework imports. The root also
exports the public helpers. See the [README](./README.md) for import examples.

**React code is the one exception, and it stays in `src/react/`.** Files there may import
`react`, an optional peer dependency. Nothing outside `src/react/` may import `react` or
anything in `src/react/`, and the root does not export it, so every category stays usable
without React and in Node. Follow the
[React standard](../../skills/react-standard.skill.md): one hook per file, named
`use-<name>.ts` and exporting `useName`, with no `index.ts`. Each file gets its own entry in
`package.json` `exports`, like a category, and consumers import that path, such as
`@semoss/utility/react/use-store-selector`. Add a hook here only when it is generic and has no SEMOSS,
SDK, or UI knowledge. `@semoss/sdk` imports these too; its build bundles them into its React
entry and keeps `react` external.

| React file | Purpose |
| --- | --- |
| `react/use-store-selector` | `useStoreSelector(store, selector?)`: read any store with `subscribe` and `getSnapshot`, or the part a selector picks, rendering only when what it reads changes |

## Available utilities

| Category | Purpose |
| --- | --- |
| `text` | Text transforms, initials, hashing, counting, and HTML character references |
| `identifier` | Identifier labels, slugs, validation, and unique names |
| `date` | Date/time formatting, durations, local dates, and date buckets |
| `array` | Array comparison |
| `object` | Object checks (records and plain objects), copying, and shallow equality |
| `store` | `StoreState`, the immutable-snapshot state holder for framework-free stores and the basis for shared application state, and the `ReadableStore` contract |
| `json` | JSON parsing and formatting, key-sorted serialization, tabular detection, and error locations |
| `file` | File extensions and filename sanitization |
| `encoding` | Base64 encoding and decoding |
| `browser` | Favicons, file downloads, and scrolling a view's ancestors to the top |
| `clipboard` | Copying text to the clipboard |
| `csv` | CSV cell escaping |
| `async` | Timing helpers |
| `error` | Error-message extraction |
| `image` | Image MIME types and inline-image parsing |
| `markdown` | Markdown/HTML detection and text normalization |

## StoreState

`StoreState` in [`src/store.ts`](./src/store.ts) is the state holder that shared
application state across the repo is moving to, replacing MobX and Zustand. It is the store
shape from React's `useSyncExternalStore` documentation, made reusable: one immutable snapshot,
`getSnapshot`, `subscribe`, and two writers, `set` and `update`. The
[state management skill](../../skills/state-management.skill.md) owns how stores are built on
it; load it before using or changing this class.

What the class guarantees, each covered in [`store.test.ts`](./src/store.test.ts):

- `getSnapshot` returns the same reference until a write changes the state, and types it
  `Readonly`.
- `set` and `update` take the next value or a function of the current state. A write that
  changes nothing (the same reference for `set`, the same field values for `update`) tells no
  one and keeps the snapshot.
- `update` only merges into a plain object. It does not compile for arrays, maps, sets, dates,
  or primitives, throws a `TypeError` for a class instance, and accepts only the state's own
  fields with their own types.
- State cannot be a function; the constructor throws a `TypeError` for one.
- Writes are synchronous: the snapshot is replaced, then every listener subscribed at that
  moment is called once, with no arguments. One that unsubscribed meanwhile is skipped, and one
  that subscribed meanwhile hears the next change.
- Each `subscribe` call is its own subscription, even for the same function.
- A write made from inside a listener tells everyone about the newest state once.
- A listener that throws does not keep the others from being told. The write then throws what
  it threw, or an `AggregateError` for several, after the state has changed.
- It imports only `isPlainObject` from the `object` category, and touches no browser or Node
  API.

What it does not do, which callers must cover themselves:

- It does not detect in-place mutation of a snapshot. Snapshots are not frozen, and `Readonly`
  is shallow: declare nested fields and arrays `readonly` in the snapshot's own type.
- Its type checks on `undefined` and `null` need `strictNullChecks`, which this package and most
  consumers compile without.
- It has no selectors, equality checks beyond `Object.is`, derived values, or batching.
- The class itself knows nothing about React. Read it from components with
  [`useStoreSelector`](./src/react/use-store-selector.ts).

`ReadableStore<S>`, in the same file, is the pair of functions a store exposes for reading,
`getSnapshot` and `subscribe`. `useStoreSelector` accepts anything that has them.

Treat any change to this class as a change to every store built on it. Add a test for each
behavior you rely on or alter, keep it free of external dependencies, and run this package's
`type-check` script: several tests assert what must not compile.
