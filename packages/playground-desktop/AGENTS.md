# AGENTS.md - @semoss/playground-desktop

> **Inherits from:** [root AGENTS.md](../../AGENTS.md): non-negotiables, task skills, and [standards](../../docs/README.md#standards).
> The renderer composes the chat: read the [chat guide](../../libs/chat/AGENTS.md) before changing it.

## Purpose

The SEMOSS chat as an Electron app named "Playground" (`productName`, `org.semoss.chat`). It signs
in to hosted SEMOSS servers: the user adds the first on first launch and can save more, each with
its own sign in. The renderer composes `@semoss/chat` as the [web app](../playground/AGENTS.md)
does, so a room made in one app shows in the other's list.

How it works lives in [docs/](./docs/):

- [Servers](./docs/servers.md): the local proxy, the tool frame origin, sign in and SSO, several
  servers, and what the app saves on this machine.
- [Trust boundaries](./docs/trust-boundaries.md): the zones, what each may reach, the channels
  between them, the known exceptions, and the packaged app's fuses.
- [Local folders](./docs/local-folders.md): attaching folders to a room, the folder tools, search,
  and the path rules.

## Boundaries

- **Three processes, built separately** by electron-vite: `src/main/` (Node; `main.ts` only wires
  its `features/`), `src/preload/` (an allowlisted invoke, the menu's commands and the tool frame
  origin, nothing else), and `src/renderer/` (`@/`). `src/contract/` holds the types, constants
  and pure functions all three import, with no `electron` and no `react`. A feature keeps its name
  across the processes.
- **The renderer reaches main only through `getDesktopBridge()`** (`window.semossDesktop`), which
  throws outside the Electron window. Main → renderer messages are `DesktopCommand`s on
  `COMMAND_CHANNEL`, heard with `bridge.onCommand`.
- **If the web app needs it too, it belongs in `@semoss/chat`.** This app places the chat's pieces
  (`AppLayout`, `useHostChatConfig`) and adds only what a desktop has: servers, local folders, and
  the menu. Those reach the chat through `ChatConfig`'s `tools` and `components`.
- **The SDK needs no desktop code.** Main proxies the server's module path on a local origin, so
  the SDK's same-origin calls, cookies, and sockets work unchanged.
- **Every dependency is a dev dependency**: electron-vite bundles them. `electron.vite.config.ts`
  imports `@semoss/config` and `@semoss/panels/vite` by path, since electron-vite leaves packages
  external and Node cannot run the workspace's TypeScript; so the shared config's build plugins
  are dev dependencies here, and the `ai` stub alias names its real path.
- **The renderer builds with the playground's `.env`** (`envDir` is `../playground`): `VITE_NAME`,
  `VITE_THEME`, and the new-chat defaults, read through `readPlaygroundBuildTheme` and
  `readPlaygroundBuildNewChat` as the web app does. `ENDPOINT` and `MODULE` do not apply: the
  servers are the saved ones.

## Invariants

Each has a test; the reasons and the exceptions are in [Trust boundaries](./docs/trust-boundaries.md).

1. **Only the app's built files run as the app origin.** `script-src` names the app's `/assets/`
   only, and every module response on the app origin except sign in is sandboxed.
2. **Only the app page calls main.** `handleIpc` refuses any caller but `isAppMainFrame`: the
   app's window, its top frame, on `/`.
3. **Nothing but the app page reaches a desktop feature.** Tool views have no bridge and run on
   the tool frame origin, another site, so another process (`guardToolFrameIsolation`).
   Permissions go to the app page only.
4. **Every file call stays inside its folder** (`resolveInsideFolder`). Only the system's folder
   picker attaches a folder; the page never sends a path on this machine. Desktop folder tools
   have their own `desktop_folder_*` settings, never Room Files', and opening anything that would
   run asks first.
5. **Each saved server has its own session partition** (`persist:server-<uuid>`). A window's
   session is fixed when it is made, so switching servers opens a new window.
6. **The packaged app's cookie encryption fuse is one way**: turning it off leaves saved cookies
   unreadable.

## Adding an IPC channel

1. Add the channel to `IpcContract` and to `IPC_CHANNEL_LIST` below it
   (`contract/ipc-contract.ts`); the compiler fails until both have it, and the preload allowlists
   the list.
2. Register it with `handleIpc(channel, caller, handler)`, validating every argument, since they
   arrive as `unknown`: in `main/features/ipc/register-ipc.ts`, or
   `main/features/local-folders/register-local-folders.ts` for a `local-folders:*` or `local-fs:*`
   channel. Add it to the channel table in
   [Trust boundaries](./docs/trust-boundaries.md).
3. Call it from the renderer with `getDesktopBridge().invoke(channel, ...)`.

## Not Here Yet

- **Signing and notarization** come only from the environment (`CSC_LINK`, `CSC_KEY_PASSWORD`,
  `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`, `WIN_CSC_LINK`); without them builds
  are unsigned. No CI job builds the app.
- **Auto update**: add `electron-updater` in `main/features/updates/` with a generic feed.
- **Deep links** (`semoss-playground://`): register the protocol in `main/features/menu` or a new
  `commands` feature, and send `DesktopCommand`s as the menu does.
- **No agent or knowledge pages**: chat UI hides agent links (no `agentHref`). Signing in to a
  connector from the desktop app has not been tried against a real server.
- **Offline mode and local MCP over stdio** would live in main, behind new `IpcContract`
  channels, reaching the chat through `ChatConfig` as the local folders do.

## Validation

```bash
pnpm --filter @semoss/playground-desktop test
pnpm --filter @semoss/playground-desktop type-check
pnpm dev:playground-desktop                          # with its dependencies; renderer on 127.0.0.1:5181
pnpm --filter @semoss/playground-desktop package     # an unpacked app in release/
```

`type-check` covers the renderer, then main, preload, and contract under `strict`. Main-process
tests run in node, opted into per file; renderer tests run in jsdom.
