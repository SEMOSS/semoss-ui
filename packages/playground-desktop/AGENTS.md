# AGENTS.md - @semoss/playground-desktop

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). The renderer is React: read the
> [React standard](../../skills/react-standard.skill.md) and the
> [chat guide](../../libs/chat/AGENTS.md) before changing it.

## Overview

The SEMOSS chat as an Electron app ("SEMOSS Chat", `org.semoss.chat`). It ships the chat's UI and
signs in to a hosted SEMOSS server, which the user picks on first launch. Its renderer composes
`@semoss/chat`'s pieces as the playground does (see the chat's [README](../../libs/chat/README.md)),
so rooms, the room list, search, and new chats behave the same, and a room made in one app shows
in the other's list. Every dependency is a dev dependency: electron-vite bundles them.

## Layout

The three Electron processes build separately (electron-vite), so each has its own folder, and a
feature keeps its name across them:

```
src/
  contract/     types, constants and pure functions every process imports (no electron, no react)
    ipc-contract.ts        IpcContract (channel → request/response), IPC_CHANNELS, DesktopCommand,
                           COMMAND_CHANNEL, DesktopBridge, ServerCheckResult
    server-connection.ts   ServerConfig, DEFAULT_MODULE, parseServerConfig, parseServerAddress,
                           formatServerAddress, isModulePath
  main/         Node: main.ts only wires the features below (and holds the production CSP)
    features/server-connection/   settings-file (userData/desktop-settings.json: server, port,
                                  window), local-server (static files + proxy), check-server
    features/app-window/          main-window (remembered bounds), window-security
    features/auth/                sign-in-redirect
    features/ipc/                 handle-ipc (sender check), register-ipc
    features/downloads/           the save dialog, starting in Downloads
    features/menu/                File (New Chat, Change Server…), Edit, View, Window
  preload/      preload.ts: an allowlisted invoke and the menu's commands, nothing else
  renderer/     the browser
    main.tsx      the connect screen until a server is saved, else Env.MODULE, Session.initialize()
                  and the router
    app.tsx       translations (desktopResources), theme, toasts; no session
    pages/        router, session-layout, desktop-layout, login, server, new-room, room
    features/     chat-config, commands, desktop-bridge, server-connection, sidebar
```

`@/` is `src/renderer/`. The renderer reaches main only through `getDesktopBridge()`
(`window.semossDesktop`), which throws outside the Electron window.

## The renderer

- **Routes** (`pages/router.tsx`, a hash router): `SessionLayout` → `DesktopLayout` hold `/new`
  (`NewChat`, with `?prompt=`, `?workspaceId=`, `?knowledgeId=`) and `/room/:roomId` (`RoomScope`
  around `RoomFrame`, `RoomHeader`, `RoomWorkbench`, `RoomConversation`). `/login` and `/server`
  are outside the session gate, so both open signed out or when the server cannot be read;
  anything else goes to `/new`.
- **`SessionLayout`** waits while the session is `INITIALIZING`, sends `UNAUTHENTICATED` to
  `/login` (and back after), and on `ERROR` names the saved server and offers Retry
  (`useSessionRetry`) or Change server.
- **`DesktopLayout`** makes the chat store (`useCreateChatStore`) and provides it with
  `ChatSessionProvider` and `ChatConfigProvider`, around `DesktopSidebar` and the route, and routes
  the menu's `DesktopCommand`s (`useDesktopCommands`: `new-chat` → `/new`, `change-server` →
  `/server`).
- **`useDesktopChatConfig`** is the chat's config: the server's `THEME_MAP` `playground` entry over
  `DEFAULT_CHAT_THEME`, no new-chat defaults of its own, an empty `platformUrl`, and navigation
  with `openRoom`, `roomHref` (`#/room/<id>`), `openNewChat` and `onRoomDeleted`; no `agentHref`
  or `openSettings`.
- **`DesktopSidebar`**: New chat, `RoomList` and `RoomSearchDialog` (Cmd/Ctrl+K through
  `useRoomSearchShortcut`), and the account menu (Change server, Sign out). Room and new-chat
  headers start with its `SidebarTrigger`.
- **The server form** (`ServerConnectView`) takes one address, such as
  `https://semoss.example.com/Monolith`: `parseServerAddress` splits it into the origin and the
  module (no path means `/Monolith`), the main process checks it, then saves it. The login page
  names the saved server and links to `/server`, since a wrong address only shows up there.

## How it reaches the server

- **One origin.** The main process runs a local HTTP server on `127.0.0.1` that serves the
  renderer (production) or forwards to electron-vite's dev server (development), and forwards
  the server's module path (`/Monolith` by default), HTTP and WebSocket, to the saved server with
  `http-proxy-3`. The SDK's same-origin `${MODULE}/...` calls, cookies, and the insight socket work
  unchanged; the SDK needs no desktop code.
- **The port is saved** in the settings file and reused, since cookies and storage belong to the
  origin, port included. A taken port gets a new one, which costs a sign in.
