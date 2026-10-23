---
name: semoss-sync
description: "Use when syncing SDK REST resources or Pixel reactor contracts with the SEMOSS backend: adding, updating, removing or deprecating endpoints and reactors after Monolith/Semoss changes, refreshing source-bound contracts, recording frontend follow-ups in libs/sdk/ISSUES.md, maintaining root semoss-sync.json state and coverage, or preparing an authorized release."
---

# SEMOSS Sync

This skill keeps SDK REST resources and Pixel reactor contracts in line with the
Java backend. There is no installed sync command: read the source with git, `rg`,
source inspection tools, and the files themselves. This skill owns the workflow; state lives in
[`semoss-sync.json`](../semoss-sync.json) at the repository root. Keep migration
guidance in the SDK README and frontend follow-ups in `libs/sdk/ISSUES.md`.

There are two independent targets: **`api`**
([REST resources](../libs/sdk/src/api/AGENTS.md)) and **`reactors`**
([Pixel contracts](../libs/sdk/src/lib/reactors/catalog.ts)). Each has its own
commits, coverage, findings, and validation under `targets`.

Before editing SDK REST resources, read [libs/sdk/src/api/AGENTS.md](../libs/sdk/src/api/AGENTS.md).
It holds the layout, naming and JSDoc template that every change must follow.

## Inputs

- **Root `semoss-sync.json`:**
  - `backend`: the version and the paths to the Monolith and Semoss checkouts (relative to this repo root)
  - `targets.api`: the last synced commits, `syncedAt` and the `ignore` list
  - `targets.api.auditNotes`, `coverage`, and `validation`: the recorded audit scope and results
  - `targets.api.backendFindings`: backend defects, with source evidence and consequences, kept separate from frontend tasks
  - `targets.reactors`: independent reactor commits, coverage, exclusions, contract verification gaps, backend findings, and validation
- **Monolith** (`backend.monolith.path`): the REST resources. They live in:
  - `src/prerna/semoss/web/**` (most of them)
  - `src/prerna/upload/**`
  - `src/prerna/remoteviewer/api/**`
  - the servlet prefixes in `WebContent/WEB-INF/web.xml` and `src/prerna/semoss/web/app/*Application.java`
- **Semoss** (`backend.semoss.path`): response producers throughout `src/`, including
  auth/access utilities, reactors, Gson serializers, model-usage producers, and
  `PixelStreamUtility`.

If a path is wrong for this machine, ask the user for theirs. Don't guess.

## Run: target `api`

1. **Find what changed.** Compare the current source trees against the commits
   recorded in `targets.api`, including staged, unstaged, and untracked changes:
   ```bash
   git -C <monolith> status --short
   git -C <monolith> diff --name-only <monolithCommit> -- src WebContent/WEB-INF/web.xml
   git -C <monolith> ls-files --others --exclude-standard -- src WebContent/WEB-INF/web.xml
   git -C <semoss> status --short
   git -C <semoss> diff --name-only <semossCommit> -- src
   git -C <semoss> ls-files --others --exclude-standard -- src
   ```
   - Inspect current files and preserve all backend working-tree changes. The diff
     compares tracked files with the recorded commit; `ls-files` adds new source files.
   - Changed response producers may alter callers' contracts. Trace their endpoint
     callers with `rg`, including serializers and streaming implementations.
   - For a first run, or when the user says "full", treat every resource class as changed.
2. **Inventory the changed classes.**
   - Use `rg -n "@Path|@GET|@POST|@PUT|@DELETE|@Deprecated"` on each changed file.
   - For each HTTP method, read:
     - the parameters: `@QueryParam`, `@PathParam`, `form.getFirst`, `request.getParameter`, `getParameterValues` / `getParameterMap`, and JSON bodies
     - the consumes/produces
     - the response: `WebUtility.getResponse(…)` / `ResourceUtility.respond…`, traced into Semoss
   - Methods that have `@Path` but no HTTP verb are sub-resource locators. Follow them to their class.
3. **Compare with the code.** Run `rg -n "@endpoint " libs/sdk/src/api` to get the current wrapped set, and skip anything matching `targets.api.ignore`. Sort each endpoint into one of:
   - **added:** in the backend but not wrapped and not ignored
   - **removed:** wrapped, but gone from the backend
   - **signature changed:** a parameter, method, path, consumes or produces changed
   - **behavior changed:** the method body or the Semoss util behind it changed
   - **deprecated:** newly marked as deprecated
