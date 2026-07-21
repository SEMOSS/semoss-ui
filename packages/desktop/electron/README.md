# electron/

The Node/Electron main-process side of the app. Compiled by `tsc -p
../tsconfig.electron.json` into `../dist-electron/` (commonjs, targeting
Node — nothing here goes through Vite/React).

- **`main.ts`** — app entrypoint. Owns the single `BrowserWindow`, the
  `ConnectionsStore`, and the local proxy server lifecycle. Its
  `launchCurrentConnection()` is the one function that (re)starts the local
  server and points the window at it — called on startup and every time
  sign-in/sign-out changes session state, so there's never a second
  window. Also wires `attachLoadFailureRecovery()`, which turns a genuine
  `did-fail-load` on the main frame into a Retry/Sign Out/Quit choice
  instead of a dead Chromium error page.
- **`preload.ts`** — the only bridge between the renderer (`app-ui`) and
  Node. Exposes exactly one thing, `window.semossDesktop.connections`
  (`getEnvironment`/`isSignedIn`/`signOut` plus the browser-login trio
  below), via `contextBridge`. Nothing else — no filesystem, no other IPC.
  Keeps its own literal copy of the IPC channel-name constants rather than
  importing `connections/ipc-channels.ts` — see the comment at the top of
  the file for why (a sandboxed preload's restricted `require()` can't
  resolve local relative files at all).
- **`app-info.ts`** — renderer-safe constants shared between the main
  process and `app-ui` (via a relative cross-package import, see
  `app-ui/README.md`): `APP_NAME`, `APP_WINDOW_SIZE`, `LOCAL_SERVER_HOST`,
  `DEFAULT_HTTP_PORT`/`DEFAULT_HTTPS_PORT`. No `electron`/`node:*` imports
  here on purpose — `title-bar.tsx` imports `APP_NAME` straight from this
  file, and Vite can't bundle Node/Electron APIs into the browser build.
- **`icon-path.ts`** — `getIconPath()`, the one main-process-only helper
  that *does* need `electron`/`node:path` (resolves the app icon from
  `app.getAppPath()`) — kept out of `app-info.ts` for the reason above.
- **`config/`**
  - `environment.json` — the one SEMOSS environment this build talks to
    (`alias`, `instanceUrl`, `modulePath`). Edit this file, not a form in
    the app, to point at a different instance.
  - `environment.ts` — re-exports it as the typed `ENVIRONMENT` constant;
    every other main-process module that needs the environment imports
    from here, not the JSON directly.
- **`connections/`**
  - `types.ts` — `EnvironmentConfig` (alias, instance URL, module path —
    mirrors `environment.json`) and `ConnectionSecrets` (just `{cookie?}`
    — the session cookie is the only credential this app stores).
  - `ipc-channels.ts` — the channel-name constants `main.ts` registers
    `ipcMain.handle` against. `preload.ts` keeps its own literal copy
    instead of importing this (see `preload.ts` above) — update both if
    you rename a channel.
  - `store.ts` — `ConnectionsStore`: `getEnvironment()` returns `ENVIRONMENT`
    as-is; `isSignedIn()`/`getSecrets()`/`saveCookie()`/`signOut()` manage
    one `safeStorage`-encrypted session file in Electron's `userData` dir.
    No connections list, no per-id anything — there's exactly one
    environment, so there's exactly one session.
  - `browser-login.ts` — the "Sign In" flow: opens a real (child)
    `BrowserWindow` at `ENVIRONMENT.instanceUrl` + a path we've actually
    confirmed requires auth and redirects when it doesn't have it
    (`AUTH_PROBE_PATH`, not the bare module path — that can 404 instead of
    redirecting if nothing's mapped to it), then auto-detects completion
    (polling + navigation events) or, on manual "Continue," reads the
    session cookie out of that window's dedicated
    `session.fromPartition(...)` and verifies it with a real probe request
    before handing it back to be saved. Covers native username/password
    *and* OAuth/SSO with one mechanism — see `AGENTS.md`'s "Auth model" for
    why that unification is intentional, not a simplification that lost
    something.
- **`server/static-server.ts`** — a small local HTTP server: serves
  `app-ui`'s built `dist-app-ui/`, and reverse-proxies ENVIRONMENT's
  `MODULE` path prefix to its real `ENDPOINT`, attaching the signed-in
  session cookie (`Cookie: ...`) itself. This exists because `@semoss/sdk`
  calls relative paths that only work same-origin, and Electron has no
  dev-server proxy the way Vite does. The whole request handler is wrapped
  in `try/catch` (a synchronous throw here used to be able to crash the
  server and take the initial `index.html` load down with it).
- **`windows/create-main-window.ts`** — constructs the single
  `BrowserWindow`, including the platform-specific seamless-title-bar
  options (`titleBarStyle`/`trafficLightPosition` on mac,
  `titleBarOverlay` on Windows/Linux).

## Security posture

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` on
  every window, including the browser-login sign-in window.
- The renderer never receives the session cookie — the proxy attaches it
  itself, server-side.
- The sign-in window's cookies live in a dedicated, per-attempt
  `session.fromPartition(...)` — isolated from everything else, and only
  ever read by `browser-login.ts` itself.
- `rejectUnauthorized: false` on the proxy's outbound requests and the
  browser-login probe request (self-signed certs on internal instances) —
  see the `// TODO`s before this touches anything beyond internal
  instances.
