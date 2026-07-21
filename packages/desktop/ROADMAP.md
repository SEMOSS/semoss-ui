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
      cookie (`Cookie: ...`) — the only credential this app handles since
      Access Key/Secret Key was removed (see `AGENTS.md`'s "Auth model").
- [x] ~~Access Key/Secret Key auth~~ — removed entirely, not just hidden:
      the user didn't want this app's auth story to be something a user
      configures. Browser sign-in against the one build-configured
      environment (`electron/config/environment.json`) is the only path
      now.
- [ ] **Sign-out → sign-in round trip needs real-use testing/polish.**
      Sign Out exists (Settings → Account tab → `signOut()` IPC → returns
      to the sign-in screen), but hasn't been exercised much beyond the
      initial implementation — confirm it behaves well when signing back
      in immediately after, and that stale UI state (e.g. an open Settings
      dialog, an in-flight chat request) doesn't linger oddly across the
      transition.
- [ ] **Session/cookie expiry isn't handled, and how long a session
      actually lasts isn't well understood yet.** An expired session
      cookie just starts getting redirected-to-login responses proxied
      straight through (surfaces as a confusing pixel-call error in
      app-ui, not a clear "sign in again" prompt) — no refresh mechanism
      and no expiry detection exist. Before building a fix, figure out:
      how long the real instance's session cookie is actually valid for
      (idle timeout vs. absolute expiry), whether it's renewed by ordinary
      API traffic or only by a fresh login, and what a clear "your session
      expired, sign in again" surface should look like once that's known.
- [ ] Stop trusting self-signed certs (`rejectUnauthorized: false` in the
      proxy and in the browser-login probe) once this targets anything
      beyond internal instances.
- [ ] Code-signing + notarization for macOS builds
      (`electron-builder.yml`'s `identity: null`).
- [ ] Code-signing for Windows builds (`electron-builder.yml`'s
      `signAndEditExecutable: false`) — unsigned builds trigger SmartScreen
      warnings today.

## Environments

- [ ] **Only one build-configured environment exists today** ("Workshop,"
      `electron/config/environment.json`) — deliberately, per explicit
      request, not a placeholder for a missing feature. If a second
      environment is ever needed: extend `environment.json` to a list, add
      a small picker back into `connections-page.tsx` (an earlier design
      pass already worked out that UI — segmented pills above the Sign In
      button), and thread the picked environment's id through
      `ConnectionsStore`'s single-session model, which currently assumes
      exactly one.

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
