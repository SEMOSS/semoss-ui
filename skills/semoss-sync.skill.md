---
name: semoss-sync
description: "Use when syncing @semoss/monolith with the SEMOSS backend: adding, updating, removing or deprecating endpoint wrappers after Monolith/Semoss changes, refreshing their JSDoc, recording the front-end tasks a sync leaves in libs/monolith/ISSUES.md, maintaining the ignore list in scripts/semoss-sync.json, or preparing a release when SEMOSS publishes."
---

# SEMOSS Sync

This skill keeps generated frontend code in line with the Java backend. It uses
no scripts: you read the backend source with git, `rg` and the files
themselves. State lives in [`scripts/semoss-sync.json`](../scripts/semoss-sync.json).

There is one target today: **`api`** ([`libs/monolith`](../libs/monolith/AGENTS.md)). A
**`reactors`** target (Pixel reactors) will be added later. Give it its own
entry under `targets` and its own section below.

Before editing anything in `libs/monolith`, read [libs/monolith/AGENTS.md](../libs/monolith/AGENTS.md).
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
3. **Compare with the code.** Run `rg -n "@endpoint " libs/monolith/src/routes` to get the current wrapped set, and skip anything matching `targets.api.ignore`. Sort each endpoint into one of:
   - **added:** in the backend but not wrapped and not ignored
   - **removed:** wrapped, but gone from the backend
   - **signature changed:** a parameter, method, path, consumes or produces changed
   - **behavior changed:** the method body or the Semoss util behind it changed
   - **deprecated:** newly marked as deprecated
4. **Apply each change** using the template in `libs/monolith/AGENTS.md`:
   - Add, update or delete the function, and keep its JSDoc complete: description, `@name`, `@endpoint`, `@source`, an `@param` line for every field, `@returns` and `@throws`.
   - Re-read the method body for the description. Backend Javadoc is mostly boilerplate.
   - Removed or renamed functions and files are **breaking changes**. List them in your report.
5. **Deprecations.** Add `@deprecated <reason>. Use {@link replacement} instead.` when any of these is true:
   - the Java method or class has `@Deprecated`
   - its Javadoc says deprecated or legacy
   - it's served by a legacy resource such as `OldEngineResource`

   Remove the tag if the backend un-deprecates the endpoint.
6. **Record front-end tasks.** `libs/monolith/ISSUES.md` tracks outstanding front-end tasks only. When the sync leaves front-end work, add a `- [ ]` item under the matching group, naming the file or endpoint:
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
   - Nothing may be both wrapped and ignored.
   - Every backend `@Deprecated` must have a matching `@deprecated` tag, or an ignore entry.
9. **Validate:**
   ```bash
   pnpm --filter @semoss/monolith exec tsc --noEmit -p .
   pnpm exec biome check libs/monolith
   pnpm --filter @semoss/sdk build    # compiles libs/monolith into libs/sdk/dist/monolith/src
   pnpm --filter @semoss/sdk test
   ```
10. **Record the sync.** Set `targets.api.monolithCommit` and `semossCommit` (`git rev-parse HEAD` in each checkout) and `syncedAt` (today). Update `backend.version` from Monolith's `vars.VERSION` / latest tag if it moved, and keep the `version` of `libs/monolith/package.json` matching it (lowercase `-snapshot`).
11. **Report to the user:**
    - what was added, changed, removed and deprecated
    - the breaking changes
    - the front-end tasks added to or removed from `ISSUES.md`
    - backend problems found, for the backend team
    - any changes to the ignore list

## Release (only when SEMOSS publishes a release)

`@semoss/monolith` is never published on its own: it ships inside `@semoss/sdk`
(as `@semoss/sdk/monolith/*`), so a release is an SDK release built from a synced
checkout.

1. **Set the version.** In `scripts/semoss-sync.json`, set `backend.version` to the release tag (e.g. `5.5.0`) and `released` to `true`.
2. **Sync against the tag.** Run the steps above with the Monolith and Semoss checkouts at that tag.
3. **Update `libs/monolith/package.json`.** Set `version` to the same tag. It stays `private`.
4. **Publish the SDK** through `.github/workflows/publish-github-packages.yml`; its build bundles this source. After the release, move `backend.version` to the next `-SNAPSHOT`, and the monolith package `version` to the matching lowercase `-snapshot`.
