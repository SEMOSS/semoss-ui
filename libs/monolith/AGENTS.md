# AGENTS.md - @semoss/monolith

Typed, documented client for every SEMOSS (Monolith) REST endpoint. It works in
Node and the browser and has **zero runtime or workspace dependencies**.

It is **source only**: there is no build. `@semoss/sdk` compiles and bundles it
and publishes it: every route file as `@semoss/sdk/monolith/<route>` (e.g.
`@semoss/sdk/monolith/api/auth/admin/project`), and its root (`ApiClient`,
`ApiError`, `UnauthorizedError`, `RequestOptions`) as `@semoss/sdk/monolith`.
Every other package imports it through the SDK, so a page has one `ApiClient`,
which `Env.update` configures.

> **Status: bundled into the SDK; nothing migrated yet.** The routes can be
> called from any app. The SDK's own functions still use its own transport
> (`libs/sdk/src/utility/fetch.ts`), and the apps still call `get`/`post` with
> hand-built URLs. Continue with step 3 of
> [Integrating into the SDK and the apps](#integrating-into-the-sdk-and-the-apps).

This package contains no React, so the React standard does not apply to work
that stays inside it. To keep it in sync with the backend, follow the
[sync skill](../../skills/semoss-sync.skill.md). [ISSUES.md](./ISSUES.md) tracks
the outstanding front-end tasks only. Backend bugs go to the backend team, not
into that file.

## Layout

Keep it simple: a few small transport files, plus one file per backend resource.

```
src/
  index.ts              Root: ApiClient, ApiError, UnauthorizedError, RequestOptions
                        (explicit named exports)
  lib/api-client.ts     PUBLIC ApiClient: configure / settings / clear / reset.
                        Writes the ApiSettings store; makes no requests itself
  lib/api-settings.ts   INTERNAL ApiSettings store: settings with defaults (also the type of
                        configure's argument) + session (CSRF token, cookie jar). Not exported
  lib/api-error.ts      PUBLIC ApiError, and UnauthorizedError (an ApiError) for redirects
  utility/http.ts       INTERNAL: get / post / put / del / request, re-exports repeat.
                        Reads ApiSettings and runs the request pipeline
  utility/url.ts        INTERNAL: path (URL-encodes path parameters), url (full URL)
  utility/body.ts       INTERNAL pure body helpers: repeat, encodeBody, readBody
  types/index.ts        RequestOptions (public), QueryParams, RequestShape
  routes/               PUBLIC (as @semoss/sdk/monolith/*): one file = one backend resource,
                        at its full URL (routes/api/auth/admin/project.ts, routes/health.ts)
```

## Organizing rules for `src/routes`

- **Files mirror the full URL**, servlet prefix included, and so does the import path. camelCase segments become kebab-case file names. For example, `/api/auth/admin/modelUsage` → `src/routes/api/auth/admin/model-usage.ts` → `@semoss/sdk/monolith/api/auth/admin/model-usage`, and `/health/*` → `src/routes/health.ts` → `@semoss/sdk/monolith/health`.
- **`{type}-{id}` resources** use the type: `/project-{projectId}` → `project.ts` and `/database-{databaseId}` → `database.ts`. Two exceptions: `/e-{engineId}` → `engine-route.ts`, and `/function-{functionId}` → `function-engine.ts`, because `function` is reserved.
- **One file per backend resource class.** A resource with child resources is a file plus a folder of the same name, e.g. `auth/group.ts` and `auth/group/engine.ts`.
- **No `index.ts` barrels under `src/routes`.**
- **File header:** each file starts with a comment naming the URL prefix, the Java class and its source path.
- **Exports:** each file exports only endpoint functions and URL builders. No constants and no local types.
- **Imports:** use relative paths, never the `@/` alias: the SDK compiles this source with its own `@/` (= `libs/sdk/src`). `src/routes` files import from `utility/http`, `utility/url` and `types` (`import type`), plus `ApiClient` from `lib/api-client` only to call `ApiClient.clear()` after a logout. Never import `ApiSettings` or another `src/routes` file.

## Naming

- **The function name is the endpoint's last path segment in camelCase:** `getProjectUsers`, `whoami`, `runPixel`.
- **GET and POST on the same path:** the GET is unsuffixed and the POST gets `Post` (`getProjects` / `getProjectsPost`).
- **Empty or `/` paths** use the HTTP verb plus the resource, e.g. `getConfig` for `GET /config`.
- **Path-parameter routes** use the segment without the parameter: `login/{provider}` → `loginUrl` for a URL builder, or `userinfo/{provider}` → `userinfo({ provider })`.
- **Reserved words** (`delete`, `function`, `new` and the like) get a descriptive verb instead, e.g. `deleteTheme` rather than `delete`.
- **Names must be unique within a file.**

## Endpoint function template

Every function, exported or internal, gets full JSDoc: a description,
`@name`, an `@param name - description` line for every parameter and every
`params.field`, and `@returns`. Endpoint functions also carry `@endpoint`,
`@source` and `@throws`, plus `@deprecated` and `@remarks` when they apply.

```ts
/**
 * <What it does, in plain words: who may call it and what side effects it has.>
 *
 * @name getProjectUsers
 * @endpoint GET /api/auth/admin/project/getProjectUsers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#getProjectUsers
 * @param params - Query parameters.            (or "Form fields." for POST)
 * @param params.projectId - The project.
 * @param params.limit - Page size.
 * @param options - Per-call overrides (signal, headers).
 * @returns <What the response contains.>
 * @throws {ApiError} 403 if the caller is not an admin.
 * @remarks Unverified response shape.          (only when the shape could not be traced)
 * @deprecated <Reason>. Use {@link other} instead.  (only when the backend marks it deprecated)
 */
export function getProjectUsers(
	params: { projectId: string; limit?: number },
	options?: RequestOptions,
): Promise<{ totalMembers: number; members: Array<{ id: string; name: string | null }> }> {
	return get(path`/api/auth/admin/project/getProjectUsers`, params, options);
}
```

**Signature rules:**
- **Shape:** always `(params, options?)`. When every field is optional, write `params: {...} = {}`. When the endpoint takes nothing, write `params: Record<string, never> = {}`.
- **Inline types:** argument and response types are written inline. Do not extract named types.
- **Omitted fields:** the backend's Gson never serializes nulls, so a response field that can be null is missing from the JSON. Type it `field?: T`, never `field: T | null`. Inputs are unaffected. Pass-through payloads (`api/model/openai`, `ollama`, `anthropic`, `api/ext/*`) keep their own nullability.
- **Response types are traced from the Java code:**
  - start from the `WebUtility.getResponse(x, …)` / `ResourceUtility.respond…` return value
  - follow it into Semoss (`../Semoss/src/prerna/**`); query column aliases (`new QueryColumnSelector("X__Y", "alias")`) become the keys
  - dates serialize as `string | null`
  - success maps are typed exactly, e.g. `{ success: true }`
  - if a shape can't be traced, use the closest safe type (`Record<string, unknown>`, an index signature, or `unknown`), add `@remarks Unverified response shape.`, and list the function under "Trace unverified response shapes" in `ISSUES.md`
- **Permission values:** `"OWNER" | "EDIT" | "READ_ONLY"` (names) or `1 | 2 | 3` (ids), whichever the Java reads.

**Transport rules (`utility/http`, `utility/url`):**
- **Query parameters (GET):** `get(path, params, options)`. Arrays become repeated query keys.
- **Form body (POST):** `post(path, params, options)`. Non-string values are `JSON.stringify`'d, which matches `new Gson().fromJson(form.getFirst("x"))`. Wrap an array in `repeat(...)` only when the Java reads `getParameterValues` or `getParameterMap()`.
- **Paths:** always write the **full** URL below the context root (servlet prefix included) with the `path` tag from `utility/url`, even when it has no parameters, so every URL looks the same and matches its `@endpoint` tag: `` get(path`/api/auth/whoami`, …) ``, `` get(path`/health/ready`, …) ``. Destructure path parameters out of `params`; `` path`/api/project-${projectId}/landing` `` URL-encodes each value.
- **Other shapes:** pass the 4th argument, e.g. `{ bodyType: "json" | "multipart" }`, `{ responseType: "blob" | "text" | "stream" | "response" }`, or `{ query }` for a POST that also takes a query string.
- **Browser navigation routes** (OAuth `login/{provider}`, HTML pages): export a `…Url(params)` builder that returns `url(...)`. Also add an ignore entry in `scripts/semoss-sync.json` with `replacement` set to the builder. A wrapped endpoint the browser also loads directly (a download link) can get a `…Url` builder beside its function, e.g. `downloadFileUrl`; it needs no ignore entry.
- **Errors:** `request` throws `ApiError` for a non-2xx response, with the message from the body's `errorMessage`, `message` or `error`, or a bare string body (never an HTML error page). When the server redirects the client (a `redirect`/`location` header, or `fetch` followed a redirect to an HTML page) and `onRedirect` is set, it calls `onRedirect` and throws `UnauthorizedError`.
- **`tz` parameters:** default to `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- **`disableRedirect` parameters** (login, LDAP and LinOTP logins, logout): default to `true`, since a script cannot follow the HTML redirect the server sends otherwise; `false` keeps the server's redirect.
- **Logout:** call `ApiClient.clear()` after a successful logout.

**Deprecations:** add `@deprecated` when any of these is true. If front-end code still calls the endpoint, add a task to `ISSUES.md` to move it off:
- the Java method or class has `@Deprecated`
- the Javadoc says deprecated, legacy or "use X instead"
- the route is served by a legacy resource such as `OldEngineResource`

**Not wrapped:** webhooks called by third parties, SAML servlets and WebSocket endpoints. They go in `targets.api.ignore` in `scripts/semoss-sync.json`, with a reason.

## Guardrails

- **Dependencies:** no runtime or workspace dependencies. `src/lib` and `src/utility` never import from `src/routes`.
- **KISS:** don't add transport features or files unless an endpoint needs them. Prefer one plain function over options and abstractions.
- **Root exports:** don't add exports to `src/index.ts` without a reason. The SDK re-exports what apps need.
- **Consumers:** only `@semoss/sdk` may depend on `@semoss/monolith` (a `devDependency`; it bundles the source). Everything else imports routes from `@semoss/sdk/monolith/<route>` and `ApiClient` / `ApiError` / `UnauthorizedError` from `@semoss/sdk/monolith`. A second copy, from importing `@semoss/monolith` directly, would be a second `ApiClient` that nothing configures.
- **No build:** there is no `vite.config.ts` and no `dist/`. `package.json` `exports` point at the TypeScript source, for the SDK's build and tests.
- **Versioning:** `package.json` `version` mirrors the backend (`5.5.0-snapshot` until SEMOSS releases). It stays `private`; the SDK ships it. See `scripts/semoss-sync.json`.

## Commands

| Command | Purpose |
|---|---|
| `pnpm --filter @semoss/monolith exec tsc --noEmit -p .` | Type-check |
| `pnpm exec biome check libs/monolith` | Lint and format |
| `pnpm --filter @semoss/sdk build` | Build the SDK, which compiles this source and its `.d.ts` into `libs/sdk/dist/monolith/src` and `libs/sdk/dist/types/monolith/src` |
| `pnpm --filter @semoss/sdk test` | The SDK tests, which run requests through this transport |

## Integrating into the SDK and the apps

Land it in small steps. Each step must build, type-check and test on its own, and
apps keep working between steps. The order matters: the SDK bundles and exposes
monolith first, the SDK moves onto it, the apps move one module at a time, and only
then are the SDK's own transport and thin wrappers removed.

### 1–2. Bundle into the SDK and configure it from `Env` (done)

The SDK compiles this package and publishes it as `@semoss/sdk/monolith` and
`@semoss/sdk/monolith/<route>`, and every `Env.update` sets `basePath` and `auth`. See
[libs/sdk/AGENTS.md](../sdk/AGENTS.md#monolith-routes-and-the-env-bridge). Until step 3, in
Node, the routes keep their own cookie jar: a session from the SDK's own `login()` is not
shared with them, so use `ACCESS_KEY` / `SECRET_KEY` there. Browsers share cookies.

### 3. Move the SDK's own calls onto the routes

Module by module (`api/*`, then the stores). Public SDK signatures and return shapes stay
the same in this step.

- Errors: every failed call throws `ApiError` (`status`, `data`, `endpoint`); a session
  redirect throws `UnauthorizedError` (an `ApiError` with `status`, **not** `code`).
  `InsightStore` keeps treating `UnauthorizedError` as signed out. Remove
  `.catch(e => { throw Error(e) })` rewraps; they lose the status.
- Gotchas found the first time:
  - `getEngineUsers`' `userId` argument is sent as `searchTerm`.
  - The admin `getUser{Project,Engine}Permission` routes don't exist in the Java: use the user route.
  - The Java treats a missing, empty, `"undefined"` or `"new"` `insightId` the same (a new
    insight); upload helpers should omit a `null` one rather than send the text `"null"`.
  - `result` can answer the bare string `"NULL"`.
  - A model usage limit is removed by sending `null` (the Java's `readJson` accepts `"null"`).
  - `pixelJobStreaming` and `agentRunStreaming` are typed more widely than the SDK's
    `PixelStreamMessage` and `AgentRun*` types (a content chunk's `data` can be a string;
    there are `progress` items): convert explicitly, don't cast.
  - Browser downloads use `downloadFileUrl`; Node uses `downloadFile().arrayBuffer()`.
- Tests: stub `fetch` and send calls through the real transport (a small
  `src/test-utils/mock-backend.ts` that hands requests to `get(url)` / `post(url, fields)`
  mocks works well), or mock the `@semoss/monolith/<route>` modules. A fetch-stub test of
  a write must either set `csrf: false` or expect the `/api/config/fetchCsrf` call first.

### 4. Add `useApi` to `@semoss/sdk/react`

`useApi(fn, params, { enabled, data, onSuccess, onError, onFinal })` returns
`{ status, data, error, refresh, update }`, like `usePixel`. `fn` is a stable
`(params, options?) => Promise` function, such as a route function; `params` is compared
by value; each run gets an `AbortSignal`, aborted when the inputs change or the component
unmounts. Then replace the client's string-keyed `useAPI` (`packages/client/src/hooks/use-api.ts`,
13 call sites), using `enabled` instead of `null` or empty tuples.

### 5. Move the apps, one module at a time

- Replace `get` / `post` / raw `fetch` with `${Env.MODULE}/api/...` URLs by the route
  functions from `@semoss/sdk/monolith/<route>`, called at the call site. Parsing and
  pixel-building helpers move next to their callers; generic ones go to `@semoss/utility`
  (never into the SDK, which must not depend on it). Delete `packages/client/src/api/`
  and `packages/automation/src/api/` once they are empty.
- Gotchas found the first time:
  - Routes URL-encode their params: remove a caller's own `encodeURIComponent`
    (`packages/collaboration/src/features/delegations/components/person-picker.tsx` would
    double-encode the search term).
  - Routes resolve the body, not `{ response, data }`: update every `.data` reader.
  - Some routes exist only for admins (`setUserLocked`, `registerUser`, the user-access
    lists, `getAllProjectInsightUsers`), and the non-admin `deleteUser` deletes the
    *caller*: check each caller's admin mode before choosing a route.
  - The Java ignores `isCustomGroup` (`addGroup`), `username` (`registerUser`) and
    `insightId` (project image upload). Group grants take permission ids `1 | 2 | 3`.
  - GitHub and MS Graph errors are always non-2xx; their `{ status, reason, needsAuth }`
    body is `ApiError.data`.
  - `packages/playground/src/pages/new-room-page.tsx` reads `sdkError.code`; with
    `UnauthorizedError` it must check the class (or `ApiError.status`).
  - In `packages/client/vite.config.ts`, add `@semoss/sdk/monolith` next to `@semoss/sdk`
    in `test.server.deps.external`.

### 6. Remove the SDK's own transport and thin wrappers (breaking)

Only once nothing in the repo uses them. Set the SDK version to the backend's
(`5.5.0-snapshot`, like this package) and add an "Upgrading" table to the SDK README.

- Delete `libs/sdk/src/utility/fetch.ts` (`get`, `post`, `CSRF`) and `HttpError`, and the
  unused `partial` and `propagateUserPermissions`.
- Delete the wrappers that only forward to one route, and point callers at the route:
  `runPixelAsync`, `console`, `getPixelJobStreaming` (→ `pixelJobStreaming`),
  `pollAgentRun` (→ `agentRunStreaming`), `login`, `loginLDAP`, `confirmOTP`
  (→ `loginLinOTP`), `logout` / `logoutProvider` (→ `logout({ provider })`),
  `getUserProjectPermission`, `getUserEnginePermission`, `upload` / `uploadInsight`
  (→ `baseUpload`), `uploadApp` (→ `projectAssetsUpload`), `uploadEngine`
  (→ `engineAssetsUpload`), `uploadUser` (→ `userAssetsUpload`).
- Keep the functions that add logic: `runPixel`, `getPixelAsyncResult`, `getSystemConfig`,
  `loginOTP`, `getLogins`, `connectLogin`, `oauth`, `download`, the image uploads,
  `api/access.ts`, `api/model-usage.ts`, the admin-switching `permissions.ts` functions,
  `searchForUser`, the agent / chat / mcp pixel functions, `InsightWebSocket`, the stores
  and the hooks. The SDK's shared readers (`isRecord`, `readText`, `readNumber`, pixel
  error collection) belong in `libs/sdk/src/utility/`, not in the public barrel.

### Verifying each step

- Use Node 24 (`.nvmrc`); run Vitest through the package scripts, which pass
  `--configLoader runner`.
- Compare type errors with a baseline taken before the step, keyed by file and message
  (several packages have existing errors), rather than expecting zero.
- Several tests already fail on HEAD (listed in `ISSUES.md`); only new failures count.
- The pre-commit hook lints every staged file in full, so touching
  `libs/renderer/src/hooks/useBlock.tsx`, `packages/terminal/src/components/terminal-console/terminal-console.tsx`,
  `packages/terminal/src/components/terminal/upload-modal.tsx` or
  `packages/browser-automation/src/App.tsx` surfaces their existing
  `useExhaustiveDependencies` errors. Fix or justify those in their own change.

