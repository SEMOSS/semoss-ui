---
name: react-standard
description: "Use when creating, editing, refactoring, or reviewing React components, hooks, TypeScript source, and full staged files in SEMOSS. Covers architecture exceptions, type safety, performance, and validation."
---

# SEMOSS React Standard

Apply this standard when implementing or reviewing `.ts`, `.tsx`, `.js`, and `.jsx`
files under `libs/*/src/` and `packages/*/src/`, including nested directories and
tests. Non-React code follows applicable TypeScript rules, not React-only architecture.

## Authorities and Scope

- Preserve the dependency boundaries and package conventions in
  [AGENTS.md](../AGENTS.md) and the owning package's guide.
- [DESIGN.md](../DESIGN.md) governs UI composition, semantic tokens, primitives,
  and enumerated design exceptions. `@semoss/ui/next` is the design authority.
- Load the [accessibility skill](./accessibility.skill.md) for UI,
  the [mobile skill](./mobile-development.skill.md) for responsive
  and touch work, and the [form skill](./react-form-builder.skill.md)
  whenever a form is created or touched. Those skills own their specialized requirements.
- Preserve existing public contracts. Full-file review is not permission to
  remove exports, relocate existing features, or refactor unrelated consumers.
  Report migrations that require a larger scope and obtain agreement first.

## Architecture and Exports

- Use functional React components. Class-based error boundaries are allowed;
  ordinary class components are not. Legitimate non-React store, SDK, editor,
  and custom error classes remain allowed. Do not introduce classes just as DTOs.
- Keep one component per file; `@semoss/ui` may colocate related primitives.
  Favor readable composition, slots, and discriminated unions over conflicting
  boolean variants. Share state/context when justified, not to remove every prop.
  There is no mandatory line limit or presenter/container split.
- Use named exports in application/library source. Tool configuration files may
  use default exports when their tool requires them; this is not an application
  escape hatch.
- Keep curated package and public subpath entry points. Cross-package consumers
  use supported public imports such as `@semoss/ui/next` and `@semoss/sdk/react`.
  Within a package, import from defining files, not internal barrels or the
  package's own public barrel. Do not create an `index.ts` in every folder.
  Preserve compatibility export chains consumed by untouched code; when editing
  public exports, prefer direct re-exports from defining files. Do not delete
  public API surface or claim barrels inherently prevent tree shaking.
- Put new application features in `src/features/<feature>/`, colocating their
  components, hooks, and helpers as needed. Keep routing under `pages/`, with
  thin route pages composing features. Existing features remain where they are
  unless migration is explicitly scoped; libraries retain their package layout.
- Reuse existing shared types/utilities without violating dependency boundaries.
  Keep single-use types near their owner; extract shared types only when useful.
- Document functions with TSDoc and component props on their type/interface;
  explain non-obvious code without narrating trivial operations.
- Avoid deprecated APIs and migrate touched deprecated usage to the documented
  replacement within scope. Report any migration blocked by wider dependencies.

## Logic, State, and Effects

- Use single responsibilities, early returns, and the simplest adequate design.
  Never move ordinary hook calls below conditional returns; obey hook ordering.
- Extract complex business workflows, data orchestration, and state machines
  into custom hooks. Simple local UI state and handlers can stay in components.
  Pure calculations and transformations belong in ordinary functions, not hooks
  created just to give them a `use` prefix.
- React props and state are immutable. Use a pure functional state updater when
  the next value depends on previous state; direct replacements from arguments
  are fine. Preserve sanctioned MobX/store actions rather than rewriting stores
  to imitate React state.
- Derive values during render; keep interaction-triggered work in event handlers.
  Effects synchronize external systems, not duplicate derived state. Include
  every dependency actually read; do not omit dependencies or hide them in refs
  to silence lint. Effect callbacks must not be async. Clean up subscriptions,
  timers, and resources; cancel async work or guard against stale results where
  relevant. Do not add empty cleanup functions or ban effects categorically.
