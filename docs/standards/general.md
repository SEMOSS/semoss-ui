# General Standard

The base rules for all code in the repo: TypeScript, React, stores, the SDK, CSS, and scripts.
[typescript.md](./typescript.md), [react.md](./react.md), [ui.md](./ui.md), and
[testing.md](./testing.md) build on it.

## Principles

- **Smallest change first.** Before editing, state the goal and the smallest change that meets
  it. Prefer deleting code to adding it.
- **Subtract before you add.** Remove the dead path, duplicate, or unused export first. `pnpm clean`
  (Knip) finds candidates.
- **Data shape first.** Name the types and the model before writing hooks or components.
- **Model the domain.** Name things for the domain (batch, grant, room, engine), not for the widget
  or the transport.
- **Make illegal states unrepresentable** with discriminated unions, not boolean pairs.
- **Migrate callers, then delete.** No compatibility shims or half-migrated states inside one
  change. When the migration is out of scope, report it.
- **Split shared state by owner** before persisting or syncing it.
- **Make operations idempotent.** Retries, remounts, and Strict Mode double calls must be safe.
- **Fix root causes.** No `setTimeout`, extra guard, or lint suppression to hide a symptom.
- **Prove it works.** Check the real thing (running app, test, built bundle), not "it type-checks".
- **Land verifiable steps.** Order work so each step can be checked on its own.
- **Explain the number.** Performance claims come with a measurement.
- **Encode lessons in structure.** When a rule keeps getting broken, turn it into a type, guard,
  Biome/Knip rule, or test, then shorten the prose.

## Comments

Code is the main source of knowledge for people and agents, so comments carry what the code
cannot say.

- **Every export gets a concise comment** (TSDoc in TS/TSX): functions, components, hooks,
  constants, types, and stores. One or two lines on what it is for, plus any non-obvious "why" an
  agent needs: a backend contract, an ordering rule, a gotcha. Component props are documented on
  their type.
- **Explain why, not what.** Never restate the code or narrate trivial steps.
- **Do not comment barrels** (`index.ts` re-exports).
- **Internal functions and methods** need a comment only when their purpose or constraint is not
  obvious.
- **Put a fact on the symbol that owns it.** A feature `AGENTS.md` exists only for what no symbol
  can carry: a contract across files or packages, or a backend or vendor fact.
- Keep comments short and current. A wrong comment is a bug: fix it with the code.
- **Comments are written when a file is touched.** Guides no longer carry single-symbol facts, so
  when you change a symbol that has no comment, or a stale one, write it in the same change.
- If an abstraction needs a long comment to explain, simplify the abstraction instead.

## Architecture

Dependencies point inward, toward stable policy. Inner code never imports outer code.

