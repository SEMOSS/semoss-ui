# app-ui/

The renderer — a React+Vite app, built by `vite build --config
vite.config.ts` into `../dist-app-ui/` (served by `electron/server/static-server.ts`,
not by Vite's own dev server; there is no dev server in this app).

- **`main.tsx`** — mounts `<App>` inside `@semoss/ui/next`'s `ThemeProvider`
  (`defaultTheme="system"`) and `Toaster`. Imports `./index.css`, not
  `@semoss/ui/globals.css` directly — see that file's comment for why.
- **`index.css`** — the Tailwind entry point. `@import`s
  `@semoss/ui/globals.css`, then adds explicit `@source` lines for our own
  files *and* for `libs/chat/src` and `libs/ui/src`. Both of those library
  packages ship Tailwind classes only in their component source (no
  prebuilt/compiled CSS of their own), and the `@source` directive built
  into `@semoss/ui/globals.css` itself does not reliably resolve through
  this monorepo's pnpm workspace symlinks — confirmed by grepping generated
  CSS for classes that were silently missing (`border-e`, `bg-border`,
  `touch-none`, etc.) before these lines were added. **If you see a
  `@semoss/chat` or `@semoss/ui` component rendering unstyled or
  half-styled, this file — and a clean rebuild (`rm -rf dist-app-ui
  node_modules/.vite`) — is the first thing to check.**
- **`App.tsx`** — the top-level router. On mount, asks the main process
  (via `preload.ts`'s bridge) for `getEnvironment()`/`isSignedIn()`:
  - Not signed in → renders `ConnectionsPage` full-screen (the sign-in gate).
  - Signed in → calls `Env.update({ MODULE })`, wraps everything in
    `<InsightProvider>`, and renders `TitleBar` + `ChatShell`. Also owns
    `sidebarOpen` and the `SettingsDialog`'s open/tab state, since both the
    title bar and the sidebar footer need to reach it.
- **`chat-shell.tsx`** — the actual chat UI. Deliberately composed by hand
  (`ChatProvider` + `useChatContext` + `MessageList` + `ChatInput`) instead
  of `@semoss/chat/components`'s batteries-included `ChatPanel`, because
  `ChatPanel` has no variant for the centered "Welcome" landing state and
  no `trailingActions` composition point of its own to layer `McpMenuButton`
  + `EngineSelect` + `PromptOptimizer` into. Also owns:
  - Engine auto-select — runs the same `META | MyEngines(...)` query
    `EngineSelect` uses internally, picks `engines[0]` once loaded.
  - New-room detection — polls `getActiveChatRoomId()` while in "new chat"
    mode, since `@semoss/chat` has no "room created" callback yet.
  - The Welcome/"Hello" landing state, matching playground's
    `new-room-page.tsx` copy pattern (`Welcome, {name}`), fetching the name
    via `usePixel("GetUserInfo();")`.
- **`title-bar.tsx`** — the single draggable strip (see the root README's
  "custom, seamless title bar" section). Holds the sidebar-collapse toggle
  and the current-connection button (opens Settings on the Account tab).
- **`sidebar-footer.tsx`** — the "Settings" entry pinned under
  `RoomSidebar`, Claude/ChatGPT-Desktop style. `RoomSidebar` itself bakes in
  its own width/border/search-box/new-chat-button, so this — and
  `chat-shell.tsx`'s wrapping `<div>` — exist specifically to add a footer
  *without* forking the library component: the wrapper owns the visible
  width/border, and `RoomSidebar`'s own width/border are neutralized via
  its `className` prop (tailwind-merge resolves the conflict in the
  caller's favor).
- **`settings-dialog.tsx`** — Appearance (Light/Dark/System via
  `@semoss/ui/next`'s `useTheme`) + Account (reuses `connections-page.tsx`
  in its compact variant — alias + Sign Out) tabs.
- **`connections-page.tsx`** — the sign-in gate. `variant="full"`
  (full-screen, before a session exists) is the split-layout sign-in screen
  — "AI Core" mark, "Welcome back," a single Sign In button, the real
  playground login illustration (`assets/img/login.svg`/`login-darkmode.png`)
  on a decorative cycling-prompt card. `variant="compact"` (inside the
  Settings dialog, already signed in) is just the environment alias + a
  Sign Out button — there's nothing to add/remove/switch since there's only
  one build-configured environment. Talks to the main process only via
  `window.semossDesktop.connections.*` (see `preload.ts`) — never touches
  `@semoss/sdk` directly, since it doesn't need a session to exist yet.
- **`semoss-icon.tsx`** — the SEMOSS mark, vendored as a local component
  rather than imported from `@semoss/shared`'s `"./assets/img/*"` export,
  because that export maps to an extensionless source path Vite resolves
  fine at build time but tsc's `"bundler"` module resolution does not for a
  bare (no-extension) subpath specifier.
- **`global.d.ts`** — types `window.semossDesktop` (the preload bridge).

## Cross-package imports you'll notice

Several files here `import` directly from `../../electron/*` (e.g.
`EnvironmentConfig` from `electron/connections/types.ts`, `APP_NAME` from
`electron/app-info.ts`). That's intentional — both tsconfigs (`tsconfig.json`
for this Vite build, `tsconfig.electron.json` for the Node build) include
those specific files, so it's real, type-checked sharing across the
process boundary, not a hack. Keep anything imported this way free of
Node-only APIs.
