# AGENTS.md - @semoss/playground-desktop

This document provides context for AI coding assistants working with the SEMOSS Playground
desktop app.

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). Load the applicable
> [root skills](../../skills/README.md), including the [React standard](../../skills/react-standard.skill.md)
> and the [chat host skill](../../skills/chat-host.skill.md). The chat itself is
> [`@semoss/chat`](../../libs/chat/AGENTS.md).

## Overview

A Tauri 2 app: the SEMOSS chat on the desktop, against any SEMOSS instance the user adds. Like
`@semoss/playground` it is a thin host over `@semoss/chat` and the SDK's room engine, and every
surface goes through the playground reactors. What it adds is the platform: picking an instance,
a native HTTP bridge, sign in windows, the keychain, native downloads, desktop tools, and a window
that behaves like a native one (its title bar, its links, its shortcuts).

The web bundle carries **no Tauri npm packages**: `app.withGlobalTauri` exposes the JavaScript API
on `window.__TAURI__`, typed in `src/platform/tauri.ts`. Outside the shell (a browser during
`pnpm dev`) the platform features fall back or switch off (`isTauriRuntime`).

## Structure

| Path | Purpose |
|------|---------|
| `src/main.tsx`, `src/app.tsx` | Boot: read the saved instances; with one in use, configure the SDK and start the session, then render the router; otherwise the instance picker |
| `src/platform/` | The platform layer: `tauri.ts` (typed global API), `fetch-bridge.ts`, `sdk-host.ts`, `auth-window.ts`, `keychain.ts`, `downloads.ts`, `app-store.ts`, `window-chrome.ts` (the title bar) |
| `src/features/instances/` | `InstanceStore` (Observable, persisted in `preferences.json`), the picker page and form, `checkInstance` |
| `src/features/auth/` | Login: the SDK's `SessionLoginForm` plus a bearer token form |
| `src/features/desktop-tools/` | `createDesktopToolProvider()` (a `ClientToolProvider`) and its integration for the chat tool card |
| `src/features/navigation/` | `DesktopNav` (the sidebar), `DesktopAccountMenu`, `useDesktopShortcuts` |
| `src/components/` | `AppLoading`, the whole-window wait for the config and the session |
| `src/host/` | `build-desktop-host-config.ts`, `desktop-panel-components.ts`, `desktop-preferences.ts` |
| `src/pages/` | Router, gating layouts, the desktop layout, thin route pages |
| `src-tauri/` | The Rust side: `src/lib.rs` (every command), `tauri.conf.json` (CSP, window), `capabilities/` |

## How it works

- **Instances.** `InstanceProfile = { id, name, url, module, lastLoginMethod, bearerProvider? }`
  in the app's `preferences.json` (`tauri-plugin-store`), validated on read. The form checks an
  address by reading its `/api/config` (`check_instance`, no cookies) before saving. **Switching
  instances reloads the webview** (`window.location.reload()` after `setActiveInstance`), so the
  SDK's `Env`, its session, the rooms client and every room start over against the new server;
  nothing tears down in place.
