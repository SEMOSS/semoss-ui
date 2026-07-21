# AGENTS.md — @semoss/desktop

Context for AI coding assistants (and humans) picking up this package cold.

> **Inherits from:** [../../AGENTS.md](../../AGENTS.md) for monorepo
> conventions, commit messages, Biome config, and Node/pnpm requirements —
> if that file exists; if not, see the root `CLAUDE.md`.

## What this is, in one paragraph

An Electron desktop app ("AI Core Playground") that is a genuine consumer
of `@semoss/chat` and `@semoss/sdk` — not a wrapper around `packages/playground`'s
build. It runs against a remote SEMOSS instance you configure at runtime
(no bundled backend), looks like a native desktop chat app (collapsible
sidebar, settings at the bottom, seamless title bar — Claude Desktop /
ChatGPT Desktop as the visual reference), and was built specifically to
exercise `@semoss/chat`'s component library as a real second consumer
beyond playground itself.

## How the pieces connect (SDK → chat → UI)

```
@semoss/sdk            — the transport layer. InsightProvider/useInsight,
  (libs/sdk)              usePixel/useIteratorPixel, Env.update({MODULE}).
  ↓ consumed by           Knows nothing about chat or UI at all — it's
                          pixel calls and React context, full stop.

@semoss/chat            — the chat domain layer, built on @semoss/sdk.
  (libs/chat)             ChatProvider/useChatContext wraps one room's
  ↓ consumed by           session (messages, mcp, sendMessage, ...);
                          ChatRoomsProvider/useChatRoomsContext wraps the
                          room list. @semoss/chat/components (RoomSidebar,
                          MessageList, ChatInput, EngineSelect,
                          McpMenuButton, PromptOptimizer, ...) are the
                          presentational layer on top, styled with
                          @semoss/ui tokens. Ships NO CSS of its own —
                          Tailwind classes live only in its .tsx source.

app-ui (this package)   — composes @semoss/chat's pieces by hand (not the
  ↓ served by             batteries-included ChatPanel — see app-ui/README.md
                          for why) into the actual desktop layout: title
                          bar, collapsible sidebar + settings footer,
                          chat shell, connections page.

electron (this package) — the only thing genuinely new here that neither
                          @semoss/sdk nor @semoss/chat needed to solve:
                          Electron has no dev-server proxy, so a small
                          local HTTP server (electron/server/static-server.ts)
                          serves app-ui's build and reverse-proxies
                          @semoss/sdk's relative API calls to the real
                          SEMOSS instance, injecting Basic auth itself so
                          credentials never reach app-ui's JS.
```

The one real technical wrinkle unique to Electron (not present when
`@semoss/chat`/`@semoss/sdk` run inside a normal browser tab pointed at a
SEMOSS-hosted page) is that `@semoss/sdk` calls a *relative* path
(`${MODULE}/api/...`), which only resolves correctly when the page is
served from the same origin as the SEMOSS server. A normal web deployment
gets that for free; Electron has neither a shared origin nor Vite's
dev-time proxy — hence the local proxy server.

## What we actually built (chronological, roughly)

1. **Package scaffold** — `electron/` (Node/tsc build) + `app-ui/` (Vite/React
   build), wired together via `electron/server/static-server.ts` serving
   `app-ui`'s output.
2. **Multi-environment connections** — `ConnectionsStore` (`safeStorage` +
   JSON), mirroring `packages/vscode-extension`'s alias/instance model.
3. **App icon** — rasterized from the existing SEMOSS mark
   (`libs/shared/src/assets/img/SEMOSS.tsx`), not a new design.
