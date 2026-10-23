# @semoss/sdk

`@semoss/sdk` provides SEMOSS API wrappers, insight/room state, and optional React
bindings. Import core APIs from `@semoss/sdk`; import React hooks and providers
from `@semoss/sdk/react`.

## Getting Started:

Install the SDK using a package manager:

```sh
npm install @semoss/sdk
```

An insight is a temporary backend workspace for interacting with models, storage,
and databases. Configure the backend URL (or use the host's injected environment)
and initialize an insight in your application's browser lifecycle:

```ts
import { Env, Insight } from "@semoss/sdk";

Env.update({ MODULE: "/Monolith" });
const insight = new Insight();
await insight.initialize();
```

`initialize(options?)` accepts `app?: string | false`, `insightId?: string`,
`disableRoom?: boolean` (default `false`), and optional Python setup shown below.
It is declared to return a promise of `{ tool: MCPToolRequest | null }`, but the
current implementation can catch setup failures and return `null`. Earlier setup
work can also reject. Awaiting initialization alone does not prove readiness:
inspect `insight.isReady`, `insight.isAuthorized`, and `insight.error`, and route to
your login/error UI as appropriate. Use the public `insight.insightId` getter,
not private store state.

Before actions requiring a ready insight:

```ts
function requireReadyInsight(): void {
    if (!insight.isReady) {
        throw insight.error ?? new Error("Authenticate and initialize the insight first");
    }
}
```

Concurrent initialization calls share setup; calling again after completion
reinitializes the instance. Await `insight.destroy()` when its owning application
lifecycle ends. Core stores do not require React, but this does not guarantee
Node/SSR support for all browser-dependent SDK APIs.

## HTTP Requests

`post(path, body, options?)` form-encodes object payloads and sets a single
`application/x-www-form-urlencoded` content type; callers do not need to set it.
Request headers may be a record, a `Headers` instance, or a list of name/value
pairs. POST header names are normalized case-insensitively without mutating the
caller's headers, and authentication and CSRF headers are still applied.

For a `FormData` body, omit `Content-Type` so Fetch can generate the multipart
boundary. The SDK does not add a content type for `FormData`.

Failed POST requests throw `HttpError`, an `Error` with the HTTP `status` and
parsed response `data` (`unknown`; `null` when the response is not valid JSON).
Error messages still use the backend's message when available, otherwise the
HTTP status. A JSON `null` error response also uses the status fallback.

## REST Endpoints

Typed resources are exported directly from the SDK, with servlet-relative subpaths:

```ts
import { Env, runPixel } from "@semoss/sdk";
import { ApiError, type RequestOptions } from "@semoss/sdk/api";
import { getProjects } from "@semoss/sdk/api/monolith/auth/admin/project";
import { installations } from "@semoss/sdk/api/github";
import { apps } from "@semoss/sdk/api/github/manifest";

Env.update({ MODULE: "/Monolith" });
const projects = await getProjects({ filterWord: "sales", limit: 20 });
const result = await runPixel<[string]>("SomePixel();", "insight-id");
```

Other servlet entries are `/api/msgraph`, `/api/adminconfig`, `/api/health`, and
`/api/token`. Each resource function is `(params, options?) => Promise<body>`;
`RequestOptions` provides `signal` and `headers`. Route-only imports read the document's
`semoss-env` tag, share the transport, and exclude unrelated routes, stores, React,
and the root listener from consumer bundles.

All settings come from `Env`. CSRF handling remains opt-in with `Env.CSRF` or
`CSRF.isEnabled`; Node cookie tracking remains opt-in with `Env.HEADLESS`. Typed
routes and root HTTP helpers share login cookies and CSRF tokens. Bearer credentials
win over access/secret credentials and caller Authorization headers. Effective
connection changes and full logout clear session state; unrelated updates preserve it.
Browser authentication redirects honor `Env.REDIRECT_URL`.

Failed route calls throw `ApiError` (`status`, parsed `data`, `endpoint`), or the
route `UnauthorizedError` after browser redirect handling. Both are exported from
`@semoss/sdk/api`. Root `get`/`post` still return `{ response, data }`, use their
existing encoding/error contracts, and export mutable `CSRF`.

Within the SDK source, `lib/` owns public helper implementations and route contracts;
`utility/` owns internal transport support. Consumers continue to use the documented
root, React, and API imports.

### Upgrading

The standalone `@semoss/monolith` package, `ApiClient`, `ApiSettings`, and the old
`@semoss/sdk/monolith` exports have been removed. Use `Env.update` for configuration
and replace `@semoss/sdk/monolith/api/<resource>` with
`@semoss/sdk/api/monolith/<resource>`. Other servlets move from
`@semoss/sdk/monolith/<servlet>` to `@semoss/sdk/api/<servlet>`. These are breaking
import and configuration changes.

`runPixel` remains a root export with the same positional arguments, generic tuple,
and normalized result. Its implementation is `src/lib/pixel.ts`. Thin legacy REST
wrappers remain callable with declaration deprecations:

| Legacy root export | Replacement resource function |
| --- | --- |
| `runPixelAsync`, `console`, `getPixelJobStreaming`, `partial` | `runPixelAsync`, `console`, `pixelJobStreaming` from `/api/monolith/engine` (`partial` also uses `pixelJobStreaming`) |
| `pollAgentRun` | `agentRunStreaming` from `/api/monolith/engine` |
| `login`, `loginLDAP`, `confirmOTP` | `login`, `loginLDAP`, `loginLinOTP` from `/api/monolith/auth` |
| `logout`, `logoutProvider` | `logout({ provider })` from `/api/monolith/auth` (`"ALL"` for full logout) |
| `getUserProjectPermission`, `getUserEnginePermission` | Same named function from `/api/monolith/auth/project` or `/engine` |
| `propagateUserPermissions` | `propagateProjectDependencyPermissions` from `/api/monolith/auth/project` |
| `upload`, `uploadInsight`, `uploadApp`, `uploadEngine`, `uploadUser` | `baseUpload`, `baseUpload`, `projectAssetsUpload`, `engineAssetsUpload`, `userAssetsUpload` from `/api/monolith/upload-file` |

Routes take object parameters and return raw backend bodies. Higher-level configuration,
normalization, authentication orchestration, chat, stores, and hooks remain supported.

#### Corrected resource contracts

The following corrections can require request or type changes when migrating from
the old REST package. Raw resources leave fields absent when the backend's Gson
serializer omits them; legacy helpers normalize only their established SDK results.

| Area | Consumer impact |
| --- | --- |
| JDBC POST | JSON/CSV endpoints send raw SQL text with `insightId` in the query. JSON frames return `columns` and `data`, or R `dataArray`; Python SELECT may include `index`. An HTTP 200 response can contain an error string. Binary JDBC returns an opaque FST blob. |
| GitHub installations | `account`, `accountType`, and `repositorySelection` are optional when database metadata is null. Installation id and suspension remain present. |
| Directory lookup | Microsoft Graph configuration can omit fields or change their types, so configurable raw fields remain `unknown`. Legacy permission candidates validate id/type and optional display fields without assigning a permission. |
| Engine catalog | `engine_tool_app` is an optional project-id string, not a boolean. Favorites, permissions, and nullable fields follow the backend response shape. |
| Pipeline | Pipeline and parsing results use structured types. Noun values, custom options, frame metadata, and layout positions remain dynamic. |
| Agent runs | Handle progress events, optional room ids, partial tool fields, and workflow/artifact/review evidence. Raw approval fields can be omitted; legacy poll/get/stop helpers normalize nullable fields and the pending-action array. |
| Usage limits | Limit types and billing sources use finite unions; `DIRECT` and `ALL_MODELS` refer to user id/type. Model usage can contain optional billing sources, rules, model-total ceilings, capped status, and reset times. An omitted limit update differs from an explicit null limit. |
| A2A | Null response ids are omitted; state and role enums retain the backend's Java names. JSON and SSE calls negotiate the corresponding response producer. |
| Authentication | Credential login/logout routes default `disableRedirect` to `true`. Access-token provider maps represent null profile values as the string `"null"`. |
| Microsoft Graph | Omitted or nonpositive subscription minutes use the resource maximum; positive values are clamped between 45 minutes and that maximum. Recorded database fields may be omitted; upstream payload extensions remain dynamic. |
| Upload compatibility | Legacy wrappers encode ids and paths and omit a null insight id. `upload` returns records directly; the other upload helpers retain `{ response, data }`. |
| Legacy routes | Form and old-engine functions and the legacy MCP SSE variant carry deprecations. The legacy permission helpers retain their admin argument for compatibility but use the ordinary permission routes because no admin variant exists. |

Pixel outputs, playsheet/function results, provider mappings, tool arguments and
metadata, model protocol extensions, and MCP method-specific results can remain
dynamic. Check each resource's documented contract before narrowing those values.

## Typed Pixel calls

`buildPixel` builds one built-in reactor call as a primitive string. Reactor names,
parameters, and audited successful outputs come from the synced backend catalog.
The string works with both `runPixel` and `usePixel` without a separate transport:

```ts
import { buildPixel, runPixel } from "@semoss/sdk";

const result = await runPixel(buildPixel("GetProjectList"), "insight-id");
const projects = result.pixelReturn[0]?.output;
// projects is an array of project records, or undefined when there is no entry.

const total = await runPixel(buildPixel("SUM", [10, 20, 30]));
// total.pixelReturn[0].output is a number on success.

const checkout = await runPixel(buildPixel("EngineGitCheckout", {
    engine: "engine-id",
    branch: "main",
}));
const changedFiles = checkout.pixelReturn[0].output.status.staged;
// changedFiles contains { path: string; status: string } records.
```

Named parameters use objects; positional parameters use arrays. Required fields
are required by the contract. Known parameter keys offer autocomplete; unknown
names and excess object-literal properties are type errors. The builder also
rejects unknown reactor names and invalid identifiers at runtime, but does not
perform backend permission checks or full runtime parameter-schema validation.
Source-derived contracts require an explicit parameter object or array until
omission has been verified; their remaining field-level gaps are recorded below.

```ts
buildPixel("FrameHeaderExists", { column: "revenue" });
buildPixel("GetProjectMetadata", {
    project: "project-id",
    metaKeys: ["description", "tag"],
});
buildPixel("LLM", {
    engine: "model-id",
    command: "Summarize this report",
    paramValues: { temperature: 0.3 },
});
```

Frame operations require the appropriate frame in the insight. Some operations
have different implementations for different frame types; their contract notes
describe supported argument forms. Source-derived contracts whose execution or
wire shapes still need verification are explicitly marked in their declarations
and the internal [contract audit gaps](./src/lib/reactors/contract-gaps.json). Dynamic
or unverified outputs remain `unknown`; a catalog entry is not a guarantee that
the deployment enables the corresponding backend capability. Types describe
top-level built-in calls. Project overrides can replace those implementations;
nesting expressions inside a query can also select different reactor behavior.

Output inference follows each implementation through its helper methods and wire
serializers. For example, `WorkListItems` exposes `items`, `total`, `fyiCount`, and
`automatedSkippedCount`; `BrainGetSettings` exposes `memory.use` and
`assistantSkills`; and `Select` exposes typed selector and filter records. Nullable
database results remain nullable, and fields omitted by Gson remain optional.
The private `*-output-evidence.json` files record the concrete producers and
remaining dynamic or unverified leaves independently of parameter audit status.

Strings are always literal data. Use `rawPixel` for trusted column references,
comparisons, relationships, and nested operations:

```ts
import { buildPixel, rawPixel } from "@semoss/sdk";

buildPixel("Select", [rawPixel("department"), rawPixel("Sum(cost)")]);
// Select(department,Sum(cost));

buildPixel("Filter", [rawPixel('status == "active"')]);
buildPixel("Join", [rawPixel("(a, inner.join, b)")]);
```

These three query builders expose positional forms. Their inherited named `qs`
merging can return other query-struct subtypes; use an ordinary Pixel string for
that form until its input-dependent output contract is audited.

Raw values contain one expression fragment without a statement terminator.
`rawPixel` checks for nonempty text but does not sanitize it or parse its grammar.
Use ordinary strings for user-provided text. Named scalar values become noun
arrays; named arrays supply multiple noun values. The serializer preserves empty
values and null, omits undefined map fields, and rejects cycles, sparse arrays,
undefined array entries, unsupported objects, and nonfinite numbers. It escapes
strings for Pixel's lexer and encoding preprocessor and expands exponent notation.
Whole numbers outside the signed 32-bit range use decimal literals to avoid
backend integer truncation; negative zero is emitted as `-0.0`.
Arrays supplied as individual values use `Vector(...)`, because brackets outside
maps otherwise flatten their contents into the current argument row. Arrays inside
maps remain JSON-style arrays; empty and singleton vectors keep their identity.

In React, inferred output types flow into `data`, initial values, callbacks, and
`update`. Empty strings retain the hook's existing disable behavior:

```tsx
import { buildPixel } from "@semoss/sdk";
import { usePixel } from "@semoss/sdk/react";

function useProjects(isEnabled: boolean, insightId?: string) {
    return usePixel(
        isEnabled ? buildPixel("GetProjectList") : "",
        {
            data: [],
            onSuccess(projects) {
                console.log(projects.map((project) => project.project_id));
            },
        },
        insightId,
    );
}

function useWorkItems(insightId?: string) {
    return usePixel(buildPixel("WorkListItems", {}), {
        data: { items: [], total: 0, fyiCount: 0, automatedSkippedCount: 0 },
        onSuccess(page) {
            console.log(page.total, page.items.map((item) => item.title));
        },
    }, insightId);
}
```

`usePixel` retains its first-result selection, status, refresh, local update,
callback, and insight-context behavior. Rebuilding the same string during render
does not itself refetch. Initial data can be unavailable before success when it
is omitted, as before; read status before using the result. Use hooks for reads
and execute mutations from event handlers.

Existing `runPixel<[MyOutput]>(pixel)` and `usePixel<MyOutput>(pixel)` calls remain
supported and override inferred output types. Inference describes expected
successful output, not runtime response validation: `runPixel` still collects
Pixel errors and retains all entries, including delayed messages. Converting a
built string to a plain `string`, interpolating it, or joining multiple statements
loses its type metadata. Custom reactors and complete Pixel programs continue to
work through ordinary string calls. Only `buildPixel` and `rawPixel` are new
public exports; catalog and support types stay internal.

Contributors maintain the catalog through the `reactors` target in the root
`semoss-sync.json` and the [sync skill](../../skills/semoss-sync.skill.md).

## React API Requests

`useAPI` from `@semoss/sdk/react` runs a typed API function and exposes the same
`status`, `data`, `error`, `refresh`, and `update` structure as the client's hook.
Pass the method followed by its arguments in one tuple, just like the client:
`useAPI([method, arg1, arg2], config)`. Both the arguments and response are typed
from the method, without needing a `useCallback` wrapper:

```ts
import { getProjects } from "@semoss/sdk/api/monolith/auth/admin/project";
import { useAPI, type UseAPIResult } from "@semoss/sdk/react";

function useProjectSearch(
    filterWord: string,
    isEnabled: boolean,
): UseAPIResult<Awaited<ReturnType<typeof getProjects>>> {
    return useAPI(
        isEnabled ? [getProjects, { filterWord, limit: 20 }] : null,
    );
}
```

The response type is inferred from the function. Status is `INITIAL`, `LOADING`,
`SUCCESS`, or `ERROR`; `data` is optional and `error` is an `Error` on failure.
Passing `null` skips the request and resets to `INITIAL`. Use this hook for reads;
call mutations from event handlers.

The optional second argument accepts `data`, `onSuccess(data)`,
`onError(initialData, error)`, and `onFinal()`. Initial `data` is captured on mount
and restored when disabled; loading and error states clear it, matching the
client hook. Callback changes use the latest callbacks without refetching.
`refresh()` reruns the current request; `update(data)` replaces local data and
clears the error without fetching or changing status.

Changing the method or argument values starts a new request. Inline arrays and
plain objects are compared by value; other objects (such as `AbortSignal`,
`FormData`, and `File`) and functions are compared by identity. Arguments are
passed through unchanged. Treat them as immutable and keep object instances
such as signals stable across renders.

No-argument methods also support `useAPI(method, config)`. Existing memoized
callbacks remain supported; an inline function creates a new request on every
render. Each invocation owns its own state without shared caching. Results and
callbacks from superseded or unmounted requests are ignored; the underlying
transport is not aborted.

## LinOTP Authentication

Use the SDK's `loginOTP(username, pin)` orchestration to start a challenge. The
legacy `confirmOTP(otp)` remains callable but is deprecated in favor of
`loginLinOTP({ otp })` from `@semoss/sdk/api/monolith/auth`.

`loginOTP` starts the challenge without creating a signed-in session. It returns
`true` when the challenge is accepted, or `false` only when HTTP 401 reports the
boolean flag `requirePwdChange: true`. A string-valued flag or a flag on a server
error does not produce a password-change outcome; those failures reject with
`HttpError`. Handle `false` by requesting a password change, not by showing the
OTP entry field.

`confirmOTP` submits the code and returns `true` on success; an invalid code
rejects with the backend's error message. Refresh the application's session
configuration after successful confirmation, not after starting the challenge.

## Common Actions

-   Login or Logout

```ts
const login = async (username: string, password: string) => {
    const success = await insight.actions.login({
        type: "native",
        username,
        password,
    });
    return success && insight.isReady;
};

const loginWithOauth = async (provider: string) => {
    const success = await insight.actions.login({ type: "oauth", provider });
    return success && insight.isReady;
};

const logout = async () => insight.actions.logout();
```

Login and logout return booleans, not `{ output }`. Inspect failed results and
`insight.error`; supported OAuth providers depend on the server configuration.

-   Know what the session is signed in to

`Logins` holds the session's logins for the whole page, so every insight and
view sees the same answer. The insight fills it from the config when it loads
and after each login, and resets it on logout. Read it again, sign in to one more provider,
or sign one out with its actions; in React, `useLogins()` reads it again when a
view mounts and whenever the window regains focus.

```ts
import { Logins } from "@semoss/sdk";

const { logins, primaryLogin, status } = Logins.getSnapshot(); // logins: { NATIVE: "Ada" }
await Logins.refresh(); // reuses a read younger than 30 seconds
await Logins.connect("MICROSOFT"); // from a click: opens a fresh sign in popup
await Logins.disconnect("MICROSOFT"); // never the session's own login
```

`connect` throws `PopupBlockedError` when the browser blocks the popup, and
`disconnect` throws `SessionLoginDisconnectError` for the login the session
belongs to.

-   Ask an LLM and return a result

```ts
const ask = async (modelEngineId: string, question: string) => {
    requireReadyInsight();
    const { output } = await insight.actions.askModel(modelEngineId, question);
    return output.response;
};
```

For rooms and streaming, use the [SDK chat guide](./skills/sdk-chat/SKILL.md).
It covers AskRoom jobs, RunAgent runs, bounded observation, approvals, and known
managed-store limitations. The old `partial(insightId)` API is deprecated; do not
use insight IDs as job IDs or reuse chat polling for agent runs.

-   Run a database query

```ts
const getMovies = async (databaseId: string) => {
    requireReadyInsight();
    const { output } = await insight.actions.queryDatabase(
        databaseId,
        "select * from movie",
        { collect: 100 },
    );
    return output;
};
```

The query's optional third argument defaults to `{ collect: -1 }`; use a bounded
collection size when appropriate. Validate backend output before rendering it.

-   Run Python

```ts
const sum = async (first: number, second: number) => {
    requireReadyInsight();
    const { output } = await insight.actions.runPy<unknown>(`${first} + ${second}`);
    return output;
};
```

-   Upload a File

```ts
const uploadFile = async (file: File, path: string) => {
    requireReadyInsight();
    return insight.actions.uploadInsight(path, file);
};
```

`uploadInsight(path, files)` accepts `File | File[]` and returns upload records
directly, not `{ output }`. It replaces the deprecated `actions.upload(files, path)`.

-   Download a File

```ts
const downloadFile = async (path: string) => {
    requireReadyInsight();
    return insight.actions.download(path);
};
```

`actions.download(path)` returns `Promise<boolean>`, not `{ output }`.

-   Run an MCP tool

```ts
const runTool = async (name: string, parameters: Record<string, unknown>) => {
    requireReadyInsight();
    const { output } = await insight.actions.runMCPTool(name, parameters);
    return output;
};
```

Initialize with the owning `app` ID (or host-provided `Env.APP`) before using this
action. It returns a string output and forwards a response to the parent room only
when `Env.TOOL` is present. It is not the agent approval API; use the
[guide's approval lifecycle](./skills/sdk-chat/SKILL.md#approvals-and-child-runs).

## Testing

This package uses [Vitest](https://vitest.dev/) for source unit tests and a separate
build integration suite.

### Running Tests

```sh
# run SDK source unit tests once from this monorepo
pnpm --filter @semoss/sdk test

# run in watch mode
pnpm --filter @semoss/sdk test:watch

# run with coverage
pnpm --filter @semoss/sdk test:coverage

# build the production SDK and run build integration tests
pnpm --filter @semoss/sdk test:integration
```

The ordinary test, watch, and coverage commands include only source unit tests.
`test:integration` first builds the production SDK, then runs the separate suite
under `tests/integration/`. It creates temporary consumer bundles to verify public
exports, declarations, tree shaking, and initialization, and cleans them up after
the run. These checks use local build artifacts and do not call a live backend.

### What's Tested

| Area | Files | Notes |
|---|---|---|
| Transport | [base.test.ts](./src/api/base.test.ts) | Pixel job submission, polling, and result handling |
| Agent state | [agent.store.test.ts](./src/stores/agent/agent.store.test.ts) | Item accumulation, ordering, reconciliation, failure caps, and local abort |
| Insight state | [insight.store.test.ts](./src/stores/insight/insight.store.test.ts) | Initialization and room binding |
| Environment | [env.test.ts](./src/env.test.ts) | Environment configuration |
| Build integration | `tests/integration/exports.test.ts` (monorepo) | Public exports, declarations, consumer tree shaking, and initialization |

These are local mocked tests, not proof of deployed backend compatibility.

### Writing Tests

Name SDK tests `*.test.ts`. Place source unit tests next to the source file they
cover, e.g.:

```
src/lib/fetch.ts
src/lib/fetch.test.ts
```

Build integration tests belong under `tests/integration/` and run through
`vitest.integration.config.ts` after the production build.

## 🔄 Migration Guide

### For Users Migrating from @semoss/sdk-react

If you are a user migrating from [@semoss/sdk-react] to [@semoss/sdk], this section will help you with the transition.

#### Key Change

-   React hooks, contexts, and utilities have been moved to our centralized javascript software development kit

#### Migration Steps

1. Uninstall the old package `@semoss/sdk-react`
2. Swap import statements, any module that was once imported from `@semoss/sdk-react` can now be imported from `@semoss/sdk/react`

Eg.

```
import { useInsight } from '@semoss/sdk-react'
```

Should now import as such:

```
import { useInsight } from '@semoss/sdk/react'
```

## Tips and Tricks

Here are a few tips and tricks that can help streamline the development process.

### Development Environment

> Note: We recommend manually setting the environment only in `development` mode.

You can setup a development environment and use access keys to authenticate with the app server. Generate the keys on the server and then update the `Env` module. See:

```js
// import the module
import { Env } from "@semoss/sdk";

// update the environment
Env.update({
    /**
     * Url pointing to the app server
     **/
    MODULE: "",
    /**
     * Access key generated by the app server
     **/
    ACCESS_KEY: "",
    /**
     * Secret key generated by the app server
     **/
    SECRET_KEY: "",
    /**
     * Optional field. This will load app specific reactors into the insight. Your app has to be hosted and running on the app server.
     **/
    APP: "",
});
```

Do not commit credentials or embed production secrets in browser bundles. A `.env`
file does not keep a secret private once it is bundled into client JavaScript.
Use the host's supported authentication flow; access-key setup is for controlled
local development only.

### Python

The app server allows you to write custom `python` to power your app. You can initialize your `python` environment by:

1. Loading via `js`

Set the option on initialize:

```ts
// define it int he js
const py = `
def sayHello(name):
    print(f'Hello {name}')
`;

// update the environment
await insight.initialize({
    python: {
        /**
         *  Load the python via js
         **/
        type: "script",
        /**
         *  Path to the file
         **/
        script: py,
        /**
         *  Alias for the file
         **/
        alias: "smss",
    },
});
```

2. Loading via a file

The sdk will load `python` via an external file.

```py
# ./hello.py
def sayHello(name):
    print(f'Hello {name}')
```

Set the option on initialize:

```ts
// update the environment
await insight.initialize({
    python: {
        /**
         *  Load the python via an external file
         **/
        type: "file",
        /**
         *  Path to the file
         **/
        path: "./hello.py",
        /**
         *  Alias for the file
         **/
        alias: "smss",
    },
});
```

Next you can call the preloaded `python` methods by calling the `runPy` action. See

```ts
const hello = async (name: string) => {
    requireReadyInsight();
    const { output } = await insight.actions.runPy<unknown>(
        `smss.sayHello(${JSON.stringify(name)})`,
    );
    return output;
};
```

## AI Coding Assistant Setup

`@semoss/sdk` ships AI agent skills alongside its source code. These skills give your AI
coding assistant (GitHub Copilot, Claude Code, Cursor, etc.) built-in knowledge of the SDK's
APIs, including rooms, chat jobs, and agent runs, without you having to paste
docs into chat.

The canonical [SDK chat guide](./skills/sdk-chat/SKILL.md) is bundled under
`node_modules/@semoss/sdk/skills/sdk-chat/SKILL.md` and follows the
[Agent Skills](https://agentskills.io/) open standard, making them compatible with
[`npm-skills`](https://www.npmjs.com/package/npm-skills) and
[`skills-npm`](https://github.com/antfu/skills-npm).

### One-time extraction

Run extraction into a provider-neutral skills directory after installing the SDK:

```sh
npx npm-skills extract --output skills
```

Root `skills/` is not automatically discovered by every agent. Explicitly route
agents from your project's `AGENTS.md` to the extracted skill documents. Extraction
does not imply a flat filename layout or automatic discovery by every provider.

For contributors to this monorepo only: the maintained flat
[SDK workflow skill](../../skills/sdk-chat.skill.md) routes to the packaged guide.
Follow [the skill index](../../skills/README.md) and
[root routing instructions](../../AGENTS.md#required-skill-routing-all-agents).
External consumers do not need those repository-only documents.

### Keep skills in sync automatically

For consumer projects that treat extracted skills as generated files, add a
`postinstall` script so skills update whenever you upgrade the SDK. The examples
below overwrite matching skill files; do not run them over this repository's
maintained root skills or locally customized guidance without reviewing changes.

```json
{
    "scripts": {
        "postinstall": "npm-skills extract --skip-production --override --output skills"
    },
    "devDependencies": {
        "npm-skills": "latest"
    }
}
```

Or configure the output path once and just run `npm run skills:extract`:

```json
{
    "scripts": {
        "skills:extract": "npm-skills extract --override"
    },
    "npmSkills": {
        "consume": {
            "output": "skills"
        }
    }
}
```

### What gets installed

| Skill | Covers |
|-------|--------|
| `sdk-chat` | Room records/options, managed RoomStore, AskRoom jobs, RunAgent/AgentStore lifecycles, tool approvals, cancellation, and compatibility gaps |

Skills are versioned with the SDK — upgrading `@semoss/sdk` and re-running extraction keeps
your assistant's knowledge current.

## Catalog images

Use the server-assigned engine or project ID after the resource has been created:

```ts
import { uploadEngineImage, uploadProjectImage } from "@semoss/sdk";

const image = await uploadProjectImage(projectId, file); // agents, skills, apps
// image.imageUrl is a download path on the backend origin.
await uploadEngineImage(engineId, file);
```

Both functions send one multipart `file` through the SDK's auth/CSRF transport and
return `CatalogImageUploadResult` (`id`, `name`, `message`, `imageUrl`, `contentType`).
They use `/api/project-{id}/image/upload` and `/api/e-{id}/image/upload`; the backend
must provide these routes and the caller must have edit permission.

`CATALOG_IMAGE_ACCEPT`, `CATALOG_IMAGE_MAX_BYTES`, and
`getCatalogImageValidationError(file)` support client-side file pickers. PNG, JPEG,
and GIF files up to 10 MiB are accepted. The backend also verifies image bytes and
limits decoded images to 25 million pixels. Upload failures reject the promise;
retain the created ID and retry the upload without creating another resource.
