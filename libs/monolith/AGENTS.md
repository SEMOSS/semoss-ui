# AGENTS.md - @semoss/monolith

Typed, documented client for every SEMOSS (Monolith) REST endpoint. It works in
Node and the browser and has **zero runtime or workspace dependencies**.

This package contains no React, so the React standard does not apply to work
that stays inside it. To keep it in sync with the backend, follow the
[sync skill](../../skills/semoss-sync.skill.md).

## Layout

Keep it simple: a few small transport files, plus one file per backend resource.

```
src/
  index.ts              PUBLIC root: ApiClient, ApiError, RequestOptions (explicit named exports)
  lib/api-client.ts     PUBLIC ApiClient: configure / settings / clear / reset.
                        Writes the ApiSettings store; makes no requests itself
  lib/api-settings.ts   INTERNAL ApiSettings store: settings with defaults (also the type of
                        configure's argument) + session (CSRF token, cookie jar). Not exported
  lib/api-error.ts      PUBLIC ApiError
  utility/http.ts       INTERNAL: get / post / put / del / request, re-exports repeat.
                        Reads ApiSettings and runs the request pipeline
  utility/url.ts        INTERNAL: path (URL-encodes path parameters), url (full URL)
  utility/body.ts       INTERNAL pure body helpers: repeat, encodeBody, readBody
  types/index.ts        RequestOptions (public), QueryParams, RequestShape
  routes/               PUBLIC via the "./*" subpath export: one file = one backend resource,
                        at its full URL (routes/api/auth/admin/project.ts, routes/health.ts)
```

## Organizing rules for `src/routes`

- **Files mirror the full URL**, servlet prefix included, and so does the import path. camelCase segments become kebab-case file names. For example, `/api/auth/admin/modelUsage` → `src/routes/api/auth/admin/model-usage.ts` → `@semoss/monolith/api/auth/admin/model-usage`, and `/health/*` → `src/routes/health.ts` → `@semoss/monolith/health`.
- **`{type}-{id}` resources** use the type: `/project-{projectId}` → `project.ts` and `/database-{databaseId}` → `database.ts`. Two exceptions: `/e-{engineId}` → `engine-route.ts`, and `/function-{functionId}` → `function-engine.ts`, because `function` is reserved.
- **One file per backend resource class.** A resource with child resources is a file plus a folder of the same name, e.g. `auth/group.ts` and `auth/group/engine.ts`.
- **No `index.ts` barrels under `src/routes`.**
- **File header:** each file starts with a comment naming the URL prefix, the Java class and its source path.
- **Exports:** each file exports only endpoint functions and URL builders. No constants and no local types.
- **Imports:** use the `@/` alias (`@/` = `src/`), as in the other packages. `src/routes` files import from `@/utility/http`, `@/utility/url` and `@/types` (`import type`), plus `ApiClient` from `@/lib/api-client` only to call `ApiClient.clear()` after a logout. Never import `ApiSettings` or another `src/routes` file.

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
- **Response types are traced from the Java code:**
  - start from the `WebUtility.getResponse(x, …)` / `ResourceUtility.respond…` return value
  - follow it into Semoss (`../Semoss/src/prerna/**`); query column aliases (`new QueryColumnSelector("X__Y", "alias")`) become the keys
  - dates serialize as `string | null`
  - success maps are typed exactly, e.g. `{ success: true }`
  - if a shape can't be traced, use the closest safe type (`Record<string, unknown>`, an index signature, or `unknown`) and add `@remarks Unverified response shape.`
- **Permission values:** `"OWNER" | "EDIT" | "READ_ONLY"` (names) or `1 | 2 | 3` (ids), whichever the Java reads.

**Transport rules (`utility/http`, `utility/url`):**
- **Query parameters (GET):** `get(path, params, options)`. Arrays become repeated query keys.
- **Form body (POST):** `post(path, params, options)`. Non-string values are `JSON.stringify`'d, which matches `new Gson().fromJson(form.getFirst("x"))`. Wrap an array in `repeat(...)` only when the Java reads `getParameterValues` or `getParameterMap()`.
- **Paths:** always write the **full** URL below the context root (servlet prefix included) with the `path` tag from `@/utility/url`, even when it has no parameters, so every URL looks the same and matches its `@endpoint` tag: `` get(path`/api/auth/whoami`, …) ``, `` get(path`/health/ready`, …) ``. Destructure path parameters out of `params`; `` path`/api/project-${projectId}/landing` `` URL-encodes each value.
- **Other shapes:** pass the 4th argument, e.g. `{ bodyType: "json" | "multipart" }`, `{ responseType: "blob" | "text" | "stream" | "response" }`, or `{ query }` for a POST that also takes a query string.
- **Browser navigation routes** (OAuth `login/{provider}`, HTML pages): export a `…Url(params)` builder that returns `url(...)`. Also add an ignore entry in `scripts/semoss-sync.json` with `replacement` set to the builder.
- **`tz` parameters:** default to `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- **Logout:** call `ApiClient.clear()` after a successful logout.

**Deprecations:** add `@deprecated` when any of these is true, and list the endpoint in `ISSUES.md`:
- the Java method or class has `@Deprecated`
- the Javadoc says deprecated, legacy or "use X instead"
- the route is served by a legacy resource such as `OldEngineResource`

**Not wrapped:** webhooks called by third parties, SAML servlets and WebSocket endpoints. They go in `targets.api.ignore` in `scripts/semoss-sync.json`, with a reason.

## Guardrails

- **Dependencies:** no runtime or workspace dependencies. `src/lib` and `src/utility` never import from `src/routes`.
- **KISS:** don't add transport features or files unless an endpoint needs them. Prefer one plain function over options and abstractions.
- **Root exports:** don't add exports to `src/index.ts` without a reason. Every addition is public API.
- **Consumers** (sdk, shared, …) must keep `@semoss/monolith` external (`external` / `peerDependencies`) and never inline it. Two bundled copies would mean two singletons, and only one of them would be configured.
- **Versioning:** `package.json` `version` mirrors the backend (`5.5.0-snapshot` until SEMOSS releases). It stays `private` until then. See `scripts/semoss-sync.json`.
- **Generated output:** never edit `dist/`.

## Commands

| Command | Purpose |
|---|---|
| `pnpm --filter @semoss/monolith build` | Build `dist/` (one `.mjs` per source file, plus `.d.ts`) |
| `pnpm --filter @semoss/monolith exec tsc --noEmit -p .` | Type-check |
| `pnpm exec biome check libs/monolith` | Lint and format |
