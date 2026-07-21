# electron/

The Node/Electron main-process side of the app. Compiled by `tsc -p
../tsconfig.electron.json` into `../dist-electron/` (commonjs, targeting
Node — nothing here goes through Vite/React).

- **`main.ts`** — app entrypoint. Owns the single `BrowserWindow`, the
  `ConnectionsStore`, and the local proxy server lifecycle. Its
  `launchCurrentConnection()` is the one function that (re)starts the local
  server and points the window at it — called on startup and every time a
  connection is selected/switched, so there's never a second window.
- **`preload.ts`** — the only bridge between the renderer (`app-ui`) and
  Node. Exposes exactly one thing, `window.semossDesktop.connections`
  (list/add/remove/select/getCurrentId), via `contextBridge`. Nothing else —
  no filesystem, no other IPC.
- **`app-info.ts`** — two constants shared between the main process and
  `app-ui` (via a relative cross-package import, see `app-ui/README.md`):
  `APP_NAME` and `APP_WINDOW_SIZE`.
- **`connections/`**
  - `types.ts` — `ConnectionRecord` (non-secret: alias, instance URL, module
    path), `ConnectionSecrets` (access/secret key), `NewConnectionInput`.
  - `store.ts` — `ConnectionsStore`: reads/writes `connections.json` in
    Electron's `userData` dir for the non-secret fields, and uses
    `safeStorage` (OS keychain encryption) for the secrets, one encrypted
    file per connection. Secrets are only ever decrypted here, in the main
    process.
- **`server/static-server.ts`** — a small local HTTP server: serves
  `app-ui`'s built `dist-app-ui/`, and reverse-proxies the current
  connection's `MODULE` path prefix to its real `ENDPOINT`, attaching
  `Authorization: Basic base64(ACCESS_KEY:SECRET_KEY)` itself. This exists
  because `@semoss/sdk` calls relative paths that only work same-origin,
  and Electron has no dev-server proxy the way Vite does.
- **`windows/create-main-window.ts`** — constructs the single
  `BrowserWindow`, including the platform-specific seamless-title-bar
  options (`titleBarStyle`/`trafficLightPosition` on mac,
  `titleBarOverlay` on Windows/Linux).

## Security posture

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` on the
  window.
- The renderer never receives Access/Secret Key — the proxy attaches auth
  itself, server-side.
- `rejectUnauthorized: false` on the proxy's outbound requests (self-signed
  certs on internal instances) — see the `// TODO` in `static-server.ts`
  before this touches anything beyond internal instances.
