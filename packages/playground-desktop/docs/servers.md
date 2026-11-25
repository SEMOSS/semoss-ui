# Servers in @semoss/playground-desktop

> Part of the [desktop guide](../AGENTS.md). How the app reaches a hosted server through its local proxy, signs in, keeps several servers apart, and what it saves on this machine. Read it before changing anything in `src/main/features/server-connection/` or `auth/`.

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
  runs in another renderer process (see [Trust boundaries](./trust-boundaries.md)); it talks to the
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
