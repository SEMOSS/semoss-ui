# Roadmap — what's deliberately not done yet

Everything below was left out on purpose, not missed. See `AGENTS.md` for
the reasoning behind each; this file is the flat punch-list version.

## Auth & security

- [ ] Replace Access/Secret Key Basic-auth with real SSO/OAuth once this
      moves beyond local/internal distribution
      (`electron/server/static-server.ts` has the `// TODO`).
- [ ] Stop trusting self-signed certs (`rejectUnauthorized: false` in the
      proxy) once this targets anything beyond internal instances.
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