- **The native fetch bridge.** `configureSdkHost` tells Rust the instance first
  (`set_active_instance`), then sets an absolute `Env.MODULE` (which also points the insight
  websocket there) and replaces `window.fetch` for requests under the module address. Every body
  (string, `URLSearchParams`, `Blob`, `FormData` multipart with its boundary) is encoded through
  `new Response(body)` and sent base64; responses come back base64, so downloads keep their bytes.
  Rust (`native_http_request`) refuses requests outside the instance, methods other than GET and
  POST, and headers outside its allowlist; it keeps the session's cookies in the webview's jar
  (`cookies_for_url` → `Cookie`, `Set-Cookie` → jar), which the sign in windows share, and never
  follows redirects (the SDK reads the session's 302 as signed out). CSRF turns on from the
  instance's config (`Config.load`).
- **Sign in.** Native, LDAP and one-time codes go through `Session.login` (`SessionLoginForm`).
  OAuth and connector sign ins use the SDK's `setSignInWindowOpener` seam: `open_auth_window`
  builds the window in Rust (label `semoss-auth-<n>`, no capability) and emits
  `auth-window://navigated` / `auth-window://closed`; the window counts as back once it leaves the
  instance's `/api/auth` pages. A bearer token signs in with `Env.BEARER_TOKEN` +
  `BEARER_PROVIDER` and `Session.refresh()`.
- **Downloads.** The SDK's `setDownloadHandler` seam: the file is read through the bridge, then
  `save_file_with_dialog` asks where to save it and writes it there (the page never picks a path).
- **Chat composition.** `buildDesktopHostConfig` reads the instance's playground theme
  (`useConfig((s) => s.theme).playground`) through `chatSettingsFromTheme`; client tools are the room's files,
  connectors and desktop tools; integrations are connectors and desktop tools;
  `DESKTOP_PANEL_COMPONENTS` is the file (`CHAT_FILE_PANEL_COMPONENTS`), room and connector
  panels, with none of the desktop's own.

## The window

- **The sidebar** (`DesktopNav`, on `@semoss/ui/next`'s `Sidebar`, `collapsible="icon"`): New
  chat, search, All Chats, Agents and Knowledge, then the chat history (`RoomHistory` from
  `@semoss/chat`, the same list the playground shows), then the account menu (settings, language,
  switch server, sign out, with the user and the instance named). It remembers whether it is open
  (`useCacheState`); opening a room's Workspace folds it to its rail through
  `useWorkspaceNavigation`, and closing the Workspace puts it back, as in the playground.
- **The title bar.** On macOS the window's title bar is hidden (`titleBarStyle: "Overlay"`) and the
  traffic lights float over the sidebar's top start corner (`trafficLightPosition`). The page keeps
  clear of them (`hasOverlayTitleBar()`: the sidebar's top band pads past them, and its rail is
  4.5rem wide so they never cover the page) and is the title bar itself: `installTitleBarDragging`
  drags the window from a press in the top 44px on a `header` (the rooms') or on app chrome marked
  `data-title-bar` (the sidebar's top, the full-window screens), and zooms it on a still double
  click, unless the press is on a control. Tauri's `data-tauri-drag-region` would need the
  attribute on the chat's own headers, which the host does not own. Windows and Linux keep their
  native title bar and none of this runs.
- **Links** with `target="_blank"` or `window.open` (every link the chat renders) open in the
  user's browser: `create_main_window` in `lib.rs` builds the main window (`create: false` in
  `tauri.conf.json`) with an `on_new_window` handler that hands http(s) and mailto addresses to the
  opener and denies the window. The app never opens a window for a page.
- **Shortcuts** (`useDesktopShortcuts`): ⌘N a new chat, ⌘, settings, ⌘B the sidebar (the
  sidebar's own); Ctrl off a Mac. A focused dialog keeps its keys.
- **Feel.** No rubber banding past the page's edges, the system's light or dark until the theme
  applies (no white flash on a dark desktop), sidebar chrome is not selectable, and the whole-window
  waits show their spinner only after a moment (`AppLoading`).
- Files dropped on the window reach the page (`dragDropEnabled: false`), so the composer takes
  them like a browser does.

## Security rules (hard)

- **Secrets live only in the system keychain** (`secret_get/set/delete`, service
  `semoss-desktop`, account `<instanceId>:<secret>`). Never put a token, cookie or secret in
  `localStorage`, `sessionStorage`, `preferences.json` or a log. Signing out deletes a remembered
  bearer token.
- **The bridge reaches only the instance in use** (origin and module path), GET/POST only, with an
  allowlist of request headers. Do not widen it to make a request work; route it through the SDK.
- **The invoke surface is the commands registered in `lib.rs`**, plus Tauri's window
  defaults and dragging/zooming the window (`core:window:allow-start-dragging`,
  `allow-toggle-maximize`). Sign in windows load remote pages and get no capability
  (`capabilities/default.json` lists only `main`).
- **CSP** (`tauri.conf.json`): scripts from the app only (plus wasm), connections only to IPC
  (all HTTP goes through Rust), frames for https pages and local ports (MCP tool views load the
  instance's portals). Adding an origin is a reviewed change.
- **Desktop tools ask before touching the user's disk** (`desktop_open_path` is `ask`; it reveals
  a path, never opens or runs it).

## Desktop tools

`createDesktopToolProvider()` implements the SDK's `ClientToolProvider`: its definitions go with
every chat turn and tool result beside the room's files tools (the send-twice invariant), its calls
run through Rust (`desktop_notify`, `desktop_reveal_path`), and its policy holds `ask` calls for the
chat tool card (`createDesktopToolsIntegration` presents them). Agent runs bring their own tools;
answer an agent's tool pause from the desktop with `RoomEngineConfig.onPendingAction`. To add a
tool: a definition and policy in `DESKTOP_TOOLS`, a Rust command registered in `lib.rs`, a test.
Local file read/write should port the allowlist + path-guard design from
`origin/feat-desktop-local-fs` (`8c3b17190`).

## Setup and workflow

The web side needs nothing beyond the workspace. The native side needs Rust and the Tauri CLI:

```bash
# once: Rust (https://rustup.rs) and the Tauri CLI
cargo install tauri-cli --version "^2" --locked
# macOS also needs the Xcode command line tools; Linux needs the webkit2gtk packages (Tauri docs)
```

| Command | What it does |
|---------|--------------|
| `pnpm dev` | The web bundle in a browser (no platform features), port 5181 |
| `pnpm tauri:dev` | The app in its window, against `pnpm dev` |
| `pnpm build` | The web bundle (`dist/`) |
| `pnpm tauri:build` | Installable bundles (`src-tauri/target/release/bundle/`) |
| `pnpm test`, `pnpm type-check` | The web side's tests and types |
| `cargo test` (in `src-tauri`) | The Rust side's tests |

Root: `pnpm dev:desktop` runs the web dev server with its workspace dependencies.

### Releasing

1. Bump `version` in `package.json` and `src-tauri/tauri.conf.json` (and `Cargo.toml`) together.
2. `pnpm tauri:build` on each target OS (macOS first; Windows when a runner exists).
3. Sign and notarize on macOS (`APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`,
   `APPLE_TEAM_ID` for `tauri build`); sign the Windows installer with the org's certificate.
4. Smoke the installed app: add an instance, sign in (native, OAuth, bearer), a chat turn with a
   folder tool and a desktop tool, Files, an export saved through the dialog, a connector viewer.

## Verification status

The web side is type-checked, tested (`pnpm test`) and builds. The Rust side compiles and its
tests pass locally (Rust 1.99, tauri-cli 2.12) and `pnpm tauri:dev` launches the app; it is not
built in this repository's CI. The window's behavior (dragging, the traffic lights' place, links
opening in the browser) has no automated test beyond `window-chrome.test.ts` and the Rust link
filter; check it by hand in `pnpm tauri:dev`.
