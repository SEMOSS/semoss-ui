# @semoss/sdk

`@semoss/sdk` provides SEMOSS API wrappers, insight/room state, and optional React
bindings. Import core APIs from `@semoss/sdk`; import React hooks and providers
from `@semoss/sdk/react`.

## Getting Started:

Install the SDK using a package manager:

```sh
npm install @semoss/sdk
```

### Session, Config and Insight

Three stores cover an app, each with one job:

| Store | What it is | React |
| --- | --- | --- |
| `Session` | The signed in user: sign in and out, who they are, their metadata, permissions and logins | `useSession`, `useSessionPermissions`, `useLogins` |
| `Config` | The server's metadata: theme, version, flags, meta keys and sign in providers. Needs no session | `useConfig` |
| `Insight` | A workspace the user works in, such as a workbench, room or terminal tab | `InsightProvider`, `useInsight` |

Start the session once, at the app's entry point, then gate the UI on its status:

```ts
import { Env, Session } from "@semoss/sdk";

Env.update({ MODULE: "/Monolith" });
await Session.initialize(); // never rejects; read the status
const { status, user } = Session.getSnapshot(); // "AUTHENTICATED", { name: "Ada", ... }
```

```tsx
import { useConfig, useSession } from "@semoss/sdk/react";

const status = useSession((state) => state.status); // "INITIALIZING" | "UNAUTHENTICATED" | "AUTHENTICATED" | "error"
const name = useSession((state) => state.user?.name);
const version = useConfig((state) => state.config?.version);
```

The user is read from two pixels in one request: `GetUserInfo` gives who they are
on each login, and `GetUserMetadata` gives their metadata as the database holds it
now (`user.meta`, `user.defaultModels`). `Session.reloadUser()` reads the user again
without touching the config, logins or permissions.

Where a pixel runs:

- It needs no workspace and runs once: `runPixel(pixel)` with no insight id. The
  backend makes an insight for it and keeps it until the session ends.
- It needs no workspace and runs again and again (a search, a paged list, a poll):
  `usePixel(pixel)` outside any `InsightProvider`, which runs in `Session.insight`,
  or `Session.insight.run(pixel)`.
- It belongs to a workspace: that workspace's `useInsight().actions.run` or `usePixel`
  inside its `InsightProvider`.
- Several steps must share one insight but belong to no workspace, such as an upload
  and then a pixel that reads the file: the session's own insight, `Session.insight`
  (`run`, `upload`, `download`, or `useSessionInsight()` in React). `run` returns
  `{ errors, pixelReturn }`; it does not throw on pixel errors.

Ask whether the user may act on a resource with `useSessionPermissions(type, id)`
(`permission`, `canEdit`, `isOwner`, `refresh`, `sync`), and whether the config keeps
an operation for admins with `Session.canPerform(resource, operation)`.

### Insights

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
inspect `insight.isReady`, `insight.isAuthorized` and `insight.error`. The insight
follows `Session`: a sign in through `Session` sets it up, and a sign out signs it
out. Sign in through `Session` rather than the insight's deprecated `actions.login`.
Use the public `insight.insightId` getter, not private store state.

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

## LinOTP Authentication

Sign in with LinOTP through the session: `Session.requestOTP(username, pin)` starts
the challenge, then `Session.login({ type: "linotp", otp })` signs in and reads the
new session. They wrap the `loginOTP(username, pin)` and `confirmOTP(otp)` functions,
which are also exported from `@semoss/sdk` and `@semoss/sdk/react`; use them rather
than implementing the LinOTP requests in an application.

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
import { Session } from "@semoss/sdk";

// each resolves to whether a user is signed in, and throws when refused
await Session.login({ type: "native", username, password });
await Session.login({ type: "ldap", username, password });
await Session.login({ type: "oauth", provider }); // from a click: opens a popup

await Session.logout(); // forgets the user, their logins and permissions
```

`login` reads the new session, config included, once it succeeds, so
`useSession((state) => state.status)` moves to `AUTHENTICATED` on its own. The
providers to offer are `useConfig((state) => state.config?.availableProviders)`;
they depend on the server configuration. `insight.actions.login` and
`insight.actions.logout` still work, but are deprecated.

-   Know what the session is signed in to

`Session.logins` holds the session's logins, so every view sees the same answer.
The session fills it from the config when it starts and after each login, and
resets it on logout. Read it again, sign in to one more provider, or sign one out
with its actions; in React, `useLogins()` reads it again when a view mounts and
whenever the window regains focus.

```ts
import { Session } from "@semoss/sdk";

