# Roadmap — what's deliberately not done yet

Everything below was left out on purpose, not missed. See `AGENTS.md` for
the reasoning behind each; this file is the flat punch-list version.

## Auth & security

- [x] ~~SSO/OAuth support~~ — done, via a different mechanism than a typical
      "OAuth" implementation: `libs/sdk/src/api/auth.ts`'s real login flow
      is popup-based and same-origin/cookie-dependent (no code path anywhere
      ever produces a portable bearer token from a login — confirmed by
      reading it, not assumed), so a token-based approach was never viable
      for a renderer living at `http://127.0.0.1:<local-proxy-port>` instead
      of the instance's real origin. Instead: `electron/connections/browser-login.ts`
      opens a real (child) `BrowserWindow` pointed at the instance's actual
      origin, lets the user sign in however that instance is configured
      (native username/password *and* any OAuth/SSO provider button, e.g.
      "Microsoft" — confirmed against a real instance's login page, not
      guessed), then reads the resulting session cookie out of Electron's
      `session.cookies` API and verifies it with a real probe request before
      saving. `electron/server/static-server.ts`'s proxy forwards that
      cookie (`Cookie: ...`) instead of Basic-auth for `authMode: "browser"`
      connections. This is why "native username/password" and "OAuth/SSO"
      collapsed into one "Sign in via browser" option in the connections UI
      rather than two separate flows — the real login page already handles
      that distinction itself; this app doesn't need to know which the user
      picked.
- [ ] **Session/cookie expiry isn't handled** — an expired `authMode:
      "browser"` cookie just starts getting redirected-to-login responses
      proxied straight through (surfaces as a confusing pixel-call error in
      app-ui, not a clear "sign in again" prompt). No refresh mechanism
      exists. Worth a clearer surface once this sees real usage.
- [ ] Stop trusting self-signed certs (`rejectUnauthorized: false` in the
      proxy and in the browser-login probe) once this targets anything
      beyond internal instances.
- [ ] Code-signing + notarization for macOS builds
      (`electron-builder.yml`'s `identity: null`).
- [ ] Code-signing for Windows builds (`electron-builder.yml`'s
      `signAndEditExecutable: false`) — unsigned builds trigger SmartScreen
      warnings today.

## Distribution / CI

- [ ] A CI job that actually builds and publishes `packages/desktop`'s
      installers on tag/release, instead of the current process (built by
      hand, locally, in an ad hoc session). This is the biggest concrete
      gap — there is no automation here at all yet.
- [ ] Auto-update (`electron-updater`) once there's a real release channel
      for it to check against.
- [ ] Decide on a real versioning/release-notes process — `package.json`'s
      `version` is still `0.1.0`.

## Native niceties

- [ ] Tray icon.
- [ ] Launch-at-login.
- [ ] Deep-linking (`semoss://...`) for things like opening a specific room
      from an external link.

## Developer experience

- [ ] Real HMR for `app-ui` instead of the current full Electron
      relaunch-on-change watch mode (`pnpm dev`) — every change currently
      costs a full app restart (a few seconds), not just a component
      re-render.
- [ ] `titleBarOverlay` colors (Windows/Linux) are set once at window
      creation and don't follow the in-app Light/Dark/System theme toggle —
      would need `win.setTitleBarOverlay()` called again on theme change.

## `@semoss/chat` gaps this app is working around, not fixing upstream

(Flagging these here so they're visible without having to re-derive them
from `AGENTS.md`'s "assumptions" section — if you're touching `libs/chat`,
any of these would remove a workaround from this app.)

- [ ] No hook to get the raw engine list without rendering `EngineSelect`
      itself — `chat-shell.tsx` duplicates `EngineSelect`'s own
      `MyEngines` pixel query to auto-select the first engine.
- [ ] No "room created" callback — `chat-shell.tsx` polls
      `getActiveChatRoomId()` every 700ms while in "new chat" mode instead.
- [ ] `McpOverlay` isn't wired up as a persistent "attached knowledge/tools"
      side rail — only `McpMenuButton`'s dropdown is used today. (See
      `semoss-component-showcase`'s `chat-workspace.tsx` for the
      `rightRail === "mcp"` pattern this could follow.)

## Feature gaps vs. `packages/playground`

Only chat (rooms + messages + tool calls) is built on `@semoss/chat` today.
Not ported:

- [ ] Knowledge bases
- [ ] Workspaces
- [ ] MCP configuration UI beyond the composer's attach menu
- [ ] Prompt library

## Polish

- [ ] `Tooltip` (from `@semoss/ui/next`) on the icon-only buttons — sidebar
      collapse toggle, settings entry — for hover-label discoverability.
      Every reference app (Claude/ChatGPT Desktop) has this; ours doesn't
      yet.
- [ ] Re-check chunk size — the app bundle has several >500kB chunks
      (mermaid, katex, cytoscape, all pulled in transitively via
      `@semoss/chat`'s rich-content rendering). Not broken, just worth a
      look if startup time or bundle size ever becomes a concern.