4. **Apply each change** using the template in `libs/sdk/src/api/AGENTS.md`:
   - Add, update or delete the function, and keep its JSDoc complete: description, `@name`, `@endpoint`, `@source`, an `@param` line for every field, `@returns` and `@throws`.
   - Keep public helper implementations/contracts in `lib/` and internal transport support in `utility/`, following the SDK guide. Preserve supported package imports; utility modules are not public exports.
   - Re-read the method body for the description. Backend Javadoc is mostly boilerplate.
   - Removed or renamed functions and files are **breaking changes**. List them in your report.
5. **Deprecations.** Add `@deprecated <reason>. Use {@link replacement} instead.` when any of these is true:
   - the Java method or class has `@Deprecated`
   - its Javadoc says deprecated or legacy
   - it's served by a legacy resource such as `OldEngineResource`

   Remove the tag if the backend un-deprecates the endpoint.
6. **Record front-end tasks.** `libs/sdk/ISSUES.md` tracks outstanding front-end tasks only. When the sync leaves front-end work, add a `- [ ]` item under the matching group, naming the file or endpoint:
   - unverified response shapes (`@remarks Unverified response shape.`)
   - front-end types or callers that no longer match the wrapper
   - wrappers that work around backend behavior, to revisit when the backend changes
   - deprecated endpoints that front-end code still calls
   - missing URL builders or wrappers that the UI needs

   Don't log backend bugs, security findings or inconsistencies there. Record them
   in `targets.api.backendFindings` in the root JSON and list them in your report
   for the backend team. Retain outstanding findings until verified resolved.
   Delete frontend tasks that are done. Keep consumer-facing breaking changes and
   corrected contracts in the SDK README's upgrading section.
7. **Maintain the ignore list.** Each entry is `{ method, path, reason, replacement? }`, where `path` is the full path (e.g. `/api/...` or `/msgraph/...`) and may use `*` globs.
   - Add an entry for every endpoint that is deliberately not wrapped: webhooks, SAML servlets, WebSockets.
   - Also add one for every endpoint exposed only as a URL builder, with `replacement` set to the builder name.
   - Delete entries whose endpoint no longer exists.
8. **Check coverage.**
   - Every HTTP method in Monolith must appear as an `@endpoint` tag or in `ignore`.
   - No fetch wrapper may be ignored. URL-builder-only entries are explicitly listed with their replacement; downloads with both forms need no exclusion.
   - Every backend `@Deprecated` must have a matching `@deprecated` tag, or an ignore entry.
9. **Validate:**
   ```bash
   pnpm --filter @semoss/sdk exec tsc --noEmit -p .
   pnpm exec biome check libs/sdk
   pnpm --filter @semoss/sdk test
   pnpm --filter @semoss/sdk test:integration
   ```
   `test:integration` builds the production SDK before running the separate build
   integration suite. It creates and cleans temporary consumer bundles for export,
   declaration, tree-shaking, and initialization checks. Ordinary test, watch, and
   coverage commands run only source unit tests.
10. **Record the sync.** After completing the audit and validation, update the root
    `semoss-sync.json`: set `targets.api.monolithCommit` and `semossCommit`
    (`git rev-parse HEAD` in each checkout) and `syncedAt` (today). Record the audit
    scope, coverage, backend findings, and validation results from checks actually
    performed. Note any audited backend working-tree changes; commits alone do not
    capture them. Update `backend.version` from Monolith's `vars.VERSION` / latest
    tag if it moved. The SDK keeps its own package version; backend versions are
    tracked here. Moving or editing documentation/configuration alone does not
    advance the sync commits or date.
11. **Report to the user:**
    - what was added, changed, removed and deprecated
    - the breaking changes
    - the front-end tasks added to or removed from `ISSUES.md`
    - backend problems found, for the backend team
    - any changes to the ignore list

## Run: target `reactors`

1. **Read the owning guide and establish the snapshot.** Read
   [libs/sdk/AGENTS.md](../libs/sdk/AGENTS.md). React changes, including `usePixel`
   and its tests, require the full React standard first. Compare all Semoss
   `src/` changes, including working-tree and untracked source, with
   `targets.reactors.semossCommit`. Inspect relevant Monolith runPixel changes
   against its recorded commit. Preserve local changes; a first/full sync covers
   every built-in class and alias.
