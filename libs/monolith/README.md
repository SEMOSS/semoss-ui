# @semoss/monolith

Typed, documented functions for every SEMOSS (Monolith) REST endpoint. They work
in Node (20+) and the browser, with no dependencies.

This package is source only. `@semoss/sdk` compiles and bundles it, and
publishes it: every route from `@semoss/sdk/monolith/<route>`, and `ApiClient`,
`ApiError` and `UnauthorizedError` from `@semoss/sdk/monolith`. Import it from
there, never from `@semoss/monolith`, so a page has one `ApiClient`.

> **Status:** the routes can be called from any app. The SDK's own functions and
> the apps have not moved onto them yet; the remaining steps are in
> [AGENTS.md](./AGENTS.md#integrating-into-the-sdk-and-the-apps).

The package version mirrors the SEMOSS backend release it was synced against
(`5.5.0-snapshot` until SEMOSS publishes), and is updated with the
[sync skill](../../skills/semoss-sync.skill.md).

## Usage

```ts
import { Env } from "@semoss/sdk";
import { ApiError } from "@semoss/sdk/monolith";
import { getProjects } from "@semoss/sdk/monolith/api/auth/admin/project";
import { runPixel } from "@semoss/sdk/monolith/api/engine";

// once, at startup: Env.update configures ApiClient's base path and credentials
Env.update({ MODULE: "/Monolith" });

const projects = await getProjects({ filterWord: "sales", limit: 20 });

try {
	await runPixel({ expression: "1+1;" }, { signal: AbortSignal.timeout(30_000) });
} catch (error) {
	if (error instanceof ApiError) {
		console.log(error.status, error.message, error.endpoint);
	}
}
```

**Import paths:**
- Each backend resource has its own import path, and it is the resource's full URL: `/api/auth/admin/project/*` is imported from `@semoss/sdk/monolith/api/auth/admin/project`, and `/health/*` from `@semoss/sdk/monolith/health`.
- Only what you import is bundled.

**Function shape:** every function is `(params, options?) => Promise<body>`, where the body is the parsed response (a `Blob`, text or a stream for the few routes typed that way), not a `fetch` `Response`.
- `params` holds the endpoint's query, form or path parameters.
- `options` is `{ signal?, headers? }`.
- Every function is documented with JSDoc, including what it does, each parameter and the response.

**Errors:** a non-2xx response throws `ApiError` (`status`, `data` = the parsed
error body, `endpoint`). When the server redirects the client, usually because
the session expired, `onRedirect` runs and the call throws `UnauthorizedError`,
an `ApiError`.

## Node

```ts
import { Env } from "@semoss/sdk";

Env.update({
	MODULE: "http://localhost:8080/Monolith", // absolute in Node
	ACCESS_KEY: process.env.ACCESS_KEY,
	SECRET_KEY: process.env.SECRET_KEY,
});
```

Node has no cookie store, so the client keeps the session cookie itself. This is
on by default outside the browser (`cookies: true`).

## Settings

`Env.update` from `@semoss/sdk` is how an app configures the connection: every update
sets the base path (`MODULE`) and the credentials (`ACCESS_KEY` / `SECRET_KEY`, or an embed
host's `BEARER_TOKEN`). `ApiClient.configure()` from `@semoss/sdk/monolith` is the escape
hatch for what `Env` does not cover, such as `headers`, `credentials` or `onRedirect`;
omitted keys keep their value. Changing `basePath` or `auth` to a new value clears the CSRF
token and cookies; passing the same values again keeps them.

| Setting | Default | |
|---|---|---|
| `basePath` | `Env.MODULE` | Context root of the server |
| `csrf` | `true` (`Env.CSRF` doesn't apply) | Fetch the CSRF token once (`/api/config/fetchCsrf`) and send it on writes. It's re-fetched once if the server rejects it. Harmless when the server has CSRF off |
| `credentials` | `"same-origin"` | `fetch` credentials mode |
| `auth` | from `Env` | `{ type: "basic", accessKey, secretKey }` or `{ type: "bearer", token, provider? }` |
| `headers` | `{}` | Extra headers sent with every request |
| `cookies` | `true` outside the browser | Keep and resend cookies manually |
| `onRedirect` | `window.location.replace` (to `Env.REDIRECT_URL` when set) in the browser | Called when the server redirects (expired session) |

**Other `ApiClient` members:**
- `ApiClient.settings` reads the current settings.
- `ApiClient.clear()` forgets the CSRF token and cookies. Logging out does this automatically.
- `ApiClient.reset()` restores monolith's own defaults and clears the session, which is useful in tests. Those are not the SDK's: `basePath` goes back to `"/Monolith"`, `auth` to `null` and `onRedirect` to a plain `window.location.replace`, so the routes ignore `Env.MODULE` and `Env.REDIRECT_URL` until configured again. Afterwards, call `ApiClient.configure` with what you need, or any `Env.update`, which re-applies `MODULE` and the credentials.

**Cross-origin browser apps:** Monolith's CORS setup doesn't allow credentials or expose `X-CSRF-Token`. A browser page on another origin therefore can't use a session or CSRF. Same-origin pages and Node are fine.

## Maintenance

See [AGENTS.md](./AGENTS.md) for the layout and the endpoint template, and
[ISSUES.md](./ISSUES.md) for the outstanding front-end tasks.
