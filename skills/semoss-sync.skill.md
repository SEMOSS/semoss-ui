---
name: semoss-sync
description: "Use when syncing SDK REST resources with the SEMOSS backend: adding, updating, removing or deprecating endpoint wrappers after Monolith/Semoss changes, refreshing their JSDoc, recording the front-end tasks a sync leaves in libs/sdk/ISSUES.md, maintaining the ignore list in scripts/semoss-sync.json, or preparing a release when SEMOSS publishes."
---

# SEMOSS Sync

This skill keeps SDK REST resources in line with the Java backend. It uses
no scripts: you read the backend source with git, `rg` and the files
themselves. State lives in [`scripts/semoss-sync.json`](../scripts/semoss-sync.json).

There is one target today: **`api`** ([`libs/sdk`](../libs/sdk/src/api/AGENTS.md)). A
**`reactors`** target (Pixel reactors) will be added later. Give it its own
entry under `targets` and its own section below.

Before editing SDK REST resources, read [libs/sdk/src/api/AGENTS.md](../libs/sdk/src/api/AGENTS.md).
It holds the layout, naming and JSDoc template that every change must follow.

## Inputs

- **`scripts/semoss-sync.json`:**
  - `backend`: the version and the paths to the Monolith and Semoss checkouts (relative to this repo root)
  - `targets.api`: the last synced commits, `syncedAt` and the `ignore` list
- **Monolith** (`backend.monolith.path`): the REST resources. They live in:
  - `src/prerna/semoss/web/**` (most of them)
  - `src/prerna/upload/**`
  - `src/prerna/remoteviewer/api/**`
  - the servlet prefixes in `WebContent/WEB-INF/web.xml` and `src/prerna/semoss/web/app/*Application.java`
- **Semoss** (`backend.semoss.path`): where response maps are built, mostly `src/prerna/auth/utils/**`, the reactors and `PixelStreamUtility`.

If a path is wrong for this machine, ask the user for theirs. Don't guess.

## Run: target `api`

1. **Find what changed.** Compare against the commits recorded in `targets.api`:
   ```bash
   git -C <monolith> diff --name-only <monolithCommit>..HEAD -- src/prerna/semoss/web src/prerna/upload src/prerna/remoteviewer WebContent/WEB-INF/web.xml
   git -C <semoss> diff --name-only <semossCommit>..HEAD -- src/prerna/auth/utils src/prerna/sablecc2/reactor
   ```
   - Changed Semoss utils mean the responses of the endpoints that call them may have changed. Find those callers with `rg`.
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

   Don't log backend bugs, security findings or inconsistencies there. List them in your report for the backend team. Delete tasks that are done.
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
   pnpm --filter @semoss/sdk build
   pnpm --filter @semoss/sdk test
   pnpm --filter @semoss/sdk test:exports
   ```
10. **Record the sync.** Set `targets.api.monolithCommit` and `semossCommit` (`git rev-parse HEAD` in each checkout) and `syncedAt` (today). Update `backend.version` from Monolith's `vars.VERSION` / latest tag if it moved. The SDK keeps its own package version; backend versions are tracked here.
11. **Report to the user:**
    - what was added, changed, removed and deprecated
    - the breaking changes
    - the front-end tasks added to or removed from `ISSUES.md`
    - backend problems found, for the backend team
    - any changes to the ignore list

## Release (only when explicitly requested)

REST resources ship inside `@semoss/sdk`, under `@semoss/sdk/api/*`.
Sync against the backend release tag, update `backend.version` and `released`,
and publish the SDK through its existing workflow only with release authorization.
Do not automatically align the SDK package version with the backend version.