- Keep backend transport in the owning `api/` domain modules using `@semoss/sdk`
  primitives, not raw `fetch`. Prefer existing SDK hooks and `usePixel` for reads.
  Return parsed data, validate boundary payloads, and surface failures and missing
  required data explicitly. Do not report success for failed required operations.

## Types and Naming

- No explicit `any`, non-null assertions, `@ts-ignore`, or `@ts-nocheck` workarounds
  in authored production source. Narrow `unknown` and guard nullable values.
  Runtime validation remains necessary at trust boundaries; TypeScript is not a
  runtime safety guarantee.
- A reason-bearing `@ts-expect-error` is allowed only for a type-negative test or
  a narrowly documented external typing defect. Never automatically substitute
  it for `@ts-ignore` merely to silence an error.
- Use type/interface contracts, with explicit interfaces for stores and config
  objects. Declare return types on authored custom hooks and complex mapping
  functions; trivial inline callbacks need not all have annotations. Use
  `as const`/`satisfies` for finite maps when useful; `as const` does not freeze
  objects at runtime.
- Values/functions use camelCase; components/types use PascalCase. Callback props
  use `onX`, internal handlers `handleX`, and owned booleans `is`/`has`/`should`
  prefixes. Preserve native/library/API contracts such as `disabled`, `checked`,
  `open`, and backend field names.
- Use existing kebab-case and dot role-suffix file naming, such as
  `project.page.tsx`, `workspace.context.tsx`, and `config.store.ts`. Hooks use
  `use-<name>.ts` and export `useName`. Do not mass-rename legacy files or invent
  role suffixes for files without a defined role.

## Tailwind and Styling

- Treat `DESIGN.md` and `@semoss/ui/next` as the styling authority. Reuse existing
  components, semantic tokens, and local composites before adding utility classes.
- Use semantic classes such as `bg-background`, `text-foreground`,
  `text-muted-foreground`, `border-border`, and the approved status tokens. Do not
  invent hex values, raw palette shades, or a second accent color in a component.
- Prefer the existing type scale, spacing scale, radii, and control sizes. Avoid
  arbitrary values such as `text-[13px]`, `p-[17px]`, `z-[999]`, or one-off pixel
  dimensions unless the owning design rule explicitly requires them.
- Keep utility composition readable. Extract a repeated or conditional class group
  into a named component or local constant and use the repository's `cn()` helper
  rather than concatenating classes or allowing conflicting utilities to accumulate.
- Write the base layout for the narrowest supported viewport, then add responsive
  utilities only where the content needs them. Do not hide essential actions,
  reorder content away from DOM order, or create horizontal page overflow.
- Use borders, spacing, and typography to establish hierarchy. Do not add gradients,
  decorative blobs, excessive shadows, nested cards, or animation merely to make a
  screen appear polished.
- Give fixed-format controls, tables, grids, editors, and media stable dimensions so
  loading, long labels, focus styles, and state changes do not shift the layout.
- Prefer class-based styling over inline styles. Inline styles are appropriate only
  for genuinely data-driven values that cannot be represented by the token or utility
  system.

## React Performance and Correctness Guidance

The following guidance applies the React performance and correctness practices
that are relevant to SEMOSS. SEMOSS SDK, design, architecture, and supported
React versions take precedence over generic React guidance.

### Correctness Defaults

- **Stable component types**:
  define component types outside parent render functions so parent rerenders do
  not reset child state/focus. Ordinary handlers and render callbacks are not
  automatically nested component types. Follow the one-component-per-file rule.
- **Previous-state updates**:
  use pure functional updaters for dependent state; this does not itself stabilize
  callback identity or require `useCallback`.
- **Lazy initialization**:
  use a pure lazy initializer for expensive initial state. Strict Mode and
  remounts can rerun it. Do not freeze values that must track changing props.
- **Dependencies, derived state, and event-driven work**:
  apply the effect rules above; dependency completeness takes priority over
  attempts to reduce effect executions.
- **Conditional rendering**:
  use explicit boolean checks or ternaries to avoid rendering numeric `0`/`NaN`.
  Boolean `&&` expressions remain valid.