const { logins, primaryLogin, status } = Session.logins.getSnapshot(); // logins: { NATIVE: "Ada" }
await Session.logins.refresh(); // reuses a read younger than 30 seconds
await Session.logins.connect("MICROSOFT"); // from a click: opens a fresh sign in popup
await Session.logins.disconnect("MICROSOFT"); // never the session's own login
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

This package uses [Vitest](https://vitest.dev/) for unit tests.

### Running Tests

```sh
# run all SDK tests once from this monorepo
pnpm --filter @semoss/sdk test

# run in watch mode
pnpm --filter @semoss/sdk test:watch

# run with coverage
pnpm --filter @semoss/sdk test:coverage
```

### What's Tested

| Area | Files | Notes |
|---|---|---|
| Transport | [base.test.ts](./src/api/base.test.ts) | Pixel job submission, polling, and result handling |
| Agent state | [agent.store.test.ts](./src/stores/agent/agent.store.test.ts) | Item accumulation, ordering, reconciliation, failure caps, and local abort |
| Insight state | [insight.store.test.ts](./src/stores/insight/insight.store.test.ts) | Initialization and room binding |
| Environment | [env.test.ts](./src/env.test.ts) | Environment configuration |

These are local mocked tests, not proof of deployed backend compatibility.

### Writing Tests

Place test files next to the source file they cover, e.g.:

```
src/utility/fetch.ts
src/utility/fetch.test.ts
```

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

`@semoss/sdk` ships AI agent skills in its `skills/` folder. They give your coding
assistant (GitHub Copilot, Claude Code, Cursor, etc.) the SDK's APIs without pasting docs
into chat, and they are versioned with the SDK: upgrading the package upgrades them.

### Where the skills are

| Skill | In this package | In an installed app | Covers |
|-------|-----------------|---------------------|--------|
| `sdk-session` | [`skills/session.skill.md`](./skills/session.skill.md) | `node_modules/@semoss/sdk/skills/session.skill.md` | `Session`, `Config` and permissions: sign in and out, the user and their metadata, `useSession`/`useConfig`/`useSessionPermissions`/`useLogins`, and which insight a pixel runs in |
| `sdk-chat` | [`skills/sdk-chat/SKILL.md`](./skills/sdk-chat/SKILL.md) | `node_modules/@semoss/sdk/skills/sdk-chat/SKILL.md` | Room records and options, `RoomStore`, AskRoom jobs, RunAgent/`AgentStore` lifecycles, tool approvals, cancellation, and compatibility gaps |

Start with `sdk-session` for any app: it covers sign in and where pixels run, which the
chat guide assumes.

### Use them in your project

The simplest setup is to route your agents to the files where they are installed. Agents
do not discover `node_modules` on their own, so add the paths to your project's
`AGENTS.md` (or `CLAUDE.md`):

```md
Before working with @semoss/sdk, read:
- node_modules/@semoss/sdk/skills/session.skill.md (sign in, user, config, permissions)
- node_modules/@semoss/sdk/skills/sdk-chat/SKILL.md (rooms, chat, agent runs)
```

To keep copies in your repository instead, extract them with
[`npm-skills`](https://www.npmjs.com/package/npm-skills) (or
[`skills-npm`](https://github.com/antfu/skills-npm)):

```sh
npx npm-skills extract --output skills
```

These tools follow the [Agent Skills](https://agentskills.io/) layout of one folder per
skill with a `SKILL.md`, so they extract `sdk-chat`. `session.skill.md` is a single file at
the top of `skills/`; copy it next to the extracted skills, or keep linking it from
`node_modules` as above. Either way, route your agents to the extracted files from
`AGENTS.md`, since not every agent discovers a root `skills/` folder.

To refresh extracted copies on every install, run the extraction from `postinstall`. It
overwrites matching files, so do not point it at skills you have edited:

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

### In this monorepo

Contributors read the skills in place: [`libs/sdk/skills/`](./skills/) is the source of
truth. The SDK's [`AGENTS.md`](./AGENTS.md#skills) points agents to both, and the repository's
[skill index](../../skills/README.md) links to them too. The flat
[SDK chat workflow skill](../../skills/sdk-chat.skill.md) only routes to the packaged chat
guide; follow the [root routing instructions](../../AGENTS.md#required-skill-routing-all-agents).
External consumers do not need these repository-only documents.

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
