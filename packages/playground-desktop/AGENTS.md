# AGENTS.md - @semoss/playground-desktop

> **Inherits from:** [root AGENTS.md](../../AGENTS.md). The renderer is React: read the
> [React standard](../../skills/react-standard.skill.md) and the
> [chat guide](../../libs/chat/AGENTS.md) before changing it.

## Overview

The SEMOSS chat as an Electron app named "Playground" (`productName`, `org.semoss.chat`). It ships
the chat's UI and signs in to hosted SEMOSS servers: the user adds the first on first launch, and
can save more, each with its own sign in. Its renderer composes
`@semoss/chat`'s pieces as the playground does (see the chat's [README](../../libs/chat/README.md)),
so rooms, the room history and its search, and new chats behave the same, and a room made in one app shows
in the other's list. Every dependency is a dev dependency: electron-vite bundles them.

## Layout

The three Electron processes build separately (electron-vite), so each has its own folder, and a
feature keeps its name across them:

```
src/
  contract/     types, constants and pure functions every process imports (no electron, no react)
    ipc-contract.ts        IpcContract (channel → request/response), IPC_CHANNELS, DesktopCommand,
                           COMMAND_CHANNEL, DesktopBridge, ServerCheckResult, SavedServers,
                           TOOL_FRAME_ORIGIN_ARG, TOOL_FRAME_HOST, isToolFrameOrigin
    local-folders.ts       LocalFolderGrant, LocalFolderRef, isLocalFolderRef, isLocalFolderId and
                           the local file shapes
    server-connection.ts   ServerConfig, DEFAULT_MODULE, parseServerConfig, parseServerAddress,
                           formatServerAddress, isSameServer, isModulePath, platformPathFor,
                           isPlatformPath, isPlainPath
  main/         Node: main.ts only wires the features below
    features/trust-boundaries/    the checks between the zones (see Trust boundaries): ipc-sender,
                                  permissions, web-contents, web-requests, tool-frame-isolation,
                                  content-security-policy; zones holds the helpers they share
    features/server-connection/   desktop-config (smss-desktop-config.json, below), server-sessions
                                  (one browser session per server), local-server (static files +
                                  proxy), tool-cookies (tool views' sign in), check-server
    features/app-window/          app-window-host (the window, on the active server's session),
                                  main-window (remembered bounds), window-security
    features/auth/                sign-in-redirect (where a server URL comes back to)
    features/ipc/                 handle-ipc (every handler behind the sender check), register-ipc
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
    pages/        router, session-layout, app-layout, login, server, new-chat, room
    features/     chat-config, commands, desktop-bridge, language, local-folders, navigation,
                  server-connection
```

`@/` is `src/renderer/`. The renderer reaches main only through `getDesktopBridge()`
(`window.semossDesktop`), which throws outside the Electron window.

## The renderer

- **Routes** (`pages/router.tsx`, a hash router): `SessionLayout` → `AppLayout` hold `/new`
  (`NewChat`, with `?prompt=`, `?workspaceId=`, `?knowledgeId=`, and the server theme's banner,
  landing image and landing) and `/room/:roomId` (`RoomScope`
  around `RoomFrame`, `RoomHeader`, `RoomWorkbench`, `RoomConversation`). `/login` and `/server`
  are outside the session gate, so both open signed out or when the server cannot be read;
  anything else goes to `/new`.
- **`SessionLayout`** waits while the session is `INITIALIZING`, sends `UNAUTHENTICATED` to
  `/login` (and back after), and on `ERROR` names the saved server and offers Retry
  (`useSessionRetry`) or Change server.
- **`AppLayout`** makes the window's tools host and provides it (`DesktopToolsContext`,
  `features/local-folders/desktop-tools.context.tsx`), builds the chat's config
  (`useHostChatConfig`) and hands it to `ChatProvider`, around the settings dialog,
  `AppNavigation` and the route. It holds the dialog's state (`useUserSettingsDialog`), folds the
  sidebar while a room's Workspace is open (the chat's `useWorkbenchNavigation`), and routes the menu's `DesktopCommand`s
  (`useDesktopCommands`: `new-chat` → `/new`, `change-server` → `/server`). The web app's
  `AppLayout` is its counterpart.
