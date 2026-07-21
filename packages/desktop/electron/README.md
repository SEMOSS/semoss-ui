# electron/

The Node/Electron main-process side of the app. Compiled by `tsc -p
../tsconfig.electron.json` into `../dist-electron/` (commonjs, targeting
Node — nothing here goes through Vite/React).

- **`main.ts`** — app entrypoint. Owns the single `BrowserWindow`, the
  `ConnectionsStore`, and the local proxy server lifecycle. Its
  `launchCurrentConnection()` is the one function that (re)starts the local
  server and points the window at it — called on startup and every time a
  connection is selected/switched, so there's never a second window. Also
  wires `attachLoadFailureRecovery()`, which turns a genuine
  `did-fail-load` on the main frame into a Retry/Manage Connections/Quit
  choice instead of a dead Chromium error page.
- **`preload.ts`** — the only bridge between the renderer (`app-ui`) and
  Node. Exposes exactly one thing, `window.semossDesktop.connections`
  (list/add/remove/select/getCurrentId plus the browser-login trio below),
  via `contextBridge`. Nothing else — no filesystem, no other IPC.
- **`app-info.ts`** — two constants shared between the main process and
  `app-ui` (via a relative cross-package import, see `app-ui/README.md`):
  `APP_NAME` and `APP_WINDOW_SIZE`.
- **`connections/`**
  - `types.ts` — `ConnectionRecord` (non-secret: alias, instance URL, module
    path, `authMode: "keys" | "browser"`), `ConnectionSecrets`
    (access/secret key **or** a session cookie, depending on `authMode`),
    `NewKeysConnectionInput`.
  - `store.ts` — `ConnectionsStore`: reads/writes `connections.json` in
    Electron's `userData` dir for the non-secret fields, and uses
    `safeStorage` (OS keychain encryption) for the secrets, one encrypted
    file per connection. Secrets are only ever decrypted here, in the main
    process. `addWithKeys()`/`addWithCookie()` cover the two `authMode`s.
  - `browser-login.ts` — the "Sign in via browser" flow: opens a real
    (child) `BrowserWindow` at the instance's actual origin (its own
    redirect takes over from there — no hardcoded login-page path, since
    deployments name their web client differently), then on "Continue"
    reads the session cookie out of that window's dedicated
    `session.fromPartition(...)` and verifies it with a real probe request
    before handing it back to be saved. Covers native username/password
    *and* OAuth/SSO with one mechanism — see `AGENTS.md`'s "Auth model" for
    why that unification is intentional, not a simplification that lost
    something.
- **`server/static-server.ts`** — a small local HTTP server: serves
  `app-ui`'s built `dist-app-ui/`, and reverse-proxies the current
  connection's `MODULE` path prefix to its real `ENDPOINT`, attaching
  either `Authorization: Basic base64(ACCESS_KEY:SECRET_KEY)` (`authMode:
  "keys"`) or `Cookie: ...` (`authMode: "browser"`) itself. This exists
  because `@semoss/sdk` calls relative paths that only work same-origin,
  and Electron has no dev-server proxy the way Vite does. The whole request
  handler is wrapped in `try/catch` (a synchronous throw here used to be
  able to crash the server and take the initial `index.html` load down
  with it).
- **`windows/create-main-window.ts`** — constructs the single
  `BrowserWindow`, including the platform-specific seamless-title-bar
  options (`titleBarStyle`/`trafficLightPosition` on mac,
  `titleBarOverlay` on Windows/Linux).

## Security posture

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` on
  every window, including the browser-login sign-in window.
- The renderer never receives Access/Secret Key or the session cookie —
  the proxy attaches auth itself, server-side.
- The sign-in window's cookies live in a dedicated, per-attempt
  `session.fromPartition(...)` — isolated from everything else, and only
  ever read by `browser-login.ts` itself.
- `rejectUnauthorized: false` on the proxy's outbound requests and the
  browser-login probe request (self-signed certs on internal instances) —
  see the `// TODO`s before this touches anything beyond internal
  instances.
