# @semoss/monolith

Typed, documented functions for every SEMOSS (Monolith) REST endpoint. They work
in Node (20+) and the browser, with no dependencies.

The package version mirrors the SEMOSS backend release it was synced against.
It stays private (`5.5.0-snapshot`) until SEMOSS publishes, and is updated with
the [sync skill](../../skills/semoss-sync.skill.md).

## Usage

```ts
import { ApiClient, ApiError } from "@semoss/monolith";
import { getProjects } from "@semoss/monolith/api/auth/admin/project";
import { runPixel } from "@semoss/monolith/api/engine";

// once, at startup
ApiClient.configure({ basePath: "/Monolith" });

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
- Each backend resource has its own import path, and it is the resource's full URL: `/api/auth/admin/project/*` is imported from `@semoss/monolith/api/auth/admin/project`, and `/health/*` from `@semoss/monolith/health`.
- Only what you import is bundled.

**Function shape:** every function is `(params, options?) => Promise<Response>`.
- `params` holds the endpoint's query, form or path parameters.
- `options` is `{ signal?, headers? }`.
- Every function is documented with JSDoc, including what it does, each parameter and the response.

## Node

```ts
ApiClient.configure({
	basePath: "http://localhost:8080/Monolith", // absolute in Node
	auth: { type: "basic", accessKey: process.env.ACCESS_KEY, secretKey: process.env.SECRET_KEY },
});
```

Node has no cookie store, so the client keeps the session cookie itself. This is
on by default outside the browser (`cookies: true`).

## Settings

Passed to `ApiClient.configure()`; omitted keys keep their value.

| Setting | Default | |
|---|---|---|
| `basePath` | `"/Monolith"` | Context root of the server |
| `csrf` | `true` | Fetch the CSRF token once (`/api/config/fetchCsrf`) and send it on writes. It's re-fetched once if the server rejects it. Harmless when the server has CSRF off |
| `credentials` | `"same-origin"` | `fetch` credentials mode |
| `auth` | `null` | `{ type: "basic", accessKey, secretKey }` or `{ type: "bearer", token, provider? }` |
| `headers` | `{}` | Extra headers sent with every request |
| `cookies` | `true` outside the browser | Keep and resend cookies manually |
| `onRedirect` | `window.location.replace` in the browser | Called when the server redirects (expired session) |

**Other `ApiClient` members:**
- `ApiClient.settings` reads the current settings.
- `ApiClient.clear()` forgets the CSRF token and cookies. Logging out does this automatically.
- `ApiClient.reset()` restores the defaults, which is useful in tests.

**Cross-origin browser apps:** Monolith's CORS setup doesn't allow credentials or expose `X-CSRF-Token`. A browser page on another origin therefore can't use a session or CSRF. Same-origin pages and Node are fine.

## Planned: `useAPI`

The SDK will add a React hook on top of these functions. Nothing is implemented yet:

```ts
const { status, data, error, refresh } = useAPI(getProjects, { filterWord }, { enabled });
```

- The hook takes the function itself, not a string name. That keeps types inferred (`Parameters<F>[0]` and `Awaited<ReturnType<F>>`) and keeps tree-shaking working.
- It caches by function plus serialized `params`, and passes an `AbortSignal` through `options.signal`.
- It returns the same `{ status, data, error, refresh }` shape as `usePixel`.

## Maintenance

See [AGENTS.md](./AGENTS.md) for the layout and the endpoint template, and
[ISSUES.md](./ISSUES.md) for backend problems found while syncing.
