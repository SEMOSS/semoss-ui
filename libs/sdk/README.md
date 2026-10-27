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

## Generated API and Pixel examples

The selected backend contracts generate TypeScript for `@semoss/sdk`. Descriptions,
wire types, required inputs, policies, and invocation conventions come from SEMOSS
and Monolith. The first examples are readiness and cancellation.

```ts
import { ready } from "@semoss/sdk/api/health";
import { buildPixel, runPixel } from "@semoss/sdk";

const health = await ready();
// health.status: "READY" | "NOT_READY"; health.startupComplete: boolean

// Run cancellation in an event handler, after the user requests it.
async function cancelJob(jobId: string, insightId: string): Promise<string> {
    const result = await runPixel(
        buildPixel("StopPixelExecution", { id: jobId }),
        insightId,
    );
    if (result.errors.length) throw new Error(result.errors.join(", "));
    const message = result.pixelReturn[0]?.output;
    if (message === undefined) throw new Error("Cancellation returned no message");
    return message; // string, inferred from @Returns
}

// The backend also declares this positional form:
const cancellation = buildPixel("StopPixelExecution", ["job-id"]);
```

`ready(params = {}, options?)` uses the shared Env/auth/CSRF transport. Options
accept `signal` and `headers`. Non-2xx responses throw `ApiError` from
`@semoss/sdk/api`; readiness 503 retains its body in `error.data` (unknown until
validated). `ReadyResponses` from the health entry maps both 200 and 503 to their
backend-declared body type. The generator preserves the declared enum/boolean
shape without inventing a status-to-literal correlation.

`buildPixel` returns a primitive string carrying the reactor's inferred output
for `runPixel` and `usePixel`. Named scalar values become noun arrays; a top-level
array supplies positional arguments. Strings are escaped literals. Use `rawPixel`
only for trusted expression fragments. Required `id` and argument omission follow
the backend contract. Explicit `runPixel`/`usePixel` generics and ordinary Pixel
strings retain their existing behavior; the builder is not runtime validation.

Only `StopPixelExecution` is currently in the generated builder catalog. The old
manual catalog and route modules have been removed. Existing root helpers, stores,
and React hooks remain available for operations that have not been annotated.

Contributors: the generator lives in [`src/script`](../../src/script/README.md).
Run it against compiled backend checkouts:

```sh
pnpm --filter @semoss/sdk generate --semoss /path/to/Semoss --monolith /path/to/Monolith
pnpm --filter @semoss/sdk generate:check --from-contracts
```

The second command verifies the checked-in TypeScript against its JSON snapshot
without Java. Use `generate:check` with backend paths to verify live source agreement.
Each successful live `generate` saves its UTC `lastSyncedAt` and contract snapshot
hash in [semoss-sync.json](../../semoss-sync.json). Checks, failed runs, and snapshot
replays preserve the last backend sync time. Do not edit generated files by hand.

## React API Requests

`useAPI` from `@semoss/sdk/react` runs a typed API function and exposes the same
`status`, `data`, `error`, `refresh`, and `update` structure as the client's hook.
Pass the method followed by its arguments in one tuple, just like the client:
`useAPI([method, arg1, arg2], config)`. Both the arguments and response are typed
from the method, without needing a `useCallback` wrapper:

```ts
import { ready } from "@semoss/sdk/api/health";
import { useAPI, type UseAPIResult } from "@semoss/sdk/react";

function useReadiness(
    isEnabled: boolean,
): UseAPIResult<Awaited<ReturnType<typeof ready>>> {
    return useAPI(isEnabled ? [ready, {}] : null);
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

The existing root `loginOTP(username, pin)` and `confirmOTP(otp)` helpers remain
available. See their [implementation and return contracts](./src/api/auth.ts).
An OTP challenge is not a signed-in session; refresh session configuration after
successful confirmation.

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
managed-store limitations. The old `partial(insightId)` API remains separate; do not
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

# generator fixtures (no backend needed)
pnpm --filter @semoss/sdk test:generator

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

Use `uploadProjectImage(projectId, file)` or `uploadEngineImage(engineId, file)`
from `@semoss/sdk` after creation returns the saved resource ID. These helpers
validate local file metadata and the returned resource ID and use the shared
multipart transport. `getCatalogImageValidationError`, `CATALOG_IMAGE_ACCEPT`,
and `CATALOG_IMAGE_MAX_BYTES` support picker validation. See
[the helper contracts](./src/api/image.ts) for details.
