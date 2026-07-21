# @semoss/desktop — AI Core Playground

An Electron desktop app built directly on `@semoss/chat`'s components and
`@semoss/sdk`, connected to the one remote SEMOSS instance this build is
configured for (`electron/config/environment.json` — a build-time decision,
not something a user enters). It matches playground's visual design (via `@semoss/chat/components`
and `@semoss/ui`) and looks/behaves like a native desktop chat app (Claude
Desktop / ChatGPT Desktop) — collapsible sidebar, settings at the bottom,
seamless title bar. It does **not** embed or wrap playground's own build.

See also:
- [`AGENTS.md`](./AGENTS.md) — how this was built, how the pieces connect,
  and the assumptions made along the way. Read this first if you're picking
  this package up cold.
- [`ROADMAP.md`](./ROADMAP.md) — what's deliberately not done yet.
- Subfolder READMEs: [`electron/`](./electron/README.md),
  [`app-ui/`](./app-ui/README.md), [`build/`](./build/README.md),
  [`release/`](./release/README.md), [`scripts/`](./scripts/README.md).

## How it works

- **One window.** `app-ui/` (a React+Vite app) is the only window
  (`electron/windows/create-main-window.ts`). It shows either the sign-in
  screen (not signed in yet) or the chat shell — decided at runtime by
  asking the main process whether a session exists.
- **A custom, seamless title bar.** Per
  [Electron's custom-title-bar guide](https://www.electronjs.org/docs/latest/tutorial/custom-title-bar):
  `titleBarStyle: "hidden"` + `trafficLightPosition` on macOS,
  `titleBarOverlay` on Windows/Linux, with `app-ui/src/title-bar.tsx` as the
  single draggable (`app-region: drag`) strip underneath.
- **Local proxy for API calls.** `@semoss/sdk` calls a *relative* path
  (`${MODULE}/api/...`), which only works when the page is served from the
  same origin as the SEMOSS server. Electron has neither a shared origin nor
  a dev-time proxy, so `electron/server/static-server.ts` runs a small local
  HTTP server that serves `app-ui`'s built `dist-app-ui/` and reverse-proxies
  ENVIRONMENT's `MODULE` path prefix to its real `ENDPOINT`, attaching the
  signed-in session cookie itself, server-side — so **the cookie never
  reaches app-ui's JS**, only the main process ever sees it.
- **Chat UI is composed by hand**, not `@semoss/chat/components`'s
  batteries-included `ChatPanel` — `ChatProvider` + `useChatContext` +
  `MessageList` + `ChatInput` directly, since that's what's needed for both
  the composer's `trailingActions` (MCP menu, engine picker, prompt
  optimizer) and the "Welcome" landing state when a room has no messages
  yet. See `app-ui/src/chat-shell.tsx`.
- **Sidebar is collapsible**, with a Settings entry pinned at its bottom
  (Claude/ChatGPT-Desktop pattern) opening a tabbed dialog (Appearance +
  Account). See `app-ui/src/sidebar-footer.tsx` and
  `app-ui/src/settings-dialog.tsx`.

## Environment (build-time config, not user input)

Which SEMOSS instance this app talks to — alias, instance URL, module path —
is a **build-time decision**: `electron/config/environment.json`, imported
by `electron/config/environment.ts` as the single `ENVIRONMENT` constant
every other main-process module reads from. There is exactly one entry
today; nothing in the UI lets a user add, remove, or edit an environment.
(Earlier versions of this app let a user save multiple named environments
at runtime, mirroring `packages/vscode-extension`'s alias/instance model —
that was deliberately replaced with this config-driven model; see
`AGENTS.md`'s "Auth model" assumption for why.)

- **Access Key/Secret Key is gone** — the only way to authenticate is
  "Sign In," which opens a real sign-in window pointed at
  `ENVIRONMENT.instanceUrl`; the instance's own redirect takes it to
  whatever login page that instance is configured with, so native
  username/password *and* any OAuth/SSO provider button both just work
  without this app needing to know which one you used
  (`electron/connections/browser-login.ts`).
- The resulting session cookie is the only credential this app ever
  stores, encrypted at rest via `safeStorage` (OS keychain encryption) and
  only ever decrypted inside the main process (`electron/connections/store.ts`).
- `app-ui/src/connections-page.tsx` is the sign-in gate — shown full-screen
  before a session exists, and as a simple "signed in as {alias}" + Sign Out
  row inside the Settings dialog's "Account" tab once signed in (opened
  either from the sidebar's Settings entry or the title bar's
  connection-status button). Signing in or out reloads the same window —
  there's never a second window.

## Development

```bash
# generate the app icon from the SEMOSS mark (only needed once, or after
# editing build/icon-source.svg)
pnpm --filter @semoss/desktop generate-icon

# build once + launch, auto-rebuilding and relaunching Electron on any
# source change (main/preload via tsc --watch, app-ui via vite build --watch,
# nodemon restarts electron . when the compiled output changes)
pnpm --filter @semoss/desktop dev
```

`pnpm dev` is a full-restart watch mode, not HMR — every change quits and
relaunches the whole Electron process (a couple seconds), not just the
renderer. On first launch (no session yet), the sign-in screen opens
automatically against `electron/config/environment.json`'s environment —
click Sign In, finish signing in in the window that opens, and it connects
automatically.

**If you add or change a `@source` line in `app-ui/src/index.css`** (see
that file's own comment for why it exists at all), do a clean rebuild —
`rm -rf dist-app-ui node_modules/.vite` — before trusting the result. Vite's
Tailwind cache has been observed to silently keep serving the old,
under-scanned CSS across an ordinary incremental rebuild.

### Manual test checklist

Since this is a native app, exercise it by hand against a real SEMOSS
instance before calling a change done:

- [ ] Sign in, complete sign-in (native username/password or an SSO
      provider button) in the window that opens, confirm it connects
      automatically with no click needed, and an engine auto-selects
- [ ] Click Continue *before* finishing sign-in — confirm it shows a clear
      "still not signed in" message rather than silently succeeding or
      crashing
- [ ] Send a chat message from the empty "Welcome" state, confirm streaming
      works through the local proxy and a room appears in the sidebar
- [ ] Attach knowledge/tools via the composer's "+" menu
- [ ] Rate a response (thumbs), copy it, download it
- [ ] Collapse/expand the sidebar via the title-bar toggle
- [ ] Open Settings from the sidebar footer (Appearance tab) and from the
      title bar's connection button (Account tab); switch theme
      Light/Dark/System
- [ ] Sign Out from the Account tab, confirm it returns to the sign-in
      screen, then sign back in
- [ ] Quit and relaunch while signed in — should reconnect automatically
      without showing the sign-in screen

## Packaging

```bash
pnpm --filter @semoss/desktop package:mac   # macOS x64 + arm64 .dmg
pnpm --filter @semoss/desktop package:win   # Windows x64 + arm64 combined .exe
pnpm --filter @semoss/desktop package       # all platforms (mac, win, linux)
```

See [`release/README.md`](./release/README.md) for what lands where and
when to rebuild. See the TODOs in `electron-builder.yml` before
distributing a build outside local/internal use — these are neither
code-signed nor notarized.