- **`useHostChatConfig`** is the chat's config. It owns what the server's playground theme
  (`usePlaygroundServerTheme` from `@semoss/shared`) means for the chat: `options` are the theme
  as the chat's options (`playgroundThemeChatOptions` from `@semoss/shared`, as the web app
  does), with `roomHref`
  (`#/room/<id>`), the tool frame origin, and the platform URL on that origin
  (`platformPathFor`), `catalogItemHref` where `showPlatformLinks` is on, and no `agentHref`;
  `workbenchPanels` without the activity log where the theme turns `showActivityLog` off;
  `callbacks` with `onOpenRoom`, `onOpenNewChat`, `onOpenSettings`, and
  `onWorkbenchOpenChange`; `tools`, the tools host `AppLayout` makes; and `components`: `DesktopPlusMenu` (the chat's items, with
  Attach Folder under Attach Files) and `DesktopSlashCommands` (the chat's commands, then Attach
  Folder), each in its own file in `features/chat-config/`.
- **The settings dialog** is the chat's `UserSettingsDialog`, which `AppLayout` hands its
  sections: the chat's own (`useDefaultUserSettingsSections`: General, Connectors; light only
  where the theme turns `enableDarkMode` off), then **Servers**
  (`features/server-connection/use-server-settings-section.tsx`), which lists the saved servers
  and adds one. To add another section, add it to that list; see
  [The settings dialog](../../libs/chat/README.md#the-settings-dialog).
- **`AppNavigation`** (`features/navigation/app-navigation.tsx`): New chat, `RoomHistory` (with
  its Cmd/Ctrl+K search, and dates where the theme's `chatHistoryDate` is on), left out where the
  server's theme hides the chat history, and the account menu: Settings (the `onOpenSettings`
  prop) and Sign out. The room page puts `RoomSuggestions` in `RoomConversation`'s `suggestions`
  where the theme's `enableSuggestions` is on.
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

- **Two local origins.** The app origin carries the page, its calls and its sockets; the tool
  frame origin (below) carries tool views. The main process runs a local HTTP server on
  `127.0.0.1` that serves the
  renderer (production) or forwards to electron-vite's dev server (development), and forwards
  the server's module path (`/Monolith` by default), HTTP and WebSocket, to the saved server with
  `http-proxy-3`. The SDK's same-origin `${MODULE}/...` calls, cookies, and the insight socket work
  unchanged; the SDK needs no desktop code.
- **Tool views are framed from a second origin, another site.** A second listener (the tool
  frame origin, `http://tools.localhost:<port>`, on 127.0.0.1 and ::1) forwards only the module
  and the platform (`platformPathFor`: beside the module, `/cfg-ai-dev/Monolith` →
  `/cfg-ai-dev/SemossWeb/packages/client/dist`), never the app's files, so low code apps load
  there too. The preload hands its origin to the page (`bridge.toolFrameOrigin`, from a window
  argument main sets), and the chat frames portal and declared pages from it
  (`ChatConfig.toolFrameOrigin`). `tools.localhost` is another site than `127.0.0.1`, so a tool
  runs in another renderer process (see [Trust boundaries](#trust-boundaries)); it talks to the
  chat only by `postMessage` (`SMSS_INIT_TOOL`, `SMSS_EXEC_TOOL`), as on the web. It is signed in
  by the proxy, not by the browser (`tool-cookies.ts`): it sends the app's cookies for the path,
  then the tool's own, and keeps what the server sets in the app's jar, so a tool's page never
  holds the user's cookies. It answers only the app's window, by a per-launch key
  (`web-requests.ts`). Its responses lose any `X-Frame-Options`, since a server's `SAMEORIGIN`
  would block the frame, and get `Content-Security-Policy: frame-ancestors 'self' <app origin>`
  and `Origin-Agent-Cluster: ?1`. A frame's, or a tool view's, request for the server's own
  address comes back to this origin (`sign-in-redirect.ts`).
- **Server pages are sandboxed on the app's origin.** Every module response there, except the
  server's sign in under `${module}/api/auth/`, carries `Content-Security-Policy: sandbox ...`
  (`MODULE_PAGE_SANDBOX`), so a server page that renders on it runs on an opaque origin. Calls
  and scripts ignore the policy.
- **The ports are saved** in the config file and reused, since storage belongs to the origin,
  port included. A taken port gets a new one, which costs tool views' storage (the tool frame
  port) or the page's own storage (the app's). Cookies ignore the port, so the sign in stays.
- **Cookies and redirects** (`localizeCookie`). The proxy drops the server's cookie `Domain` and
  `Secure`, and turns `SameSite=None` into `Lax` (the browser sees plain http on loopback; the
  proxy still uses the server's https). A cookie with no lifetime, such as the session, gets a
  30-day `Max-Age` so a restart does not sign the user out; the server's own session timeout still
  ends it. `autoRewrite` brings the server's redirects back to the local origin. Cookies are
  flushed before quitting.
- **SSO.** The SDK opens its sign in popup on the local origin (`/api/auth/login/<provider>`), so
  the server's session cookie belongs to it. The provider calls back to the server's registered
  address, which `answerRequest` (`trust-boundaries/web-requests.ts`, with `toLocalModuleUrl` and
  `pickLocalOrigin`) redirects to the same path on the app origin, so the callback carries that
  session; a frame's or a tool view's request for the server goes to the tool frame origin. The popup is a sandboxed child
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

## Trust boundaries

What runs where, what it may reach, and the one thing that stops it reaching more. The checks
between zones live in `src/main/features/trust-boundaries/`, one file each, opening with the same
three lines: `Boundary`, `Enforces`, `Exceptions` (`zones.ts` holds the helpers they share). The
proxy's own checks (Host, the launch key, plain paths, the module sandbox) are in
`server-connection/local-server.ts`, the tool views' sign in in `tool-cookies.ts`, and the
window's and popups' rules in `app-window/window-security.ts`. The aim: a tool on the desktop
never does more than the same tool on the web, and nothing but the app's own page reaches this
machine beyond what a browser gives any page (a download through the save dialog, a link in the
system browser).

```
 ┌──────────────────────────────── main process (Node) ────────────────────────────────┐
 │  handle-ipc ─ isAppMainFrame      local-server (proxy)      local-fs, shell, dialogs │
 └──────▲─────────────────────────────────▲──────────────────────────▲──────────────────┘
        │ IPC (allowlist + sender check)  │ HTTP / WS (loopback)     │ only through IPC
 ┌──────┴──────────────── renderer process A: the app page ─────────┴──────────────────┐
 │  http://127.0.0.1:<port>/   preload bridge (window.semossDesktop), the chat         │
 │      │ <iframe>                                   postMessage ▲                      │
 └──────┼────────────────────────────────────────────────────────┼──────────────────────┘
 ┌──────▼──────────────── renderer process B: tool views ────────┴──────────────────────┐
 │  http://tools.localhost:<port>/   portals, declared pages, BLOCKS apps — no bridge    │
 └──────────────────────────────────────────────────────────────────────────────────────┘
```

| Zone | What runs there | What it may reach | Enforced by |
|---|---|---|---|
| **Main process** | Node: the proxy, the config, local folders, the shell | Everything | Reached only through `handleIpc` |
| **App page**: `http://127.0.0.1:<port>/`, the app window's top frame | The built renderer only | The bridge's allowlisted channels; the server through the same-origin proxy | `ipc-sender.ts` (`isAppMainFrame`), `content-security-policy.ts` |
| **Server pages on the app origin**: module responses | Server HTML and JSON | Not the app page or the bridge (an opaque origin); like any page, a link in the system browser and a download through the save dialog | `MODULE_PAGE_SANDBOX` on every module response (`local-server.ts`), except sign in |
| **Tool frames**: `http://tools.localhost:<port>` | Portals, declared pages, BLOCKS apps | The server as the user; `postMessage` to the chat | Another site, so another process (`tool-frame-isolation.ts` checks it); the key (`web-requests.ts`); `permissions.ts` |
| **Sign in popups** | The server's and the provider's sign in | The server's session | `secureWindow` (`window-security.ts`); unchanged, as on the web |

**Invariants**, each with its test:

1. **Only the app's built files run as the app origin.** `script-src` names the app's `/assets/`
   only, so a server file under the module is never a script source, and every module response
   on the app origin but sign in is sandboxed ("runs only the app's own built scripts"; "runs the
   server's pages sandboxed on the app's origin, except its sign in").
2. **Only the app page calls main.** `isAppMainFrame`: the app's window, its top frame, on `/`. A
   popup, a frame in the window, a tool view or a server page is refused, even on the app's
   origin ("refuses every other window, frame and page").
3. **Nothing but the app page reaches a desktop feature.** Tool views have no bridge (the preload
   runs in the window's top frame only) and run in another process. The app never frames this
   machine's loopback except the tool frame origin, as a frame, `<object>` or `<embed>`, so a
   `system://` view the chat frames on the page's own origin is refused ("never frames this
   machine's loopback but the tool frame origin"). Permissions go to the app page only ("denies
   everything else, and everyone else"). Desktop folder tools have their own settings
   (`desktop_folder_<operation>`), so a Room Files choice made on the server never lets an agent
   change this machine's disk without asking ("offers a room's folder tools once it has
   folders"). Opening a file that would run asks first ("asks before opening anything that would
   run").
4. **Tool views never share the app page's process.** `tools.localhost` is another site than
   `127.0.0.1`, and Chromium keeps sites in separate processes. `guardToolFrameIsolation` checks
   every tool frame that loads; one in the app page's process turns tool views off for the run
   (the tool frame origin answers 503) and reloads the window once. It detects and contains: the
   check runs once the frame has loaded ("calls the breach for a tool frame that loads in the
   app's process"). The key goes only to tool views in the app's window, their workers, and the
   app page loading a tool frame ("gives the tool frame key to tool views in the app's window
   only").

**The channels between zones.**

| Channel | From → to | Checked by | What it can do |
|---|---|---|---|
| `IpcContract` (`ipc-contract.ts`) | App page → main | The preload's allowlist, then `isAppMainFrame`, then each handler's argument checks | The servers, the language, local folders and files, opening a web link |
| Downloads (`downloads.ts`) | Any page → disk | The save dialog, where the user picks the place | Save a file the user chose to keep, as in a browser |
| Links out (`window-security.ts`) | Any page or popup → the system browser | `externalUrlFor`: http, https and mailto only; a local module link opens at the server's own address | Open a web page, as a browser would |
| `DesktopCommand` on `COMMAND_CHANNEL` | Main → app page | `webContents.send` reaches the top frame only | Menu commands; folder changes |
| `SMSS_INIT_TOOL` / `SMSS_EXEC_TOOL` | App page ↔ tool frame | The chat checks the message's source frame, as on the web | Hand a tool its call; settle the call with its result |
| HTTP and WebSocket on the tool frame origin | Tool frame → main's proxy → server | Host, the launch key, plain paths; no service workers | The module and the platform, signed in as the user |
| HTTP and WebSocket on the app origin | App page → main's proxy → server | Host, plain paths | The module, and the app's files |

**Also on every session and window.** `app.enableSandbox()`, no `<webview>`, and no new window
unless its window's rules allow it (`web-contents.ts`). `contextIsolation` and `sandbox` on,
`nodeIntegration` off. The window stays on the app's page (`isAppPage`); other links open in the
system browser (http, https, mailto only, `isExternalLink`). A server is https, or http only on
this machine, and the proxy forwards only plain request paths (`isPlainPath`: no `.` or `..`
segment, `;`, `\`, or encoded dot or slash, which Tomcat would read as another path). Both
listeners refuse a request whose `Host` is not their own (DNS rebinding). A second launch focuses
the running window.

**Same as the web**, so unchanged here: tools share one origin, so one tool can reach another's
page, as tools on the web share the server's; the tool iframe's attributes, the tool SDK's
message handling, model HTML previews, mail HTML and the server's banner HTML are the chat's and
behave as they do on the web. Every shared library is unchanged.

**Known exceptions.**

- **Sign in runs on the app origin.** Pages under `${module}/api/auth/` are not sandboxed, since
  the SDK watches its popup there; they are trusted server code, same origin as the app page.
- **What the user approves leaves this machine.** A folder read an agent makes, or a file the
  user attaches, becomes room data on the server, which any tool running as the user can read.
- **Desktop folder settings live with the room**, on the server; unset, reads run at once and
  every change asks first.
- **Development is not a boundary.** `pnpm dev` serves the page from electron-vite with no
  policy (its CORS is off, so tool views cannot read workspace files); the developer tools are in
  the View menu only outside the packaged app.
- **Local programs** are outside the threat model, except that the tool frame origin answers
  only the app's window (the launch key), so it is no signed in proxy for them.

**Packaging.** The packaged app encrypts its cookie store (`electronFuses.enableCookieEncryption`
in `electron-builder.yml`), with a key in the OS keychain (macOS: "Playground Safe Storage").
The fuse is one way: turning it off leaves saved cookies unreadable. The other fuses stop
anything on this machine from running the signed app as plain Node, attaching a debugger, or
swapping its code, and so borrowing its keychain entry: `runAsNode`,
`enableNodeOptionsEnvironmentVariable` and `enableNodeCliInspectArguments` off, ASAR integrity
and `onlyLoadAppFromAsar` on, and `grantFileProtocolExtraPrivileges` off (the app never loads
`file://`). `pnpm dev` runs Electron's own binary, whose fuses are not flipped,
so dev cookies stay plaintext. Dev and the packaged app share one data folder (above).

## Local folders

A room can attach folders from this machine. The app gives them to the chat as
[client tools](../../libs/chat/docs/tools.md#client-tools), all in
`renderer/features/local-folders/`:

- `desktop-folders-host.ts` is the `LocalFoldersHost` (`local-folders-host.ts`) over the
  `local-folders:*` and `local-fs:*` channels.
- `desktop-tools-host.ts` (`createDesktopToolsHost`) is the chat's `ToolsHost`, made once per
  window in `AppLayout`, which hands it to the chat's config and to `DesktopToolsContext`, where
  `useDesktopTools` reads it. It keeps a `RoomLocalFoldersStore` per room the chat has
  open, offers the `desktop_*` tools over the room's folders (`DesktopFolders`, each folder a
  top level entry, with the chat's `describeFolderTool` and `executeFolderTool`; each has its own
  `desktop_folder_*` setting, never the Room Files one, so reads run at once and every change asks
  until the user says otherwise), lists the folders in Files under Desktop
  (`desktop-host-files.tsx`: Attach Folder, Show in Finder, Open with Default App, Detach), and
  detaches a new chat's folders when it is left before its first message.
- Attach Folder in the plus menu (`AttachFolderItem`) and "/" (`AttachFolderCommand`) attach
  to an open room, or to the room a new chat prepares (`useComposer().prepareRoom()`). They leave
  the Workspace as it is; the folders show in Files when the user opens it.
- Its strings are in the `desktop` namespace, under `localFolders`.

- **Only the system's folder picker attaches a folder** (`local-folders:pick`, parented to the
  window). The page never sends a path on the machine: a file call names `{ roomId, folderId }`
  and a path inside the folder, for the server in use.
- **Every path stays inside its folder** (`resolveInsideFolder`): leading slashes are dropped,
  `..` and other drives are refused, symbolic links are followed as far as the path exists and
  refused when they lead out or into a hidden entry, and `.git` is hidden and refused, in any
  case and with Windows' trailing dots and spaces (`isHiddenName`). The folder itself is never
  written, moved or deleted. Reads stop at 50 MB.
- **Deleting moves to the trash** (`shell.trashItem`). Open and Show in Finder go through
  `shell.openPath` and `shell.showItemInFolder`. Opening anything that would run (an app, a
  script, an installer, a shortcut, an executable file: `isRunnable`) asks the user first, in a
  dialog main shows.
- **Watching** (`local-folders:watch`, counted, one `unwatch` each) sends
  `local-folders-changed` `DesktopCommand`s, gathered for 200 ms. Switching or removing a server
  closes its watchers.

## Adding an IPC channel

1. Add the channel to `IpcContract` and to `IPC_CHANNEL_LIST` below it
   (`contract/ipc-contract.ts`); the compiler fails until both have it, and the preload allowlists
   the list.
2. Register it with `handleIpc(channel, caller, handler)`, which refuses any caller but the app
   page (`isAppMainFrame`), validating every argument, since they arrive as `unknown`: in
   `main/features/ipc/register-ipc.ts`, or `main/features/local-folders/register-local-folders.ts`
   for a `local-folders:*` or `local-fs:*` channel. Add it to the channel table in
   [Trust boundaries](#trust-boundaries).
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

**The playground's `.env`.** The renderer's `envDir` is `../playground`, so the desktop builds with
the web app's `VITE_NAME`, `VITE_THEME` and new-chat defaults (typed in `src/renderer/vite-env.d.ts`).
`features/theme/` reads them as the web app does: `ENV_THEME` (`readPlaygroundBuildTheme`) is the
base `usePlaygroundTheme` lays the server's theme over, and `readPlaygroundBuildNewChat` gives
`playgroundThemeChatOptions` its fallback. `ENDPOINT` and `MODULE` do not apply: the desktop's servers are
the saved ones.

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
- **No agent or knowledge pages**: chat UI hides agent links (no `agentHref`). The settings
  dialog is here, so connectors are switched on in the app; signing in to a connector from the
  desktop app has not been tried against a real server.
- **Offline mode and local MCP over stdio** would live in the main process, behind new
  `IpcContract` channels, with the chat reaching them through `ChatConfig`, as the local folders
  do.
