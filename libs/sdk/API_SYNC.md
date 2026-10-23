# SDK API consolidation and backend audit

Audited on **2026-10-23** against the current local source trees:

| Repository | Commit |
| --- | --- |
| Monolith | `6fabb05737d5686ae763172559b992f16f7d37d9` |
| Semoss | `12781b2478eb97e2a27a911e9bdbc94b6f34ee88` |

Backend version tracking remains `5.5.0-SNAPSHOT`. The sync state and deliberate
exclusions are in `scripts/semoss-sync.json` in the monorepo. Existing backend
working-tree changes were preserved. In particular, the local Monolith `web.xml`
contains deployment/filter changes; the registered resource mappings were checked
in that working tree. No backend files were edited by this change.

## Public API migration

The SDK owns the 49 resource modules directly. `src/api/monolith/` represents the
backend `/api` application; `github/`, `msgraph/`, `adminconfig/`, `health/`, and
`token/` are sibling folders. There is no `servlet/` folder.

The standalone `@semoss/monolith` package, `ApiClient`, `ApiSettings`, and the old
`@semoss/sdk/monolith` subpaths are removed. These are breaking import/configuration
changes. Replace the old `/monolith/api/<resource>` imports with
`@semoss/sdk/api/monolith/<resource>` and other `/monolith/<servlet>` imports with
`@semoss/sdk/api/<servlet>`. Nested resources retain their path, including
`/api/monolith/auth/admin/project` and `/api/github/manifest`.

`@semoss/sdk/api` exports `ApiError`, the route `UnauthorizedError`, and
`RequestOptions`. Configure requests through the existing root `Env` object.
Multi-entry ESM shares transport chunks; declarations keep relative imports inside
the SDK. The pnpm-generated lockfile removes the former workspace package and its
SDK dependency.