- **Between packages**, the graph in [packages.md](../architecture/packages.md) is the boundary:
  `@semoss/ui ← @semoss/workbench ← @semoss/panels → @semoss/shared → @semoss/sdk`.
  Each package's `AGENTS.md` lists what it must not import under Boundaries. Inner packages own
  interfaces; hosts wire them up (see
  [panels](../../libs/panels/AGENTS.md#what-a-host-has-to-wire-up)).
- **Inside a feature**, from inside out:

  | Layer | Is | Imports | Never |
  |---|---|---|---|
  | Model | Types, rules, invariants, pure transforms | Other model files, `@semoss/utility` | React, SDK, browser APIs |
  | Hooks | Use cases: orchestration, state, workflows | Model, `api/`, stores, SDK React hooks | JSX |
  | `api/` | Gateways: SDK transport, validation, mapping to the model | `@semoss/sdk`, model | React, components |
  | Components | Humble presenters: render and wire events | Hooks, model types, `@semoss/ui/next` | SDK calls, business branching |
  | Pages | Thin route shells composing features | Features | Feature logic |

  `features/bulk-access-management/permission-batch.ts` (pure model) with
  `use-permission-batch.ts` (state) is the reference split.
- **Organize by feature first.** New app features go in `src/features/<feature>/`; routes stay in
  `pages/`. Existing features stay put unless a migration is scoped. `@semoss/ui`, `@semoss/sdk`,
  and non-React libraries keep their layouts.
- **No new `common/`, `utils/`, `helpers/`, or `*Service` catch-alls.** Generic, domain-free helpers
  go in `libs/utility` ([guide](../../libs/utility/AGENTS.md)); everything else stays with its
  feature. Search before adding a helper; equivalent code may use other names. Prefer native
  operations over wrappers.
- **Do not deduplicate across features** when it couples different reasons to change.
- **Use the lightest boundary that works.** Add an interface only where a second implementation or
  test seam exists.

| When you see | Do |
|---|---|
| SDK or response types in component props | Map them to the model in `api/` |
| Business branching or validation in JSX | Move it to the model or a hook |
| A component calling the SDK or `fetch` | Move the call to `api/` and expose it through a hook |
| A file growing into a catch-all | Split it by capability |
| Tests that need a backend to check a rule | Move the rule into the model and test it there |
| A shortcut you cannot avoid | Keep it at the outermost layer, comment why, report it |

## Design

- **Make modules deep.** Pull complexity down behind a simple contract. Pixel order, transport,
  and payload shape stay inside the SDK or `api/` module; callers never learn the protocol.
- **No pass-through layers.** A wrapper, hook, component, or `api/` function that only forwards
  a call is removed or given a real job.
- **Let the owner decide.** Drop an option or flag the module can decide itself. Never pass a
  boolean that switches behavior; write two named functions or take a discriminated option.
- **Abstract on the third repetition**, not the first. Until then, a little duplication is cheaper
  than the wrong abstraction.
- **Queries never mutate.** A function either answers or changes state, not both.
- **One term per concept** across code, tests, and UI copy (not load/fetch/get for one operation).
  Rename identifiers when the domain term changes.
- **Name complex conditions** with a predicate, and keep the happy path unindented.
- **Wire at the composition root.** SDK clients and stores are created at the app entry or a
  provider, never inside hooks, components, or model code.
- **Inject hidden inputs.** Model code takes time, ids, randomness, and storage as parameters
  instead of calling `Date.now`, `crypto.randomUUID`, or `localStorage` directly.
- **Contain vendors.** A third-party API used by more than one feature sits behind a narrow local
  adapter; a library gap gets one small helper, not scattered workarounds.
- **Compare designs** for any non-trivial choice: sketch at least two before committing.

## Naming

- Values and functions use camelCase; components and types use PascalCase. Callback props are
  `onX`, internal handlers `handleX`, owned booleans `is`/`has`/`should`. Keep native, library,
  and backend names (`disabled`, `open`, API fields) as they are.
- Files are kebab-case. Inside a feature folder, name each file `<feature>-<what-it-does>` plus
  its role suffix, so its layer shows in the name:

  | Role | Pattern | Example (prefix `bulk-access`) |
  |---|---|---|
  | Page (in `pages/`) | `<feature>.page.tsx` | `bulk-access.page.tsx` |
  | Component | `<feature>-<what>.tsx` | `bulk-access-review-dialog.tsx` |
  | Hook | `use-<feature>-<what>.ts` → `useFeatureWhat` | `use-bulk-access-batch.ts` |
  | Model | `<feature>-<what>.ts` | `bulk-access-batch.ts` |
  | Store | `<feature>-<what>.store.ts` | `bulk-access-draft.store.ts` |
  | Context | `<feature>-<what>.context.tsx` | `bulk-access-selection.context.tsx` |
  | API module | `<feature>-<what>.api.ts`, or the app's `api/<domain>.ts` | `bulk-access-permissions.api.ts` |
  | Shared types | `<feature>-<what>.types.ts` | `bulk-access-change.types.ts` |
  | Test | the file's name + `.test.ts(x)` | `bulk-access-batch.test.ts` |

- `<feature>` is the folder name or one stable shorter prefix. `use-` comes first so hooks sort
  together. Outside features keep the existing suffixes (`.routes.tsx`, `.layout.tsx`, `.page.tsx`,
  `.context.tsx`, `.store.ts`, `.types.ts`).
- Apply this to new and renamed files. Do not mass-rename. `@semoss/ui`, `@semoss/sdk`, and
  `@semoss/utility` keep their own naming.

## Exports and Imports

- Keep curated package and public subpath entry points. Cross-package code imports from public
  paths (`@semoss/ui/next`, `@semoss/sdk/react`), never another package's `src/`.
- Within a package, import from the defining file, not internal barrels or the package's own
  public barrel. Do not create an `index.ts` in every folder.
- Preserve compatibility export chains used by untouched code; prefer direct re-exports when
  editing public exports. No unsupported third-party deep imports.
- Use classes only for real stateful objects (stores, SDK clients, editors, custom errors), never
  as DTOs.

## Boundaries and Errors

- Validate data at trust boundaries (backend responses, storage, URL params, `postMessage`) and
  trust the types inside. Scattered defensive checks hide bugs.
- Return parsed data; surface failures and missing required data explicitly. Never report success
  for a failed required operation.
- Never persist secrets or sensitive records in browser storage.

## Requests

- **One coarse SDK call per user action**, with batched inputs, never a call per item in a loop.
- **Every request can be cancelled.** Pass an `AbortSignal`, abort on unmount or input change, and
  discard responses that are no longer current, so stale data never overwrites newer state.
- **Retry only idempotent reads**, a bounded number of times with backoff, never on validation
  errors. Never auto-retry a mutating pixel.
- **Guard double submits:** ignore or disable a mutation while the same one is in flight.
- **Optimistic updates keep the confirmed state** beside the pending one and roll back on failure.
  Surface a conflict from a stale edit instead of silently overwriting.
- **Page or stream large results**; never hold unbounded lists in client state.
- **Classify failures:** programmer errors throw; expected failures (not found, refused, signed
  out) are typed results the UI renders; nothing falls back silently.

## Scope and Deprecations

- Preserve public contracts. Reviewing a whole file is not permission to remove exports, relocate
  features, or refactor unrelated consumers. Report larger migrations and get agreement first.
- Avoid deprecated APIs. Migrate touched deprecated usage within scope; report migrations blocked
  by wider dependencies.

## Changing Existing Code

- **Separate structure from behavior.** A refactor and a behavior change are separate commits;
  name every behavior change.
- **Pin before you change.** When behavior is unclear, add a characterization test first. Mark
  suspicious current behavior for review instead of silently fixing it.
- **Refactor only what blocks the change**, as a preparatory step, then stop. Report remaining
  smells in touched code rather than folding them in. If edits stop improving clarity, re-diagnose.
- **Sprout, don't rewrite.** Add new behavior in a new function, hook, or component and wire it
  in, rather than rewriting a large legacy body in place.
- **Before moving code**, list its inputs, outputs, state it mutates, and callers.
- **Public SDK and package exports keep a transition path** when their contract changes.
- **Temporary seams carry a removal note**; exploratory restructuring used only to learn the code
  is discarded, not committed.