- **Immutable arrays**:
  never sort, reverse, or splice props/state in place. Copy first or use supported
  copying methods; check target-browser support before adopting newer methods.

### Apply Where Relevant, Measure Performance Claims

- **Independent async work and deferred awaits**:
  use existing API helpers to parallelize truly independent work and avoid work
  until needed. Preserve ordered Pixel/insight mutations, permissions, rate
  limits, cancellation, and error semantics. Do not add `better-all`.
- **Heavy optional imports and conditional loading**:
  use existing router conventions, `React.lazy`/`Suspense`, or Vite-compatible
  `import()` for optional editors/viewers/charts. Adapt named exports in the lazy
  promise result, preserve accessible loading/error states and stable geometry,
  and inspect production chunks/network behavior. Do not use `next/dynamic`.
- **Import boundaries**:
  follow the public-entry/internal-definition policy above; do not use unsupported
  third-party deep imports or promise unmeasured build-time savings.
- **Transitions and deferred rendering**:
  keep controlled input updates urgent. After profiling, defer expensive results
  or non-urgent updates with boundaries that can actually skip urgent rerenders.
  These APIs neither debounce requests nor move CPU work off-thread; use existing
  request management or a worker when warranted.
- **Shared subscriptions and passive listeners**:
  reuse existing subscription abstractions where useful and clean up listeners.
  Make touch/wheel listeners passive only when they do not need `preventDefault`.
  Do not add SWR or an event bus just to satisfy this guidance.
- **Owned persistence**:
  version/minimize data, validate parsed unknown values, handle corrupt or
  unavailable storage, and exclude secrets/sensitive records. Preserve existing
  storage contracts; optional preferences may fall back, required writes must
  surface failures. This is not a global storage migration.

Profile before memoizing and follow established React/compiler tooling. Verify
installed versions and library peers before newer APIs; do not assume React
Compiler, Activity, or `useEffectEvent` is available. No blanket memoization,
micro-optimization, unbounded module cache, universal preload, or routine DOM
mutation is required. Dependency or React peer changes require explicit scope and
compatibility review.

Reserve media/loading dimensions and avoid long blocking tasks. INP <200ms and
CLS <0.1 are measured targets, preferably at the field 75th percentile, not lint
guarantees.

### Rule Catalog

Use this catalog when reviewing or implementing React code. Apply the highest
impact applicable rule first, then verify the result with profiling or a focused
behavior check. Do not introduce a dependency or framework API solely to satisfy
a catalog entry.

1. **Eliminating waterfalls (critical)**
   - Check cheap synchronous conditions before awaiting flags or remote values.
   - Defer awaits into the branches that need them.
   - Start independent operations together with `Promise.all` or existing SDK
     helpers, while preserving ordered Pixel/insight mutations and cancellation.
   - Start independent work early in route or workflow handlers and use focused
     Suspense boundaries when the host supports them.

2. **Bundle size (critical)**
   - Follow SEMOSS public-entry and internal-definition import boundaries.
   - Load optional editors, viewers, charts, and feature modules conditionally.
   - Defer non-critical analytics, logging, and monitoring until they cannot block
     the initial interaction.
   - Prefer statically analyzable import paths and preload only on clear user
     intent such as hover, focus, or an enabled feature.

3. **Client-side data fetching (medium-high)**
   - Reuse shared subscription or SDK query abstractions to deduplicate global
     event listeners and requests.
   - Mark touch and wheel listeners passive only when they never call
     `preventDefault`.
   - Version and minimize persisted preference data, validate parsed values, handle
     unavailable storage, and never persist secrets or sensitive records.

