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
a native HTTP bridge, sign in windows, the keychain, native downloads, desktop tools, and the
browser panel.

The web bundle carries **no Tauri npm packages**: `app.withGlobalTauri` exposes the JavaScript API
on `window.__TAURI__`, typed in `src/platform/tauri.ts`. Outside the shell (a browser during
`pnpm dev`) the platform features fall back or switch off (`isTauriRuntime`).

## Structure

| Path | Purpose |
|------|---------|
| `src/main.tsx`, `src/app.tsx` | Boot: read the saved instances; with one in use, configure the SDK and start the session, then render the router; otherwise the instance picker |
| `src/platform/` | The platform layer: `tauri.ts` (typed global API), `fetch-bridge.ts`, `sdk-host.ts`, `auth-window.ts`, `keychain.ts`, `downloads.ts`, `app-store.ts` |
| `src/features/instances/` | `InstanceStore` (Observable, persisted in `preferences.json`), the picker page and form, `checkInstance` |
| `src/features/auth/` | Login: the SDK's `SessionLoginForm` plus a bearer token form |
| `src/features/desktop-tools/` | `createDesktopToolProvider()` (a `ClientToolProvider`) and its integration for the chat tool card |
| `src/features/desktop-panels/` | The browser panel and its integration (rail + Open a Panel) |
| `src/host/` | `build-desktop-host-config.ts`, `desktop-panel-components.ts`, `desktop-preferences.ts` |
| `src/pages/` | Router, gating layouts, desktop layout and nav, thin route pages |
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
  connectors and desktop tools; integrations are connectors, desktop tools and desktop panels;
  `DESKTOP_PANEL_COMPONENTS` adds the browser panel to the file (`CHAT_FILE_PANEL_COMPONENTS`),
  room and connector panels.

## Security rules (hard)

- **Secrets live only in the system keychain** (`secret_get/set/delete`, service
  `semoss-desktop`, account `<instanceId>:<secret>`). Never put a token, cookie or secret in
  `localStorage`, `sessionStorage`, `preferences.json` or a log. Signing out deletes a remembered
  bearer token.
- **The bridge reaches only the instance in use** (origin and module path), GET/POST only, with an
  allowlist of request headers. Do not widen it to make a request work; route it through the SDK.
- **The invoke surface is the commands registered in `lib.rs`.** Sign in windows load remote
  pages and get no capability (`capabilities/default.json` lists only `main`).
- **CSP** (`tauri.conf.json`): scripts from the app only (plus wasm), connections only to IPC
  (all HTTP goes through Rust), frames for https pages (the browser panel). Adding an origin is a
  reviewed change.
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

## Browser panel

`BrowserPanel` is an iframe panel (`mount: "keepAlive"`, as the workbench requires for frames)
with an address bar; its address is the panel's config, so each room keeps its own and it survives
closing the Workspace. Only http(s) addresses load, in a sandboxed frame. Sites that refuse framing
(`X-Frame-Options`, `frame-ancestors`) do not show. A v2 would embed Tauri child webviews
(unstable multiwebview API).

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

The web side is type-checked, tested (`pnpm test`) and builds. The Rust side has not been compiled
in this repository's CI or by the agent that wrote it (no Rust toolchain was available); run
`cargo test` and `pnpm tauri:dev` before relying on it, and expect small API fixes.