2. **Inventory actual dispatch.** Trace `ReactorFactory`'s concrete `IReactor`
   discovery throughout `prerna`, active registrations, expression aliases,
   frame routing, ordering, and duplicate-name overrides. Do not limit scans to
   `*Reactor.java` or `src/prerna/reactor`. Ignore commented registrations and
   inactive frame-population methods. Preserve all variant/alias provenance and
   identify shadowed implementations. Metadata prefixes such as `r_Foo` are not
   dispatched Pixel names. Project/deployment extensions are outside this source
   catalog and remain usable through ordinary string calls.
3. **Trace inputs and outputs.** Inspect constructors, inherited helpers, aliases,
   direct noun-store reads, positional inputs, and execution paths. MCP default
   types/requiredness and `keysToGet` are hints, not complete contracts. Trace
   values through utilities, `PixelStreamUtility`, and Gson adapters; Java frames
   and tasks have different wire shapes. Record context-dependent variants.
   Preserve verified fields in dynamic envelopes. Do not infer object DTOs from
   Java `Map`, operation tags, or return-class names alone.
   When a reactor returns an inherited `Object`/map wrapper, follow the argument
   into the concrete helper, SQL row mapper, DTO fields, or provider implementation.
   Keep callback/lambda returns separate from the enclosing method's returns.
   Inspect `putAll`, conditional fields, and metadata collisions before claiming
   required fields or fixed value types. Verify null map omission separately from
   null array entries and top-level null results with the selected Gson adapter.
4. **Maintain internal contracts and evidence.** Update per-domain contracts,
   audited overrides, runtime names, and `lib/reactors/inventory.json` together.
   Keep source paths, implementation context, registration aliases, deprecations,
   and verification status. Maintain `source-contracts.json` for source-derived
   evidence and `contract-gaps.json` for unresolved contracts. Unknown value contracts must explicitly say why;
   unverified contracts need frontend follow-ups, not fabricated precision.
   Output-only refinements live in the internal `*-output-types.ts` files with
   matching `*-output-evidence.json` provenance. Compose them without changing
   parameter contracts or omission proofs. Reconcile every override with a known
   callable name, and update output coverage independently of input verification.
   Required fields and positional tuples must reflect execution behavior.
   For source contracts, explicitly permit parameter omission only when the execution
   path proves it safe; optional inventoried keys alone are insufficient evidence.
   For shared names, preserve the variants without pretending the SDK knows the
   active backend frame. Renamed/removed names and narrowed inputs are breaking
   type changes and must be reported.
5. **Preserve the builder contract.** Export only `buildPixel` and `rawPixel`.
   Keep reactor declarations and support types internal. Preserve explicit
   `runPixel`/`usePixel` generics, config inference, empty-string disabling, and
   runtime behavior. `Select`, `Filter`, and `Join` need positional expressions;
   wrapping them as named nouns changes their parent reactor. Expressions whose
   uppercase aliases collide with lexer tokens (`AND`/`OR`) need valid emitted
   spellings. Ordinary strings remain literal data.
   Serialize vector values with `Vector(...)`, noun rows with brackets, and arrays
   inside maps with JSON-style brackets. Preserve escaped string contents through
   Pixel's lexer/preprocessor. Integer literals outside the signed 32-bit range
   need decimal notation because numeric reactors call Java `intValue()`.
6. **Check coverage and validation.** Every effective built-in registration and
   accepted alias must have a contract and inventory entry, or a reasoned
   exclusion. Check runtime names and type keys agree and that all referenced
   source files exist. Reconcile the inventory independently with backend source
   discovery, not only a snapshot of itself. Run focused serializer, runner,
   hook, and declaration tests, then SDK TypeScript, changed-file Biome, the SDK
   unit suite and `test:integration` under Node 24. Use the backend parser and
   translation when checking literal/expression semantics; syntax acceptance
   alone does not prove correct noun values. Do not require a backend checkout
   for ordinary SDK unit tests or consumer builds.
7. **Record and report.** After coverage and checks complete, update only
   `targets.reactors` with commits/date, audited working-tree scope, counts,
   exclusions, verification gaps, backend findings, and checks actually run.
   Keep frontend follow-ups in `libs/sdk/ISSUES.md` and backend findings in the
   JSON/report. Report added/changed/removed/deprecated contracts and breaking
   changes, distinguish complete name coverage from verified shape coverage,
   and do not claim live backend validation from mocked tests or parsing alone.

## Release (only when explicitly requested)

REST resources ship inside `@semoss/sdk`, under `@semoss/sdk/api/*`.
Sync against the backend release tag, update `backend.version` and `released`,
and publish the SDK through its existing workflow only with release authorization.
Do not automatically align the SDK package version with the backend version.