4. **Re-render optimization (medium)**
   - Derive values during render instead of mirroring them in state and effects.
   - Read dynamic state at the point of use when a subscription is unnecessary.
   - Keep primitive expressions simple; profile before adding `useMemo`, `memo`, or
     `useCallback`.
   - Define components outside parent renders, hoist stable default values, and
     extract expensive work into memoized components only when measured.
   - Narrow effect dependencies to values actually used, split independent hook
     computations, and move interaction logic into event handlers.
   - Subscribe to derived state where possible, use functional state updates for
     previous-state changes, and use lazy initialization for expensive values.
   - Keep controlled input updates urgent; use transitions or deferred values only
     for measured expensive non-urgent rendering, and refs for transient values
     that should not trigger renders.

5. **Rendering performance (medium)**
   - Animate a wrapper around SVG when that improves compositing, and use
     `content-visibility` for genuinely long off-screen lists.
   - Hoist static JSX when it is large or expensive to recreate; optimize SVG
     precision in generated assets.
   - Use explicit conditional rendering when a falsy value such as `0` or `NaN`
     could otherwise render accidentally.
   - Use resource hints and non-blocking script loading only when the host and
     measured loading path justify them.

6. **JavaScript performance (low-medium)**
   - Avoid layout thrashing by batching DOM reads and writes; prefer CSS classes.
   - Build `Map` or `Set` indexes for repeated lookups, and cache repeated work
     only when the cache has bounded ownership and invalidation.
   - Combine array passes in proven hot paths, defer non-critical work to idle time,
     and return early when a result is known.
   - Check collection lengths before expensive comparisons, hoist reusable regular
     expressions, and use `flatMap` when it clearly removes an intermediate pass.
   - Find min/max values with a loop instead of sorting, and use immutable sorting
     (`toSorted` or a copied array) for props and state.

7. **Advanced patterns (low)**
   - Keep effect dependencies complete; do not add experimental effect-event APIs
     unless the installed React version and lint tooling support them.
   - Run app-wide initialization from an owned entry point or guarded initializer,
     not from an effect that may rerun on remount.
   - Use stable event-handler refs or the supported effect-event replacement when a
     subscription must not be recreated for every callback change.

## Validation

[biome.json](../biome.json) is the source of truth for lint rules, severities,
formatting, and file exceptions. Use `pnpm check` or a focused
`pnpm exec biome check <files>`; do not duplicate that configuration in guidance.

Lint does not certify architecture, effect purpose/cleanup, runtime validation,
explicit hook return types, justified suppressions, accessibility, or performance.
Review these requirements and test relevant behavior separately. Follow
[DESIGN.md](../DESIGN.md#self-audit) for design validation.

Biome checks working-tree content, not the index. For partially staged files,
inspect complete staged versions with `git show :path/to/file`; a passing
working-tree check does not validate them. Do not stage another person's changes.

## Full-File Review and Handoff

1. Read this standard, the owning instructions, and applicable specialized skills.
   Inspect full touched files and, for staged review, their full index versions.
   Apply relevant rules to tests/non-React source without forcing React structure.
2. In implementation mode, fix in-scope violations and preserve compatibility.
   In review-only mode, report findings with locations and risks without edits.
    Do not expand into unrelated migrations to satisfy full-file review.
3. Check hook/state semantics, error/loading/empty states, SDK boundaries, naming,
   exports, explicit returns, suppression reasons, and deprecated usage. For UI,
   check accessible names, keyboard operation, visible focus, overlay focus
   management, and meaningful status announcements without redundant ARIA.
    Prefer semantic roles and accessible names for test selectors; use stable IDs
    or `data-testid="fileName-component-uniqueIdentifier"` when needed.
4. Run focused checks first. For relevant application changes, test previous-state
   updates, focus/state preservation, zero-count rendering, immutable transforms,
   storage fallback, and accessible async states. For optimizations, record
   profiler/browser or production-bundle evidence rather than inferred wins.
5. Report relevant standards, deprecation, risk, and validation findings concisely;
  include design/accessibility checks when UI behavior is affected. State exactly
  what ran and any failures or missing coverage. Follow the owning package's
  validation requirements within scope. For documentation-only changes, verify
  links, metadata, and applicable examples; do not claim application or WCAG
  conformance from prose review. Disclose compatibility or scope blockers.