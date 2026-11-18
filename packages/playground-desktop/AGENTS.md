# AGENTS.md - @semoss/playground-desktop

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). The renderer is React: read the
> [React standard](../../skills/react-standard.skill.md) and the
> [chat guide](../../libs/chat/AGENTS.md) before changing it.

## Overview

The SEMOSS chat as an Electron app named "Playground" (`productName`, `org.semoss.chat`). It ships
the chat's UI and signs in to hosted SEMOSS servers: the user adds the first on first launch, and
can save more, each with its own sign in. Its renderer composes
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
                           COMMAND_CHANNEL, DesktopBridge, ServerCheckResult, SavedServers
    local-folders.ts       LocalFolderGrant, LocalFolderRef and the local file shapes
    server-connection.ts   ServerConfig, DEFAULT_MODULE, parseServerConfig, parseServerAddress,
                           formatServerAddress, isSameServer, isModulePath
  main/         Node: main.ts only wires the features below (and holds the production CSP)
    features/server-connection/   desktop-config (smss-desktop-config.json, below), server-sessions
                                  (one browser session per server), local-server (static files +
                                  proxy), check-server
    features/app-window/          app-window-host (the window, on the active server's session),
                                  main-window (remembered bounds), window-security
    features/auth/                sign-in-redirect
    features/ipc/                 handle-ipc (sender check), register-ipc
    features/downloads/           the save dialog, starting in Downloads
    features/local-folders/       folder-grants (smss-desktop-folders.json), local-fs (file calls kept
                                  inside each folder), folder-watchers, register-local-folders
    features/menu/                File (New Chat, Change Server…), Edit, View, Window
  preload/      preload.ts: an allowlisted invoke, the menu's commands and the tool frame origin,
                nothing else
  renderer/     the browser
    main.tsx      the connect screen until a server is saved, else Env.MODULE, Session.initialize()
                  and the router
    app.tsx       translations (desktopResources), theme, toasts; no session
    pages/        router, session-layout, app-layout, login, server, new-room, room
    features/     chat-config, commands, desktop-bridge, language, local-folders, navigation,
                  server-connection
```

`@/` is `src/renderer/`. The renderer reaches main only through `getDesktopBridge()`
(`window.semossDesktop`), which throws outside the Electron window.

## The renderer

- **Routes** (`pages/router.tsx`, a hash router): `SessionLayout` → `AppLayout` hold `/new`
  (`NewChat`, with `?prompt=`, `?workspaceId=`, `?knowledgeId=`) and `/room/:roomId` (`RoomScope`
  around `RoomFrame`, `RoomHeader`, `RoomWorkbench`, `RoomConversation`). `/login` and `/server`
  are outside the session gate, so both open signed out or when the server cannot be read;
  anything else goes to `/new`.
- **`SessionLayout`** waits while the session is `INITIALIZING`, sends `UNAUTHENTICATED` to
  `/login` (and back after), and on `ERROR` names the saved server and offers Retry
  (`useSessionRetry`) or Change server.
- **`AppLayout`** builds the chat's config (`useDesktopChatConfig`), makes the chat store from
  it (`useCreateChatStore(config)`), and provides both with `ChatSessionProvider` and
  `ChatConfigProvider`, around the settings dialog, `DesktopSidebar` and the route. It holds the
  dialog's state (`useUserSettingsDialog`), and routes the menu's `DesktopCommand`s
  (`useDesktopCommands`: `new-chat` → `/new`, `change-server` → `/server`). The web app's
  `AppLayout` is its counterpart.
- **`useDesktopChatConfig`** is the chat's config: the server's theme over the chat's defaults
  (`useServerChatTheme`); `options` with `roomHref` (`#/room/<id>`) and the tool frame origin,
  and no new-chat defaults, platform URL or `agentHref`; `callbacks` with `onOpenRoom`,
  `onOpenNewChat` and `onOpenSettings`; `tools`, the desktop's tools host over the folders the
  user attaches (one per window); and `components`: `DesktopPlusMenu` (the chat's items, with
  Attach Folder under Attach Files) and `DesktopSlashCommands` (the chat's commands, then Attach
  Folder), each in its own file in `features/chat-config/`.
- **The settings dialog** is the chat's `UserSettingsDialog`, which `AppLayout` hands its pages:
  the chat's own (`useDefaultSettingsPages`: General, Connectors), then **Servers**
  (`features/server-connection/use-server-settings-section.tsx`), which lists the saved servers
  and adds one. To add another page, add it to that list; see
  [The settings dialog](../../libs/chat/README.md#the-settings-dialog).
- **`DesktopSidebar`** (`features/navigation/`): New chat, `RoomList` and `RoomSearchDialog`
  (Cmd/Ctrl+K through `useRoomSearchShortcut`), and the account menu: Settings and Sign out.
  Servers are managed on the settings dialog's Servers page, not from the menu. Room and
  new-chat headers start with its `SidebarTrigger`.
- **The server screen** (`ServerConnectView` on `/server`, and alone on first launch) is the
  page for when there is no session: before a server is saved, signed out, or when the server
  cannot be read. It and the settings dialog's Servers page both render `ServerSettings`: the
  saved servers (`SavedServerList`: Activate, and Remove after a confirm dialog) above a form that
  adds one. The dialog's page passes `layout="section"`, which makes Connect small and puts it
  at the form's end. The form takes one address, such as `https://semoss.example.com/Monolith`:
  `parseServerAddress` splits it into the origin and the module (no path means `/Monolith`), the
  main process checks it, then saves it and switches to it. `useSavedServers` reads the list. The login page
  names the saved server and links to `/server`, since a wrong address only shows up there.

## How it reaches the server

- **One origin.** The main process runs a local HTTP server on `127.0.0.1` that serves the
  renderer (production) or forwards to electron-vite's dev server (development), and forwards
  the server's module path (`/Monolith` by default), HTTP and WebSocket, to the saved server with
  `http-proxy-3`. The SDK's same-origin `${MODULE}/...` calls, cookies, and the insight socket work
  unchanged; the SDK needs no desktop code.
- **Tool views are framed from a second origin.** A second listener on `127.0.0.1` (the tool
  frame origin) forwards only the module, never the app's files. The preload hands its origin to
  the page (`bridge.toolFrameOrigin`, from a window argument main sets), and the chat frames
  portal and declared pages from it (`ChatConfig.toolFrameOrigin`). Being another origin, a
  tool's page cannot script the app's page or reach `window.semossDesktop`; it talks to the chat
  only by `postMessage` (`SMSS_INIT_TOOL`, `SMSS_EXEC_TOOL`). Cookies ignore the port, so it is
  still signed in. `routeSignInsThroughApp` sends a frame's, or a tool view's, request for the
  server back to this origin.
- **Server pages are sandboxed on the app's origin.** Every module response there, except the
  server's sign in under `${module}/api/auth/`, carries `Content-Security-Policy: sandbox ...`
  (`MODULE_PAGE_SANDBOX`), so a server page that renders on it runs on an opaque origin. Calls
  and scripts ignore the policy.
- **The ports are saved** in the config file and reused, since cookies and storage belong to the
  origin, port included. A taken port gets a new one, which costs a sign in (or, for the tool
  frame port, tool views' storage).
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
  window (`isSignInPopup`, or `isConnectPopup` for a connector's sign in, which the SDK opens
  blank as `semoss-connect` before sending it to the sign in), which the SDK watches as it does
  on the web.
- **Checking a server** (`checkServer`) fetches its `/api/config` without cookies, without
  following redirects, and with a 10 second timeout; anything but a JSON object is refused with a
  message naming the URL.
- **Several servers, one sign in each.** Every saved server has its own Electron session
  partition (`persist:server-<uuid>`), so its cookies and storage, theme and room list choices
  included, never mix with another's. A window's session is fixed when it is made, so switching
  (`server-connection:set`) opens a new window where the old one was and closes the old one; the
  proxy and the sign-in redirect follow the active server. Switching back needs no sign in.
- **Removing a server** (`server-connection:forget`) drops it from the config and clears its
  session's storage and cache; removing the active one first switches to the next saved server,
  or the connect screen. Its emptied `Partitions/server-<uuid>` folder is deleted on the next
  launch (`removeUnusedPartitions`), since Electron holds it while running.
- **Before a server is saved**, module requests answer 503 and the renderer shows the connect
  screen.

## What it saves

Everything lives in Electron's `userData` folder, named after the app:
`~/Library/Application Support/Playground` on macOS (`%APPDATA%\Playground` on Windows,
`~/.config/Playground` on Linux), shared by dev and the packaged app.

- **`smss-desktop-config.json`** (`desktop-config.ts`, written atomically): `version` (1),
  `servers` (each `url`, `module`, `partition`), `active` (the active server's partition), `port`,
  `toolFramePort`, `window` (bounds, maximized), and `language` (a base code such as `en`). No credentials.
  The renderer applies the saved language before the first paint and saves every switch
  (`features/language/sync-language.ts`, over `language:get` and `language:set`), so every
  server and the connect screen share one language rather than each partition's
  `smss-language`.
- **`Partitions/server-<uuid>/`**: each saved server's cookies, local and session storage, and
  caches.
- **`smss-desktop-folders.json`** (`folder-grants.ts`, written atomically): the folders attached
  to rooms, `{ version: 1, servers: { [partition]: { [roomId]: [{ id, name, path }] } } }`.
  Removing a server forgets its folders; the folders themselves are never touched.
- **The default session** (the folder's own `Cookies`, `Local Storage`, …): only the connect
  screen, before any server is saved; no server signs in with it.

## Security

`contextIsolation` and `sandbox` on, `nodeIntegration` off. The main window stays on the app's
own page (`isAppPage`: `/` on the local origin, never a server page under the module); other
links open in the system browser (http, https, mailto only, `isExternalLink`). Every IPC handler
checks that the call comes from the app's page in its top frame (`isTrustedSender`) and validates
its arguments (`parseServerConfig`, `isExternalLink`). No server page runs on the app's origin as
that origin: tool views are framed from the tool frame origin, and anything else is sandboxed
(see [How it reaches the server](#how-it-reaches-the-server)). A server is https, or http only on this
machine, and a module path is plain path segments, so the proxy never forwards outside it.
Production HTML carries a Content-Security-Policy (`main.ts`); it allows `'unsafe-eval'` because
Monaco, Mermaid and the Office viewers need it, which is why Electron's dev build warns that it is
insecure. A second launch focuses the running window.

The packaged app encrypts its cookie store (`electronFuses.enableCookieEncryption` in
`electron-builder.yml`), with a key in the OS keychain (macOS: "Playground Safe Storage", from
the app's name). The fuse is one way: turning it off leaves saved cookies unreadable. `pnpm dev`
runs Electron's own binary, whose fuses are not flipped, so dev cookies stay plaintext. Dev and
the packaged app share one data folder (above).

## Local folders

A room can attach folders from this machine. The app gives them to the chat as
[client tools](../../libs/chat/docs/tools.md#client-tools), all in
`renderer/features/local-folders/`:

- `desktop-folders-host.ts` is the `LocalFoldersHost` (`local-folders-host.ts`) over the
  `local-folders:*` and `local-fs:*` channels.
- `desktop-tools-host.ts` (`createDesktopToolsHost`) is the chat's `ToolsHost`, made once per
  window in `useDesktopChatConfig`. It keeps a `RoomLocalFoldersStore` per room the chat has
  open, offers the `desktop_*` tools over the room's folders (`DesktopFolders`, each folder a
  top level entry, with the chat's `describeFolderTool` and `executeFolderTool`; each follows the
  `folder_*` setting that does the same), lists the folders in Files under Desktop
  (`desktop-host-files.tsx`: Attach Folder, Show in Finder, Open with Default App, Detach), and
  detaches a new chat's folders when it is left before its first message.
- Attach Folder in the plus menu (`AttachFolderMenuItem`) and "/" (`AttachFolderCommand`) attach
  to an open room, or to the room a new chat prepares (`useComposer().prepareRoom()`), then show
  Files.
- Its strings are in the `desktop` namespace, under `localFolders`.

- **Only the system's folder picker attaches a folder** (`local-folders:pick`, parented to the
  window). The page never sends a path on the machine: a file call names `{ roomId, folderId }`
  and a path inside the folder, for the server in use.
- **Every path stays inside its folder** (`resolveInsideFolder`): leading slashes are dropped,
  `..` and other drives are refused, symbolic links are followed as far as the path exists and
  refused when they lead out, and `.git` is hidden and refused. The folder itself is never
  written, moved or deleted. Reads stop at 50 MB.
- **Deleting moves to the trash** (`shell.trashItem`). Open and Show in Finder go through
  `shell.openPath` and `shell.showItemInFolder`.
- **Watching** (`local-folders:watch`, counted, one `unwatch` each) sends
  `local-folders-changed` `DesktopCommand`s, gathered for 200 ms. Switching or removing a server
  closes its watchers.

## Adding an IPC channel

1. Add the channel to `IpcContract` and to `IPC_CHANNEL_LIST` below it
   (`contract/ipc-contract.ts`); the compiler fails until both have it, and the preload allowlists
   the list.
2. Register it with `handleIpc`, validating every argument, since they arrive as `unknown`: in
   `main/features/ipc/register-ipc.ts`, or `main/features/local-folders/register-local-folders.ts`
   for a `local-folders:*` or `local-fs:*` channel.
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
- **No agent or knowledge pages**: chat UI hides agent links (no `agentHref`). The settings
  dialog is here, so connectors are switched on in the app; signing in to a connector from the
  desktop app has not been tried against a real server.
- **Offline mode and local MCP over stdio** would live in the main process, behind new
  `IpcContract` channels, with the chat reaching them through `ChatConfig`, as the local folders
  do.