- **Cookies and redirects** (`localizeCookie`). The proxy drops the server's cookie `Domain` and
  `Secure`, and turns `SameSite=None` into `Lax` (the browser sees plain http on loopback; the
  proxy still uses the server's https). A cookie with no lifetime, such as the session, gets a
  30-day `Max-Age` so a restart does not sign the user out; the server's own session timeout still
  ends it. `autoRewrite` brings the server's redirects back to the local origin. Cookies are
  flushed before quitting.
- **SSO.** The SDK opens its sign in popup on the local origin (`/api/auth/login/<provider>`), so
  the server's session cookie belongs to it. The provider calls back to the server's registered
  address, which `routeSignInsThroughApp` (`webRequest.onBeforeRequest`) redirects to the same path
  on the local origin, so the callback carries that session. The popup is a sandboxed child
  window (`isSignInPopup`), which the SDK watches as it does on the web.
- **Checking a server** (`checkServer`) fetches its `/api/config` without cookies, without
  following redirects, and with a 10 second timeout; anything but a JSON object is refused with a
  message naming the URL.
- **Changing servers** (File > Change Server…, the account menu, the login page, or the session
  error screen, all on `/server`) checks the new server, saves it, clears the browser session's
  storage and cookies when the server differs from the saved one, and reloads.
- **Before a server is saved**, module requests answer 503 and the renderer shows the connect
  screen.

## Security

`contextIsolation` and `sandbox` on, `nodeIntegration` off. The main window stays on the local
origin; other links open in the system browser (http, https, mailto only, `isExternalLink`).
Every IPC handler checks the calling frame's origin (`isTrustedSender`) and validates its
arguments (`parseServerConfig`, `isExternalLink`). A server is https, or http only on this
machine, and a module path is plain path segments, so the proxy never forwards outside it.
Production HTML carries a Content-Security-Policy (`main.ts`); it allows `'unsafe-eval'` because
Monaco, Mermaid and the Office viewers need it, which is why Electron's dev build warns that it is
insecure. A second launch focuses the running window.

## Adding an IPC channel

1. Add the channel to `IpcContract` and `IPC_CHANNELS` (`contract/ipc-contract.ts`); the preload
   allowlists that array.
2. Register it in `main/features/ipc/register-ipc.ts` with `handleIpc`, validating every argument:
   they arrive as `unknown`.
3. Call it from the renderer with `getDesktopBridge().invoke(channel, ...)`.

Main → renderer messages are `DesktopCommand`s on `COMMAND_CHANNEL`, heard with
`bridge.onCommand`.

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | electron-vite dev (renderer HMR on 127.0.0.1:5181) |
| `pnpm build` | Build main, preload, and renderer into `out/` |
| `pnpm preview` | Run the built app |
| `pnpm package` | Build, then an unpacked app in `release/` (`electron-builder --dir`) |
| `pnpm dist` | Build, then installers (dmg/zip, NSIS, AppImage) |
| `pnpm test` | Contract and main-process tests (node, opted into per file), renderer tests (jsdom) |
| `pnpm type-check` | The renderer (`tsconfig.json`), then main/preload/contract under `strict` (`tsconfig.node.json`) |

The root `pnpm dev:playground-desktop` runs `dev` with its dependencies.

**Releasing a test build (temporary).** Bump `version` here, then run `pnpm release` in this
package (`scripts/release.sh`). It builds installers for the current OS (macOS: arm64 and x64),
offers to push the branch, and attaches them to the GitHub pre-release `desktop-v<version>`;
re-running for the same version replaces its files. `--draft` makes a draft release and
`--skip-build` re-uploads what is in `release/`.

**The app icon** is `resources/icon.png` (1024×1024), electron-builder's build resources folder,
from which it makes the macOS, Windows, and Linux icons. Edit `resources/icon.svg` (the SEMOSS mark
on a macOS-style tile) and regenerate the PNG with the command in its header.

`electron.vite.config.ts` imports `@semoss/config` and `@semoss/panels/vite` by path: electron-vite
bundles its config but leaves packages external, and Node cannot run the workspace's TypeScript
sources. That is why the shared config's build plugins are dev dependencies here, and why the
`ai` stub alias names its real path. `vitest.config.ts` uses the packages normally.

## Not here yet

- **Signing and notarization** come only from the environment (`CSC_LINK`, `CSC_KEY_PASSWORD`,
  `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`, `WIN_CSC_LINK`); without them builds
  are unsigned. No CI job builds the app.
- **Auto update**: add `electron-updater` in `main/features/updates/` with a generic feed.
- **Deep links** (`semoss-playground://`): register the protocol in `main/features/menu` or a new
  `commands` feature, and send `DesktopCommand`s like the menu does.
- **The platform URL** is empty, so tool views that load a BLOCKS app from the platform show their
  default form; forward the platform's path like the module, or make it a server setting.
- **No agent pages, knowledge pages, or settings dialog**: chat UI hides their links
  (`agentHref`, `openSettings`), so connectors are switched on from the web app.
- **Offline mode and local MCP over stdio** would live in the main process, behind new
  `IpcContract` channels, with the chat reaching them through `ChatConfig`.