4. **Cross-platform packaging** — `electron-builder`, mac (x64+arm64 dmg)
   and Windows (combined x64+arm64 nsis) both build from macOS with no
   extra tooling, since this app has zero native runtime dependencies
   (`npmRebuild: false` in `electron-builder.yml` — there's nothing to
   rebuild, and the default rebuild step was actively breaking on this
   monorepo's pnpm layout).
5. **Rename to "AI Core Playground"**, seamless title bar (mac
   `titleBarStyle`+`trafficLightPosition`, win/linux `titleBarOverlay`),
   dev watch mode (`tsc --watch` + `vite build --watch` + `nodemon`).
6. **Pivot from wrapping playground to building on `@semoss/chat`
   directly** — this was a deliberate architecture change mid-project (see
   git history around this point if you need the "why," but the short
   version: the whole point of `@semoss/chat` existing is to have a real
   second consumer besides playground, and wrapping playground's own build
   would have used none of it).
7. **In-app connections page + current-connection indicator**, replacing an
   earlier separate connections `BrowserWindow` — one window, always.
8. **Real chat shell** on `@semoss/chat`'s components, engine auto-select,
   Welcome landing state, full composer (`trailingActions`: MCP menu,
   engine picker, prompt optimizer).
9. **Design review pass** — iterated purely on an HTML mockup (shared as a
   Claude Artifact) across several rounds before touching real code again,
   per explicit instruction to "get the design right" first.
10. **Settings dialog + collapsible sidebar** (Claude/ChatGPT-Desktop
    pattern), plus finding and fixing a real, systemic bug: `@semoss/ui`'s
    and `@semoss/chat`'s Tailwind classes were largely missing from the
    built CSS (see `app-ui/README.md`'s `index.css` section) — not a
    dark-mode-specific issue, a scanning-config issue affecting most custom
    styling from both libraries.
11. **Local server hardening + load-failure recovery** — the request
    handler had no top-level `try/catch` (a synchronous throw could crash
    the whole local server, taking the initial `index.html` load down with
    it), and a failed load left the user stuck on a dead Chromium error
    page. Fixed both: `electron/server/static-server.ts` now can't crash
    from a bad request, and `electron/main.ts` listens for `did-fail-load`
    on the main frame and offers Retry/Manage Connections/Quit instead.
12. **Browser-based sign-in** (`electron/connections/browser-login.ts`) —
    native username/password *and* OAuth/SSO, unified into one "Sign in via
    browser" flow. See the "Auth model" assumption below for why this was
    the only viable approach and how it actually works.

## Assumptions made (flag if any of these turn out wrong)

- **Auth model**: two modes, both real, chosen per connection —
  `authMode: "keys"` (Access/Secret Key Basic-auth, matching
  `packages/playground`/`vba-futures` today) and `authMode: "browser"`
  (a real sign-in window against the instance's actual origin, capturing
  the resulting session cookie). The two were **not** built as separate
  "native" and "OAuth" flows — confirmed by reading `libs/sdk/src/api/auth.ts`
  and by inspecting a real instance's login page, the actual login page
  already offers both native username/password and OAuth/SSO provider
  buttons (e.g. "Microsoft") in one form, and login either way results in
  the same thing (a session cookie) — so "Sign in via browser" covers both
  without this app needing to know which the user picked. See
  `electron/connections/browser-login.ts` and `ROADMAP.md`'s auth section
  for the full reasoning, including why a portable-token approach was ruled
  out (no code path in `@semoss/sdk` ever produces one from a login).
- **Remote-only, never a bundled backend**: this app is a shell around a
  SEMOSS instance you already have running somewhere; it never launches or
  manages a SEMOSS/Tomcat process itself.
- **One window, always**: every "open something else" impulse (connections
  management, settings) was deliberately resolved as a page/dialog inside
  the single window, not a second `BrowserWindow` — kept because it avoids
  a whole class of state-sync bugs between windows, and matches the
  Claude/ChatGPT Desktop reference more closely than a multi-window app
  would.
- **Credentials never reach the renderer** — the local proxy injects the
  Authorization header server-side. This means `Env.ACCESS_KEY`/`SECRET_KEY`
  are *never* set in `app-ui`; only `Env.MODULE` is. If a future feature
  needs the renderer to know credentials exist (not their values), that's
  a deliberate boundary to think through before crossing.
- **Self-signed certs are trusted** (`rejectUnauthorized: false` on the
  proxy's outbound requests) — matches `packages/playground`'s own dev
  proxy trust level today. Not appropriate once this targets anything
  beyond internal/local instances.
- **Engine auto-select re-implements `EngineSelect`'s own query** rather
  than exposing a list from the library — there was no ready-made hook for
  "get the engine list without rendering a picker," so `chat-shell.tsx`
  calls `useIteratorPixel` directly with the identical `MyEngines` pixel
  `EngineSelect` uses internally. If `@semoss/chat` ever exposes this as a
  hook, prefer that over the duplicated query.
- **New-room detection is a poll**, not a callback — `@semoss/chat` doesn't
  expose "a room was just created" as an event, so `chat-shell.tsx` polls
  `getActiveChatRoomId()` (already public) every 700ms while in "new chat"
  mode. Works; a real callback in the library would be cleaner.
- **Current-user name** comes from calling `GetUserInfo()` directly (no
  `@semoss/sdk` hook exposes it), picking `SAML ?? NATIVE ?? first key` —
  same precedence `packages/terminal`'s real usage already established.
- **Branding**: app identity is "AI Core Playground"; the SEMOSS mark
  (existing three-circle logo) is reused as-is for the app icon — this was
  an explicit choice, not a placeholder, confirmed with the user rather
  than assumed.
- **Distribution is local/internal only for now** — builds are unsigned
  and non-notarized on purpose (not an oversight); see `ROADMAP.md`.

## Things future work should NOT casually change

- Don't reach for `ChatPanel` to "simplify" `chat-shell.tsx` — it was
  deliberately not used because it can't support the Welcome landing state
  or the composer's `trailingActions`. See `app-ui/README.md`.
- Don't remove the `@source` lines in `app-ui/src/index.css` to "clean up"
  — they're load-bearing (see that file's own comment and `app-ui/README.md`).
- Don't add a second `BrowserWindow` for settings/connections — extend the
  existing `SettingsDialog` tabs instead.
- Don't set `Env.ACCESS_KEY`/`Env.SECRET_KEY` in `app-ui` — credentials
  belong only in the main process. If you're tempted to, the local proxy
  is very likely the better place for whatever you're trying to do.