`runPixel` lives at `src/lib/pixel.ts` with its original positional arguments,
generic tuple, normalized result, root export, timezone handling, and error
collection. Internal callers import that defining file. Root `get`, `post`, and
mutable `CSRF` remain exported and used. They retain their encoding, error classes,
and `{ response, data }` result. All 18 requested legacy REST wrappers remain
callable with declaration-level deprecations and exact resource replacements; see
the [migration table](./README.md#upgrading).

Higher-level configuration, normalization, authentication orchestration, chat,
stores, and hooks remain supported. Application changes are limited to adapting
directory candidates and partial agent/progress events to the corrected types.

## Coverage reconciliation

The audit starts at `WebContent/WEB-INF/web.xml` and every `*Application.java`
registration, follows reachable subresource locators, then reads each active
method, its guard/error branches, request decoding, response producers, and relevant
Semoss serializers/reactors/query aliases. Endpoint `@source` and `@endpoint` tags
in each resource provide the operation-level source mapping.

| Registered or reachable resource group | Active Java HTTP method declarations |
| --- | ---: |
| Auth/admin/group/access resources and AuthorizationResource | 210 |
| UserResource | 34 |
| NameServer | 20 |
| DataframeResource / OldEngineResource | 1 / 4 |
| RunInsight | 2 |
| SessionResource / EngineRouteResource | 5 / 4 |
| ProjectResource | 14 |
| Database / storage / model / vector / function engines | 3 / 3 / 4 / 3 / 2 |
| FileUploader / ImageUploader | 5 / 8 |
| Scheduler / admin themes / server configuration / forms | 1 / 7 / 3 / 4 |
| OpenAI / Anthropic / Ollama | 13 / 1 / 5 |
| MCP / A2A | 2 / 3 |
| RemoteBrowserSessionController | 5 |
| **Main `/api` application** | **366** |
| Health / adminconfig / token | 3 / 1 / 2 |
| GitHubService / AdminGitHubService | 13 / 5 |
| MicrosoftGraphSubscriptionService / notification service | 5 / 2 |
| **All six REST applications** | **397** |

The 397 declarations comprise **369 request implementations**, **22 navigation
implementations**, and **6 inbound-only callbacks/webhooks**. RunInsight's two POST
methods are mounted under both `/exec` and `/share`, producing **371 request
wrappers**. NameServer's dataframe and legacy-engine locators are included.
CentralNameServer's historical HTTP methods are commented out and are not operations.

There are **386 endpoint annotations** across the SDK resources: the 371 request
wrappers plus **15 URL builders**. Those builders cover six navigation patterns,
five convenience duplicates of fetchable paths, and four SAML/WebSocket paths.
The annotations describe **379 distinct method/path patterns**; downloads with both
forms and negotiated JSON/SSE implementations intentionally share patterns. The
18 concrete OAuth navigation declarations are represented by `loginUrl` and
`login2Url`. A2A and MCP JSON/SSE methods have separate wrappers with explicit Accept
headers. No registered operation is unaccounted for, and no obsolete request
wrapper was found in the migrated resource set.

### Builders and deliberate exclusions

- Browser navigation: OAuth `loginUrl`/`login2Url`, project `landingUrl`, GitHub
  `appUrl`/`authorizeUrl`, and GitHub manifest `newUrl`.
- SAML navigation: `samlIdpUrl` for `/IdpSSOServlet` and `samlSpUrl` for
  `/SPSSOServlet`. The POST `/saml/config/fedletapplication` assertion callback is
  submitted by the identity provider and deliberately has no request wrapper.
- WebSockets: `browserSocketUrl` and `insightSocketUrl`. Absolute HTTP(S) module
  URLs become WS(S); relative module URLs remain page-relative. Insight sockets
  require the authenticated session and `insightId` query parameter.
- Inbound REST exclusions: three GitHub callbacks, its signed webhook, and two
  Microsoft Graph notification callbacks. Clients do not initiate these operations.
- Download/convenience builders: engine download, engine/project/insight images,
  and MCP `commsUrl`. Their corresponding request wrappers remain available.

The manifest now records precise SAML paths instead of the old broad `/saml/*`
exclusion and names both WebSocket replacements. Deprecated OAuth aliases remain
documented under the navigation exclusion.

## Corrected contracts

These corrections can require consumer type or request changes when moving from
the old REST package. Raw resources preserve backend omission semantics; supported
legacy helpers normalize only their established SDK results.

| Area | Verified behavior and correction |
| --- | --- |
| JDBC POST | JSON/CSV endpoints consume raw SQL text, with `insightId` in the query. SQL is no longer encoded as a form object. JSON frames return `columns` and `data`, or R `dataArray`; Python SELECT may include `index`. Error strings can be returned with HTTP 200. Binary JDBC remains an opaque FST blob. |
| GitHub installations | Nullable database metadata is omitted by Gson: `account`, `accountType`, and `repositorySelection` are optional. Installation id and suspension remain present. |
| Directory lookup | Microsoft Graph JSON-pattern configuration can omit or change user field types. Raw fields remain unknown where the mapping is configurable. Legacy permission candidates validate id/type and optional display fields without inventing permission grants. |
| Engine catalog | `engine_tool_app` is an optional project-id string from `ENGINE.TOOL_APP`, not a boolean. Query-derived favorites/permissions and nullable fields follow the selected aliases and serializers. |
| Pipeline | `PixelListAdapter`, `PixelAdapter`, `TaskOptionsAdapter`, and `PipelineOperation` define the pipeline and parsing shapes. Only noun values, custom options, frame metadata, and layout positions remain dynamic. |
| Agent runs | Types include progress events, workflow/artifact/review evidence, optional room ids, and partial tool fields. Gson-omitted approval fields remain optional on raw routes; legacy poll/get/stop normalize nullable fields and the pending-action array. |
| Usage limits | Limit types and billing source semantics are finite; `DIRECT` and `ALL_MODELS` refer to user id/type. Model response usage is traced through `ModelUsageTicket`, including optional billed source fields, rules, model-total ceilings, capped status, and reset times. Omitted updates and explicit null limits remain distinct. |
| A2A | Request/response types follow the resource's serializers and local `a2a-java-sdk-spec` 1.1.0.Final fields. Null response ids are omitted; state/role enums retain Java names. JSON and SSE calls negotiate the correct producer. |
| Authentication/session | Credential forms and redirect defaults match the backend. Access-token provider maps stringify null profile values as the string `"null"`; they are not optional profile fields. Cleaned/invalidated/full-logout sessions clear local cookies and CSRF state. |
| Microsoft Graph | Nonpositive/omitted subscription minutes use the resource maximum; positive values clamp between 45 minutes and that maximum. Recorded database fields may be omitted; upstream Microsoft payload extensions remain dynamic. |
| Upload compatibility | Legacy wrappers encode ids and paths and omit a null insight id. `upload` still returns records directly; the other upload helpers retain `{ response, data }`. |
| Legacy routes | All four form functions and old-engine routes carry deprecations; the legacy MCP SSE producer is deprecated. Permission helpers use real ordinary permission routes rather than nonexistent admin variants. |

Dynamic payloads remain broad only where the producer is extensible: Pixel output
values, playsheet/function results, provider mappings, tool arguments/metadata,
custom model protocol fields, and MCP method-specific results. The resource remarks
identify those producer boundaries instead of presenting invented DTOs.

## Env and shared session behavior

Routes initialize the document's `semoss-env` settings through their transport,
without loading React, stores, or the root listener. Root initialization still
installs its listener. `Env.CSRF` and `Env.HEADLESS` keep their existing opt-in
defaults; mutable `CSRF.isEnabled` remains supported.

The internal sender and session are shared between raw routes and legacy HTTP
helpers. Effective bearer authentication wins over access/secret credentials, which
win over caller Authorization headers. Browser authentication redirects honor
`Env.REDIRECT_URL`. Changing the effective connection/authentication or performing
full logout clears session state; unrelated Env changes preserve it. Responses
from an older session cannot restore its cookies or token after a clear.

CSRF bootstrap forwards authentication, credentials, and cancellation. A failed or
aborted bootstrap prevents the write; cookies received during bootstrap are included
in the first headless write. Only an explicit stale-token rejection triggers a
single replay. Ordinary forbidden responses and nonreplayable streams are not
retried. Provider-only logout preserves the other providers' session state.

## Backend findings (not changed)

These source-level defects are separate from frontend follow-ups in the monorepo's
`libs/sdk/ISSUES.md`. They were not fixed or exercised against a live backend.
Paths below are relative to the named backend repository.

| Finding | Source evidence | Consequence |
| --- | --- | --- |
| Single-frame JDBC CSV uses the JSON query producer | Monolith `ProjectResource.java`, `jdbcCSV` single-frame branch around line 1224 | Treats a result map as a filename and fails; multi-frame CSV uses its CSV producer. |
| Model SSE only terminates on progress-complete | Monolith `ModelEngineResource.java`, streaming loop around line 210 | Failed/cancelled/unknown jobs may leave the stream open; callers need cancellation/deadlines. |
| Legacy playsheet-parameter reactor has no insight | Monolith `OldEngineResource.java:105`; Semoss `GetPlaysheetParamsReactor.java:91` | The reactor dereferences `this.insight`, so the deprecated endpoint can fail before producing a result. |
| Misspelled function definition reactor | Monolith `FunctionEngineResource.java:97` invokes `GetFunctionEngineDefintion` | The definition endpoint fails instead of invoking `GetFunctionEngineDefinition`. |
| Legacy form permission checks swallow denial | Monolith `FormResource.java:305` and `:334` catch the `IllegalAccessException` they throw | A missing permission row is logged without reliably stopping the protected operation. Backend remediation is needed. |
| Misspelled legacy form response media type | Monolith `FormResource.java:221` produces `applicaiton/json` | Incorrect content type on the legacy read endpoint. |
| User deletion is a placeholder | Monolith `UserAuthorizationResource.java`, `deleteUser` | Returns a null Response/204 for a valid session without deleting the account. The wrapper now describes this behavior. |
| Cluster token response mislabels IP as date | Monolith `TrustedTokenService.java:91–93`; Semoss `SecurityTokenUtils.java:110` | The cluster array's IP slot is exposed as `dateAdded`; local token creation stores a timestamp in that slot. |
| Endpoint discovery is incomplete | Monolith `ServerConfigurationResource.java`, reflection loop around line 414 | Direct singleton reflection does not traverse reachable locators and reports only one verb per method; it cannot serve as the sole coverage inventory. |

## Validation

Validation uses Node 24.4.0 and pnpm 10.13.1. The starting SDK baseline was 204
passing tests and a passing production build.

| Check | Result |
| --- | --- |
| SDK Vitest suite | **262 tests passed across 22 files** |
| SDK TypeScript | Passed (`tsc --noEmit --emitDeclarationOnly false`) |
| Production SDK build | Passed; 104 modules, shared ESM chunks and declarations |
| Public exports | All **52 JavaScript/type entry points** resolve; strict public helper fixture compiles |
| Legacy declarations | All **18** specified wrappers retain exports and replacement-bearing deprecation tags |
| Consumer bundle | Route-only bundle is **7,919 unminified bytes**; unused same-resource functions, React, stores, and root listener are excluded |
| Initialization | Route-only bundle reads document Env; root import retains a functional message listener |
| Focused Biome | Passed for 102 changed source/config files |
| Focused consumer regressions | Sharing candidates, automation progress, and partial tool event tests passed |

Consumer type checks used each package's compiler configuration and compared current
SDK declarations with declarations emitted from the starting git HEAD, without
replacing the workspace build. There are **zero introduced diagnostics** across
client, playground, automation, collaboration, and CLI. Existing diagnostics remain:

| Consumer | Existing diagnostics after this change |
| --- | ---: |
| Client | 289 |
| Playground | 2 (`room.teamwork` test references) |
| Automation | 28 |
| Collaboration | 13 |
| CLI | 0 |

Shared code has no diagnostics in client/playground configurations; its 12 strict
audit-log diagnostics included in automation's count are unchanged from baseline.

Focused coverage includes JDBC bodies and formats, directory mappings, omission
versus null, pipeline/agent contracts, authentication/CSRF/session lifecycle,
legacy helper compatibility, and consumer handling of partial events. The export
check rebundles real public imports, executes route-only document initialization,
and verifies the root listener independently. These are source audits, mocked
tests, and local builds/type checks, not live backend integration or browser
visual/keyboard verification.
