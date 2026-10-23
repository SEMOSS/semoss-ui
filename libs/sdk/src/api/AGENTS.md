# SDK REST resources

Inherits [the SDK guide](../../AGENTS.md) and the repository standards. Read
[the sync skill](../../../../skills/semoss-sync.skill.md) for backend audits.
These resources are framework independent. React work elsewhere still requires the
full React standard. The root [semoss-sync.json](../../../../semoss-sync.json)
records sync state, audit coverage, backend findings, and validation under `targets.api`;
[ISSUES.md](../../ISSUES.md) tracks frontend follow-ups, not backend defects.

## Layout and exports

- This directory's supported APIs are the typed REST resources and their URL
  builders. Top-level standalone functions and `InsightWebSocket` are deprecated
  compatibility APIs, including Pixel wrappers and higher-level workflows. Keep
  declaration-level `@deprecated` comments with exact public replacements and
  migration differences. Do not add new Pixel builders or orchestration here.
- Build built-in Pixels with `buildPixel` from `@semoss/sdk` and use `rawPixel`
  only for trusted expressions. Root `runPixel`, React hooks and stores remain
  supported. A resource migration does not automatically preserve a legacy
  helper's normalization, validation, popup lifecycle or reconnect behavior.
- `/api` backend resources live under `src/api/monolith/`, exported as
  `@semoss/sdk/api/monolith/<resource>`.
- Other registered servlet groups live directly under `src/api/github/`, `msgraph/`,
  `adminconfig/`, `health/`, and `token/`. Their top-level resource uses the group's
  name as its filename; `/github/manifest` is `github/manifest.ts`.
- One file per resource class. A resource with children is a file plus a same-named
  folder. camelCase URL segments become kebab-case filenames. Parameterized
  `/project-{projectId}` and `/database-{databaseId}` become `project.ts` and
  `database.ts`; `/e-{engineId}` is `engine-route.ts` and `/function-{functionId}`
  is `function-engine.ts`.
- Keep no per-folder index barrels. Curated common route contracts are exported by
  `src/lib/api.ts` as `@semoss/sdk/api`. `ApiClient` and `ApiSettings` do not exist;
  all settings come from the existing `Env` object.
- Public route errors and `RequestOptions` belong in `lib/api-error.ts` and
  `lib/api-types.ts`. Keep `QueryParams` and `RequestShape` internal in
  `utility/request-types.ts`.
- Use relative defining-file imports for `utility/http`, `utility/body`,
  `utility/url`, `utility/session`, and public `lib/api-types`. Do not import the
  SDK root, stores, or React from resources. Utility modules have no public export
  or barrel.
- Resource exports are endpoint functions, URL builders, and types shared by
  repeated request/response shapes. Prefer inline types for small one-off shapes.
  Use a shared named type for complex repeated producer shapes rather than copies.

## Contracts

Name functions after the last endpoint segment. GET is unsuffixed and POST on the
same path uses `Post`. Empty paths use a descriptive verb/resource name. Signatures
are `(params, options?)`; optional-only params default to `{}`. `RequestOptions`
contains `signal` and `headers`. Preserve public contracts except documented backend
corrections, and adapt legacy normalized SDK return values explicitly.

Every resource header names its URL prefix, Java class, and source path. Each
endpoint has a description, `@name`, exact full `@endpoint`, `@source`, a `@param`
for each parameter/field, `@returns`, and relevant `@throws`. Add `@deprecated` for
Java annotations, documented legacy routes, and `OldEngineResource` methods.

Trace responses through Java method bodies, query aliases, reactors, serializers,
and stream producers. Gson omits null map fields: use `field?: T` for those fields.
Array nulls, serializer-written JSON nulls, and protocol pass-throughs keep their
own semantics. Dates are strings (optional when Gson omits a null). Do not narrow
dynamic Pixel values, engine outputs, provider-configured directory mappings, or
upstream JSON-RPC/model protocol extensions to invented DTOs. Document why a type is
broad. Truly unverified shapes need a remark and a frontend follow-up.

## Transport

- Use `utility/http` helpers. They and the public helpers in `lib/fetch` share the
  sender/redirect handling in `utility/request` and state in `utility/session`.
  The public root helpers keep `{ response, data }`, historical errors, and encoding.
- Pass full context-root-relative paths with the `path` template tag; interpolated
  path values are URL-encoded. GET query arrays repeat keys; null/undefined omit.
- Default POST forms JSON-stringify non-string values. `repeat()` is only for Java
  `getParameterValues`/`getParameterMap` fields. Omitted and JSON `null` differ for
  usage-limit updates; do not collapse them.
- Use `bodyType: "json"`, `"multipart"`, or `"text"` for non-form requests. JDBC POST
  SQL is raw text with `insightId` in the query. Let Fetch set multipart boundaries.
- Use `responseType: "blob" | "text" | "stream" | "response"` when required.
  Routes throw `ApiError` for HTTP failures; browser auth redirects honor
  `Env.REDIRECT_URL` and throw the route `UnauthorizedError`.
- CSRF and headless cookies use existing Env opt-ins. Full logout clears session
  state, even after a redirect/failure. Provider-only logout preserves other logins.
- Default `tz` to the browser timezone and `disableRedirect` to `true` on credential
  login/logout wrappers. Explicit false retains the backend redirect behavior.
- Browser navigation, SAML, and WebSockets use URL builders, with exclusions in
  the root `semoss-sync.json` identifying them as builder-only. Third-party callbacks
  and webhooks are excluded, with reasons. Downloads may expose both a fetch wrapper
  and a URL builder; that is one covered operation and needs no exclusion.

## Validation

Run focused contract tests, SDK source unit tests, `tsc --noEmit`, and
`pnpm --filter @semoss/sdk test:integration` under Node 24. The integration command
builds the production SDK, then runs the separate build integration suite, creating
and cleaning temporary consumer bundles. Ordinary test, watch, and coverage commands
run only source unit tests. Run Biome on changed SDK files. Compare affected
consumer type checks with their existing baseline; do not turn a route sync into a
wholesale application migration. Record backend commits/date only after the audit.
