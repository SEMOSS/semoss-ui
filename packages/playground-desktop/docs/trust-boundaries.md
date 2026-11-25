# Trust Boundaries in @semoss/playground-desktop

> Part of the [desktop guide](../AGENTS.md). What runs where, what it may reach, and what stops it reaching more. Read it before changing a check in `src/main/features/trust-boundaries/`, the proxy, the preload, an IPC channel, or a window's rules.

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
so dev cookies stay plaintext. Dev and the packaged app share one data folder ([What it saves](./servers.md#what-it-saves)).
