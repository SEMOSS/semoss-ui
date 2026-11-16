# AGENTS.md - @semoss/playground-desktop

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). The renderer is React: read the
> [React standard](../../skills/react-standard.skill.md) and the
> [chat guide](../../libs/chat/AGENTS.md) before changing it.

## Overview

The SEMOSS chat as an Electron app ("SEMOSS Chat"). It ships the chat's UI and signs in to a
hosted SEMOSS server, which the user picks on first launch. Its renderer composes
`@semoss/chat` exactly as the playground does, so rooms, the room list, search, and new chats
behave the same, and a room made in one app shows in the other's list.

## Layout

The three Electron processes build separately (electron-vite), so each has its own folder, and a
feature keeps its name across them:

```
src/
  contract/     types, constants and pure functions every process imports (no electron, no react)
    ipc-contract.ts        IpcContract (channel → request/response), IPC_CHANNELS, DesktopCommand, DesktopBridge
    server-connection.ts   ServerConfig, parseServerConfig, isModulePath
  main/         Node: main.ts only wires the features below
    features/server-connection/   settings-file (userData/desktop-settings.json), local-server, check-server
    features/app-window/          main-window (remembered state), window-security
    features/auth/                sign-in-redirect
    features/ipc/                 handle-ipc (sender check), register-ipc
    features/downloads/  features/menu/
  preload/      preload.ts: an allowlisted invoke and the menu's commands, nothing else
  renderer/     the browser: main.tsx (connect screen or app), app.tsx, pages/, features/
```

## How it reaches the server

- **One origin.** The main process runs a local HTTP server on `127.0.0.1` that serves the
  renderer (production) or forwards to electron-vite's dev server (development), and forwards
  the server's module path (`/Monolith` by default), HTTP and WebSocket, to the saved server with
  `http-proxy-3`. The SDK's same-origin `${MODULE}/...` calls, cookies, and the insight socket work
  unchanged; the SDK needs no desktop code.
- **The port is saved** in the settings file and reused, since cookies and storage belong to the
  origin, port included. A taken port gets a new one, which costs a sign in.
- **Cookies and redirects.** The proxy drops the server's cookie `Domain`, and `Secure` and
  `SameSite=None` (the browser sees plain http on loopback; the proxy still uses the server's
  https). `autoRewrite` brings the server's redirects back to the local origin.
- **SSO.** The SDK opens its sign in popup on the local origin (`/api/auth/login/<provider>`), so
  the server's session cookie belongs to it. The provider calls back to the server's registered
  address, which `routeSignInsThroughApp` (`webRequest.onBeforeRequest`) redirects to the same path
  on the local origin, so the callback carries that session. The popup is a sandboxed child
  window, which the SDK watches as it does on the web.
- **Changing servers** (File > Change Server, or the account menu) checks the new server's
  `/api/config`, saves it, clears the browser session's storage and cookies, and reloads.
- **Before a server is saved**, module requests answer 503 and the renderer shows the connect
  screen.

## Security

`contextIsolation` and `sandbox` on, `nodeIntegration` off. The main window stays on the local
origin; other links open in the system browser (http, https, mailto only). Every IPC handler
checks the calling frame's origin and validates its arguments (`parseServerConfig`). Production
HTML carries a Content-Security-Policy (`main.ts`); it allows `'unsafe-eval'` because Monaco,
Mermaid and the Office viewers need it, which is why Electron's dev build warns that it is
insecure. A second launch focuses the running window.

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | electron-vite dev (renderer HMR on 127.0.0.1:5181) |
| `pnpm build` | Build main, preload, and renderer into `out/` |
| `pnpm package` | Build, then an unpacked app in `release/` (`electron-builder --dir`) |
| `pnpm dist` | Build, then installers (dmg/zip, NSIS, AppImage) |
| `pnpm test` | Contract and main-process tests (node), renderer tests (jsdom) |
| `pnpm type-check` | The renderer, then main/preload/contract under `strict` |

The root `pnpm dev:playground-desktop` runs `dev` with its dependencies.

`electron.vite.config.ts` imports `@semoss/config` and `@semoss/panels/vite` by path: electron-vite
bundles its config but leaves packages external, and Node cannot run the workspace's TypeScript
sources. That is why the shared config's build plugins are dev dependencies here, and why the
`ai` stub alias names its real path.

## Not here yet

- **Signing and notarization** come only from the environment (`CSC_LINK`, `CSC_KEY_PASSWORD`,
  `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`); without them builds are unsigned.
  There is no app icon yet (`resources/`), and no CI job builds the app.
- **Auto update**: add `electron-updater` in `main/features/updates/` with a generic feed.
- **Deep links** (`semoss-playground://`): register the protocol in `main/features/menu` or a new
  `commands` feature, and send `DesktopCommand`s like the menu does.
- **The platform URL** is empty, so tool views that load a BLOCKS app from the platform show their
  default form; forward the platform's path like the module, or make it a server setting.
- **No agent pages, knowledge pages, or settings dialog**: chat UI hides their links
  (`agentHref`, `openSettings`).
- **Offline mode and local MCP over stdio** would live in the main process, behind new
  `IpcContract` channels, with the chat reaching them through `ChatConfig`.
