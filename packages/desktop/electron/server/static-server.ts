import { readFile } from "node:fs/promises";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { createServer, request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { extname, join, normalize } from "node:path";
import { instanceBasePath } from "../connections/instance-url";
import type { ConnectionRecord, ConnectionSecrets } from "../connections/types";

const MIME_TYPES: Record<string, string> = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".ico": "image/x-icon",
	".woff": "font/woff",
	".woff2": "font/woff2",
};

export interface LocalServerHandle {
	server: Server;
	port: number;
	close(): Promise<void>;
}

/**
 * Serves app-ui's built dist/ over plain HTTP, and — when a connection is
 * active — reverse proxies its MODULE path prefix to its real ENDPOINT,
 * exactly what Vite's dev-server proxy does, re-implemented here because
 * packaged Electron has no dev server. Auth is attached here, not in the
 * renderer, so app-ui's own JS never carries Access/Secret Key or a session
 * cookie: `authMode: "keys"` attaches Basic auth, `authMode: "browser"`
 * (see electron/connections/browser-login.ts) attaches the session cookie
 * captured during sign-in.
 * TODO: neither mode currently detects/recovers from the credential
 * expiring mid-session (an expired cookie would just start getting
 * redirected-to-login responses proxied straight through) — worth a
 * clearer "your session expired, sign in again" surface eventually.
 *
 * Running same-origin (the SPA and the proxied API share this server's
 * origin) means no CORS story to solve, unlike loading over file:// and
 * hitting the real instance URL directly from the renderer.
 *
 * `connection`/`secrets` are null when no connection is selected yet (first
 * run) — app-ui's own connections page doesn't need the proxy at all, since
 * it talks to the main process over IPC, not HTTP.
 */
export function startLocalServer(
	distPath: string,
	connection: ConnectionRecord | null,
	secrets: ConnectionSecrets | null,
): Promise<LocalServerHandle> {
	const server = createServer((req, res) => {
		try {
			const url = req.url ?? "/";
			const modulePrefix = connection?.modulePath;
			if (
				modulePrefix &&
				secrets &&
				(url === modulePrefix ||
					url.startsWith(`${modulePrefix}/`) ||
					url.startsWith(`${modulePrefix}?`))
			) {
				proxyToInstance(req, res, connection, secrets);
				return;
			}
			void serveStatic(req, res, distPath);
		} catch (err) {
			// A synchronous throw here (e.g. a malformed instanceUrl) would
			// otherwise propagate out of this request handler — Node's http
			// server doesn't guard against that itself, and an uncaught
			// exception here can take the whole server (and every other
			// in-flight request, including the initial index.html load) down
			// with it.
			if (!res.headersSent) {
				res.writeHead(500, { "content-type": "text/plain" });
			}
			res.end(
				`Local server error: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	});

	// A runtime socket error (e.g. ECONNRESET from a client disconnecting
	// mid-request) would otherwise be an unhandled "error" event, which node
	// treats as fatal and crashes the process. This keeps the server (and
	// the rest of the app) alive across it.
	server.on("error", (err) => {
		console.error("Local server error:", err);
	});

	return new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(0, "127.0.0.1", () => {
			const address = server.address();
			if (!address || typeof address !== "object") {
				reject(new Error("Failed to determine local server port"));
				return;
			}
			resolve({
				server,
				port: address.port,
				close: () =>
					new Promise((res) => {
						server.close(() => res());
					}),
			});
		});
	});
}

function proxyToInstance(
	req: IncomingMessage,
	res: ServerResponse,
	connection: ConnectionRecord,
	secrets: ConnectionSecrets,
): void {
	const target = new URL(connection.instanceUrl);
	const isHttps = target.protocol === "https:";
	const requestFn = isHttps ? httpsRequest : httpRequest;
	// instanceUrl isn't always a bare origin — real deployments often live
	// under a base path (e.g. ".../cfg-ai-dev"), which `target.hostname`
	// alone would otherwise silently drop.
	const basePath = instanceBasePath(connection.instanceUrl);

	const headers = { ...req.headers };
	delete headers.host;
	delete headers.cookie;
	if (connection.authMode === "browser" && secrets.cookie) {
		headers.cookie = secrets.cookie;
	} else if (secrets.accessKey && secrets.secretKey) {
		headers.authorization = `Basic ${Buffer.from(
			`${secrets.accessKey}:${secrets.secretKey}`,
		).toString("base64")}`;
	}

	const proxyReq = requestFn(
		{
			protocol: target.protocol,
			hostname: target.hostname,
			port: target.port || (isHttps ? 443 : 80),
			path: `${basePath}${req.url}`,
			method: req.method,
			headers,
			// Internal SEMOSS instances often run on self-signed certs for
			// local/internal use today (same trust level as
			// packages/playground/vite.config.ts's dev proxy, which also sets
			// secure: false).
			// TODO: tighten certificate validation once this app is
			// distributed beyond local/internal use.
			rejectUnauthorized: false,
		},
		(proxyRes) => {
			res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
			proxyRes.pipe(res);
		},
	);

	proxyReq.on("error", (err) => {
		if (!res.headersSent) {
			res.writeHead(502, { "content-type": "text/plain" });
		}
		res.end(
			`Proxy error reaching ${connection.instanceUrl}: ${err.message}`,
		);
	});

	req.pipe(proxyReq);
}

async function serveStatic(
	req: IncomingMessage,
	res: ServerResponse,
	distPath: string,
): Promise<void> {
	const url = new URL(req.url ?? "/", "http://localhost");
	let pathname = decodeURIComponent(url.pathname);
	if (pathname === "/") {
		pathname = "/index.html";
	}

	const resolvedDist = normalize(distPath);
	const filePath = normalize(join(distPath, pathname));
	if (!filePath.startsWith(resolvedDist)) {
		res.writeHead(403);
		res.end("Forbidden");
		return;
	}

	try {
		const data = await readFile(filePath);
		const contentType =
			MIME_TYPES[extname(filePath)] ?? "application/octet-stream";
		res.writeHead(200, { "content-type": contentType });
		res.end(data);
	} catch {
		res.writeHead(404);
		res.end("Not found");
	}
}
