// Renderer-safe constants only, no `electron`/`node:*` imports — app-ui's
// title-bar.tsx imports APP_NAME from here directly, and Vite can't bundle
// Electron/Node APIs into the browser build. Main-process-only helpers
// (e.g. getIconPath in ./icon-path.ts) live in their own file instead.

export const APP_NAME = "AI Core Playground";

// Shared by both windows so the connections/onboarding screen doesn't feel
// like a separate, mismatched popup next to the main app window.
export const APP_WINDOW_SIZE = { width: 1280, height: 800 };

// The local reverse-proxy/static server only ever needs to be reachable
// from this machine, and only loopback avoids needing a firewall prompt.
export const LOCAL_SERVER_HOST = "127.0.0.1";

// Standard scheme ports, used whenever a real instance's URL doesn't name
// one explicitly — shared by static-server.ts's proxy and
// browser-login.ts's auth probe, since both build a raw http(s).request
// options object from a parsed instanceUrl.
export const DEFAULT_HTTPS_PORT = 443;
export const DEFAULT_HTTP_PORT = 80;
