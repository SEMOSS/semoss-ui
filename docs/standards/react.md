# React Standard

Builds on [general.md](./general.md). How React code is structured in SEMOSS: components, hooks,
effects, data access, performance, shared state, and forms. SEMOSS SDK, design, architecture, and
supported React versions take precedence over generic React guidance.

## Components

- One component per file (`@semoss/ui` may colocate related primitives). A file per component
  does not mean a component per JSX block; see [Fold Single-Use Pieces](#fold-single-use-pieces).
- Favor readable composition, slots, and discriminated unions over conflicting boolean variants.
  Share state or context when justified, not to remove every prop. There is no mandatory line
  limit or presenter/container split.
- Define component types outside parent render functions so parent rerenders do not reset child
  state or focus. Ordinary handlers and render callbacks are not nested component types.
- Components render and wire events. Business branching belongs in the feature's model or hooks
  (see [general.md: Architecture](./general.md#architecture)).

### Fold Single-Use Pieces

- Before creating a component, hook, helper, constant, type, or file, count its consumers. Fold
  a single-use piece into its consumer when it is short, stateless, and reads naturally in place:
  a wrapper that only forwards props, a one-line helper, a constant used once, a props type for
  an inline callback, or a file that re-exports a single name.
- Keep it separate when it owns state, hooks, effects, or refs; is a memo, Suspense, or error
  boundary or a lazy-loaded chunk; is tested on its own; is a public export; or when folding would
  leave the consumer deeply nested or hard to scan.
- When a piece only needs a name, use a descriptive local variable or an early-return branch in
  the parent instead of a new component. Folding never means defining a second component in the
  file.
- Prefer fewer, cohesive files over many tiny ones. Judge by readability, not line or file
  counts. Fold only within the task's scope; do not fold exports consumed by untouched code.

## Logic, State, and Effects

- Use single responsibilities, early returns, and the simplest adequate design.
- Props and state are immutable. Use a pure functional updater when the next value depends on
  previous state; direct replacements from arguments are fine. Never sort, reverse, or splice
  props or state in place.
- Use a pure lazy initializer for expensive initial state. Strict Mode and remounts can rerun it;
  do not freeze values that must track changing props.
- Shared application state follows [react.md: State](#state): a `StoreState` store read through
  `useStoreSelector`, selecting the least the component needs. Preserve existing MobX and Zustand
  store actions rather than rewriting them to imitate React state.
- Derive values during render; keep interaction-triggered work in event handlers. Effects
  synchronize external systems, not duplicate derived state.
- Never hide an effect dependency in a ref or suppress the dependency rule to quiet it. Effect
  callbacks are never async. Clean up subscriptions, timers, and
  resources; cancel async work or guard against stale results. Do not add empty cleanups or ban
  effects categorically.
- Use explicit boolean checks or ternaries where `0` or `NaN` could render. Boolean `&&` is fine.
- Run app-wide initialization from an owned entry point or guarded initializer, not an effect
  that may rerun on remount.

## Data Access

- Backend transport lives in the owning `api/` modules using `@semoss/sdk` primitives, never raw
  `fetch`. Prefer existing SDK hooks and `usePixel` for reads. See the
  [call-backend skill](../../skills/call-backend.skill.md).
- Parallelize truly independent work with existing helpers; preserve ordered Pixel/insight
  mutations, permissions, rate limits, cancellation, and error semantics.
- Request rules (cancellation, retries, double submits, optimistic updates) are in
  [general.md: Requests](./general.md#requests).
- Give each panel or widget its own loading and error state, so one failed request cannot blank a
  whole page or workbench. On failure, keep the last good data or show an error with Retry.
- Keep decisions out of event handlers: a handler calls a plain, tested function from the model
  and applies the result.

## Hooks

- Prefer focused custom hooks for reusable non-visual stateful logic over HOCs, render props, or
  container components added only to inject logic. Keep simple local UI state in components.
- Extract repeated stateful behavior, complex workflows, data orchestration, and state-machine
  coordination into hooks named for their purpose. One consumer can justify extraction when it
  makes a cohesive workflow easier to understand and test; apply the fold criteria first. Do not
  extract every state variable or build a catch-all hook to shorten a component.
- Search existing SDK, shared, and feature hooks before adding one. Compose focused hooks rather
  than duplicating subscriptions or requests. Colocate feature hooks with their feature.
- Pure calculations, transforms, and reducers are ordinary functions, not `use`-prefixed hooks.
- Give hooks typed inputs and an explicit return contract. Name them for behavior, not lifecycle
  timing. No `useMount`/`useEffectOnce` wrappers or custom effect wrappers that take
  caller-managed dependency arrays.
- Never pass hooks as props or select them dynamically.
- Hooks share logic, not state: each call owns its state and effects. Extraction alone does not
  deduplicate requests, isolate rerenders, or improve performance.
- A hook's render-time code is part of its consumer's render: keep it pure and take reactive
  inputs explicitly. The effect, cleanup, stale-result, and data-access rules apply inside hooks.

## Performance

Profile before memoizing. No blanket `useMemo`/`memo`/`useCallback`, micro-optimization,
unbounded module cache, universal preload, or routine DOM mutation. Verify installed versions
before newer APIs; do not assume React Compiler, Activity, or `useEffectEvent`. Dependency or
React peer changes need explicit scope and compatibility review. INP < 200 ms and CLS < 0.1 are
measured targets, not lint guarantees.

Apply in priority order, then verify with profiling or a focused behavior check:

1. **Waterfalls (critical).** Check cheap sync conditions before awaiting; defer awaits into the
   branches that need them; start independent operations together; start work early in route or
   workflow handlers with focused Suspense boundaries where supported.
2. **Bundle size (critical).** Follow the public-entry import rules. Load optional editors,
   viewers, and charts with `React.lazy`/`Suspense` or Vite `import()` (adapt named exports in the
   lazy promise; keep accessible loading and error states and stable geometry). Defer
   non-critical analytics. Preload only on clear intent. Never use `next/dynamic`.
3. **Client data fetching (medium-high).** Reuse shared subscription and SDK query abstractions
   to deduplicate listeners and requests. Mark touch/wheel listeners passive only when they never
   call `preventDefault`. Do not add SWR or an event bus for this.
4. **Re-renders (medium).** Derive in render; read dynamic state at point of use; hoist stable
   defaults; narrow effect dependencies to values used; split independent computations; keep
   controlled input updates urgent and use transitions or deferred values only for measured
   expensive work (they neither debounce requests nor move work off-thread); use refs for
   transient values that must not render.
5. **Rendering (medium).** Animate a wrapper around SVG when it helps compositing; use
   `content-visibility` for long off-screen lists; hoist large static JSX; reserve media and
   loading dimensions.
6. **JavaScript (low-medium).** Batch DOM reads and writes; build `Map`/`Set` indexes for repeated
   lookups; cache only with bounded ownership and invalidation; find min/max with a loop; use
   `toSorted` or a copy for props and state.
7. **Advanced (low).** Use stable handler refs when a subscription must not be recreated per
   callback change.

### Owned Persistence

Version and minimize stored data, validate parsed values, handle corrupt or unavailable storage,
and never store secrets or sensitive records. Optional preferences may fall back; required writes
must surface failures. Preserve existing storage contracts.

## State

Shared application state: `StoreState` stores, immutable updates, async actions, and reading
stores from React and plain code. The procedure is [add-store](../../skills/add-store.skill.md);
where each package stands is in [packages.md](../architecture/packages.md#state-migration).

### Store Shape

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

What `StoreState` and `useStoreSelector` do is documented on them and pinned by
[store.test.ts](../../libs/utility/src/store.test.ts); the rules below are how to use them.

### Direction

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
  [SDK guide](../../libs/sdk/AGENTS.md).
- **Where a store can live** is decided by the package's boundaries; see
  [packages.md: State Migration](../architecture/packages.md#state-migration).

### Writing a Store

- **Compose, do not extend.** The store owns one private `StoreState` and forwards
  `getSnapshot` and `subscribe`. It never exposes the `StoreState`, so only its own actions can
  write.
- **Type the snapshot first.** Export an interface with `readonly` fields and `readonly`
  arrays, pass it as the type argument (`new StoreState<Snapshot>(INITIAL)`), and annotate
  `getSnapshot` with it. The initial value is then checked against the contract.
- **Use arrow-function fields** for `getSnapshot`, `subscribe`, and every action, so they keep
  `this` and a stable identity when handed to React or destructured.
- **Name the file `<name>.store.ts`** and its hook `use-<name>.ts`, colocated with the feature
  (see [general.md: Naming](./general.md#naming)).
- **One instance per owner.** Prefer a store made by a page, a room, or a mount and handed down
  through context over a module-level singleton, which every importer, every test in a file,
  and in Node every request shares.
- **Keep only plain data in the snapshot.** Class instances, DOM nodes, promises, timers, and
  `AbortController`s belong in private fields of the store.
- A store may declare `implements ReadableStore<Snapshot>` to have its two reading functions
  checked, except in `@semoss/sdk` ([why](../../libs/sdk/AGENTS.md#boundaries)).

The SDK stores are the reference implementation:
[`ConfigStore`](../../libs/sdk/src/stores/config/config.store.ts),
[`SessionStore`](../../libs/sdk/src/stores/session/session.store.ts), and
[`LoginsStore`](../../libs/sdk/src/stores/logins/logins.store.ts).

### Changing State

`StoreState` holds one immutable snapshot and replaces it on every change. It cannot see a
change made in place.

- **Never mutate a snapshot** or anything reachable from it: no `snapshot.items.push(x)`, no
  `snapshot.user.name = y`, no `delete`, no sorting in place. The write succeeds, no listener is
  told, and React does not render. Build the next value instead.
- **Copy what you change, reuse what you do not.** Unchanged branches must keep their
  reference so selectors over them do not render.
- **Use the function form when the next value depends on the current one:**
  `set((current) => next)` or `update((current) => ({ field }))`.
- **`update` is for plain-object state;** replace any other state with `set`.
- **Guard nullable values before writing** in packages compiled with `strict: false`, where
  `null` and `undefined` pass every type.
- **A new array or object with equal contents is still a change;** reuse the existing reference
  when nothing in it changed.
- **Listeners should not throw.** A listener's throw surfaces from the write after the state has
  changed, so an action must not treat it as a failed write.

### Async Actions

`StoreState` is synchronous, so two writes can never interleave. Races come from the time
between reading state and writing it.

- **Read at the moment of writing, never before an `await`.** Spreading a snapshot captured
  before an `await` into `set` discards every write made while waiting. The function form reads
  the state as it writes; `update({ field })` is also safe because it merges into the current
  snapshot.
- **Drop results that land late.** Keep a private version counter, bump it on every reset and
  every newer request, and ignore a result whose version is no longer current.
  [`SessionInsightStore`](../../libs/sdk/src/stores/session/session-insight.store.ts) and
  [`SessionPermissionStore`](../../libs/sdk/src/stores/session/session-permissions.store.ts) do
  this.
- **Join a request in flight** instead of starting a second: keep the promise in a private
  field, return it, and clear it in `finally`.
- **Put loading and failure in the snapshot** as an upper-case status
  (`IDLE | LOADING | READY | ERROR`) with the error. Never leave a store in `LOADING` when a
  request throws.
- **There is no batching.** Several writes are several notifications. Fold them into one write
  when a plain subscriber must not see the state between them. React already renders once for
  writes made in the same event.

### Reading From React

- **Always read through `useStoreSelector`.** It takes anything with `subscribe` and
  `getSnapshot`. Do not call `useSyncExternalStore` on a store yourself, and do not write
  another selection cache.
- **Select the least a component needs.** `useStoreSelector(store)` with no selector returns
  the whole snapshot and renders on every change.
- **A selector may build a flat object or array** of existing references. One that builds nested
  objects or maps items to new objects renders on every change; select the existing references
  and derive from them during render.
- **A selector must tolerate a missing entity.** It runs on every change, before a parent has
  rendered again, so `state.items[id].name` can run after that item was removed. Return
  `undefined` rather than throwing.
- **Give each store a named hook** with a declared return type, as in
  [Store Shape](#store-shape), so components do not find the store themselves.
- **Derive values during render** or in a pure function over the snapshot. There is no
  `computed`: keep derived data out of the snapshot unless it is expensive, and then compute it
  once in the action that changes its inputs.
- **A store update is always synchronous for React.** Updating a store inside `startTransition`
  does not make it a transition, and suspending on a store value shows the nearest `Suspense`
  fallback. Do not drive `use(promise)` or `lazy` from store state.
- A hook for one store stays with that store; only a hook generic to every store goes in
  `@semoss/utility` ([rules](../../libs/utility/AGENTS.md#boundaries)).
- Nothing in the repo renders on a server. If that changes, create the store per request.

### Reading Outside React

- Read with `store.getSnapshot()` and listen with `store.subscribe(listener)`. To react to one
  field, remember the last value in the subscriber and compare; there is no `reaction` or
  `autorun`.
- A listener that writes to the store must stop once the state is where it wants it.
- Each JavaScript context has its own store instances. Browser tabs, Tauri windows, web
  workers, and a Chrome extension's service worker, content scripts, and panel do not share
  memory, and an extension service worker loses its memory when it is stopped. State that must
  cross a context or survive one is sent or persisted explicitly (`postMessage`,
  `chrome.storage`, a backend), with the store as the in-memory copy on each side.
- `StoreState` uses no browser API. Keep `window`, `document`, `localStorage`, and
  browser-only timers out of store constructors and module scope, or guard them, so the store
  loads in Node.

### Migration Mappings

One store per change. Never mix libraries inside one store.

#### From Zustand

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

#### From MobX

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

## Forms

The canonical form pattern: schema, field wrappers, submission, errors, edit resets, and dialog
forms, using the public `@semoss/ui/next` APIs. The procedure is
[build-form](../../skills/build-form.skill.md).

### Contracts

- **Public imports only.** Import `useForm`, `zodResolver`, `z`, and UI and form components from
  `@semoss/ui/next`, never directly from RHF, Zod, resolver packages, bare `@semoss/ui`, or
  internal paths. The [shared implementation](../../libs/ui/src/next/form.tsx) is the component
  API authority.
- **Schema first, types derived.** Define a Zod schema. For equal input and output shapes use
  `useForm<FormValues>` with `FormValues = z.infer<typeof schema>`. For coercions or
  transforms, distinguish `z.input` from `z.output` and use the installed resolver's compatible
  `useForm<InputValues, unknown, OutputValues>` contract. Do not cast away resolver errors. If
  the public Zod export and resolver resolve incompatible schema versions, that is a
  dependency or typecheck blocker: report it, do not bypass the public imports, and do not
  claim the example compiles until an authorized dependency change resolves it.
- **RHF owns field state.** Provide complete, non-undefined initial values. Do not add parallel
  `useState` per field or for submission state. Choose the
  [record initialization policy](#fetching-data-and-edit-resets) before wiring edit data.
- **One `Form`.** Render `<Form form={form} onSubmit={handleSubmit}>`. It supplies RHF context,
  renders the native form, and calls `form.handleSubmit` internally. Pass the validated-values
  handler directly; do not nest another form, wrap the handler again, or manually prevent
  submit. `Form.onError` handles invalid submissions, not rejected writes.
- **Wrappers by field type.** Use the matching `Form*` wrapper with schema field names. Use
  `FormField` only for a control without a dedicated wrapper. Do not duplicate labels or errors
  around a wrapper; see the [accessibility limits](#field-composition-and-accessibility).
- **Completion callback.** New completion-style forms use `onSubmit(id?: string): void`: pass
  the saved ID after success and no argument on cancel or close. The validated handler is named
  `handleSubmit`. Preserve a different existing public contract, and existing callbacks and
  record identity, unless their migration is in scope.
- **Pending state.** Await the write so RHF tracks `formState.isSubmitting`. Disable mutating
  controls and repeat submission while pending. Standalone forms use `FormActions`; dialogs use
  the [modal composition](#modal-and-dialog-forms).

### Canonical Pattern

Reference implementations: `packages/client/src/features/team-form/team-form-dialog.tsx` (dialog
form: schema, `setError("root.server")`, submit guard, `Alert`) and
`packages/client/src/components/import/guardrail/sql-query-guardrail-form.tsx` (standalone form
with `FormActions`). Read one before writing a form; copy its shape, not its fields.

### Submission and Error State

- Catch write failures and call `form.setError` for a known field or `root.server`; retain
  entered values and keep the form open. RHF derives `isSubmitSuccessful` from both a resolved
  handler and an empty error state, so catching and only logging or toasting an error can mark
  a failed write as successful. A root error preserves failure state and is cleared on the next
  submission attempt.
- Keep completion handling outside the write's catch block so a navigation or callback error is
  not mislabeled as a failed write. Do not close or reset from `isSubmitted`, which includes
  failures, or use `isSubmitSuccessful` as the sole proof of backend success.
- Show persistent failures inline. `Alert` and `FieldError` already have `role="alert"`; do not
  announce the same failure again through a toast or live region. Use `toast.success` with the
  host's existing `Toaster` for transient success feedback.
- `FormActions` owns its buttons' pending state, not fields, mutation cancellation, dialog
  dismissal, or every accessibility association. Verify actual pending announcements before
  adding more.
- Decide how empty, invalid, zero, and optional numbers map to the schema and API. Do not
  silently coerce an empty optional input to zero.
- Zod can reject an oversized collection at a leading upper-size check before parsing its items
  or running later refinements. Show container-level limit errors rather than relying on every
  item error being returned. Test the exact limit and one item over it, including an oversized
  collection with invalid items.

### Fetching Data and Edit Resets

Use `usePixel` from `@semoss/sdk/react` for backend reads (options, records, lookups), not a new
effect with raw fetch. Keep writes imperative through the owning API helper using SDK
primitives. Respect package boundaries and reuse already-owned data rather than fetching it
again. Distinguish deferred, loading, missing record, empty options, and failure; do
not present failed or missing data as a blank editable record. Validate and map backend data to
the form shape; a TypeScript generic is not runtime validation.

Choose a deliberate initialization policy:

- **Create:** provide `defaultValues` such as `""`, `false`, or an appropriate empty array for
  each field. These are cached initial values, not reactive props. Changing the `defaultValues`
  object does not load a later record.
- **Edit:** either mount the form after the validated record is ready, or use the reactive
  `values` option or an explicit `reset(mappedValues)` synchronization policy. Keep hooks
  unconditional; a loading parent may mount a separate form component. Do not pass raw,
  nullable `record.data` straight to `values`.
- **Same-record refresh:** `values` updates reset form state by default and can overwrite edits.
  When the workflow retains edits, use the supported `resetOptions` or `reset` options such as
  `keepDirtyValues`, subscribe to `dirtyFields` as RHF requires, and test how untouched fields
  and defaults update. Do not use fresh object identity as a reason to reset on every render.
  Include real dependencies in any synchronization effect.
- **Record switch or reopen:** decide whether to discard, confirm, or preserve a draft. A key
  based on record identity can intentionally remount a form; never key it by a changing field
  value. Do not carry `keepDirtyValues` from one record into a different record.
- **Success or cancel:** reset only at the deliberate completion boundary. If the form stays
  mounted after saving, `reset(savedValues)` establishes the persisted baseline. Never reset in
  `finally` or after a recoverable failure. Define whether closing and reopening resumes or
  clears a draft, and make sure stale reads cannot initialize the wrong record.

### Modal and Dialog Forms

Use `Dialog`/`DialogContent`, `DialogHeader`/`DialogTitle`, and an appropriate description. Keep
`DialogFooter` and its submit button inside `Form`. Use `type="button"` for cancel. Keep the
canonical error display and field state; import components from `@semoss/ui/next`.

Choose an explicit pending-dismissal policy. For a non-cancellable write, block dismissal only
while submitting and keep close and cancel available otherwise. If the workflow
permits dismissal during a write, use the existing cancellation or stale-result policy instead;
closing a dialog does not abort a request. Focus must return correctly, including for
programmatically opened dialogs without a `DialogTrigger`.
`team-form-dialog.tsx` shows the `onOpenChange` guard.

### Field Composition and Accessibility

Each wrapper's value type is on its definition in [form.tsx](../../libs/ui/src/next/form.tsx).
Use `FieldGroup` for layout and `FieldSet`/`FieldLegend` for semantic groups. For a bespoke
control without a wrapper, use `FormField control={form.control}` and its typed
`field`/`fieldState`. Forward value, change, blur, name and ref to the actual control using its
supported API, including focus support. Generate IDs with `useId` at the top level of the owning
component or custom hook, never inside `FormField.render`. Compose `Field`, `FieldLabel`,
`FieldDescription`, and `FieldError`, linking label, description, and error IDs to the
focusable control and setting invalid and required state as appropriate.

The existing wrappers compose field markup but are not an accessibility certification:

- Wrapper descriptions and generated `FieldError` messages are not automatically connected via
  `aria-describedby`; most wrappers lack error-ID or trigger-prop APIs. An alert announces an
  error but does not associate it for later field focus. The reference forms share
  this limitation. Do not claim full accessibility from compilation alone.
- Wrapper `name` is currently a string, not a schema-checked path; check it against the schema.
  Not all wrappers forward RHF's ref and blur to the focusable element, so composite control
  labels and invalid-focus behavior need checking too. Fix a shared primitive only within
  authorized scope, or report the blocker; never fork wrappers or weaken the requirements.
- A missing wrapper association is a failed accessibility check, not a pass. Do not bypass an
  existing wrapper solely to hide its limitation.

### Testing Notes

- RHF schedules `setFocus` asynchronously. In interaction tests, await the intended control
  receiving focus rather than asserting synchronously after a field-array edit, and keep the
  focus-target assertions.
- Fragments in this document are not runnable modules; documentation tests are not browser
  coverage.
