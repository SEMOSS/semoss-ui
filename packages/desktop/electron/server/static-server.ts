import { readFile } from "node:fs/promises";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { createServer, request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { extname, join, normalize } from "node:path";
import {
	DEFAULT_HTTP_PORT,
	DEFAULT_HTTPS_PORT,
	LOCAL_SERVER_HOST,
} from "../app-info";
import { instanceBasePath } from "../connections/instance-url";
import type { ConnectionRecord, ConnectionSecrets } from "../connections/types";

const HTTP_STATUS = {
	ok: 200,
	forbidden: 403,
	notFound: 404,
	internalServerError: 500,
	badGateway: 502,
} as const;

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
				res.writeHead(HTTP_STATUS.internalServerError, {
					"content-type": "text/plain",
				});
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
		server.listen(0, LOCAL_SERVER_HOST, () => {
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

/**
 * Forwards one request to the connection's real instance, attaching auth
 * itself so the credential never passes through app-ui's JS (see this
 * file's own top-level doc comment). Every response, including error
 * statuses from the real instance, is piped straight through unchanged —
 * this is a transparent proxy, not an API client that interprets responses.
 */
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
			port:
				target.port ||
				(isHttps ? DEFAULT_HTTPS_PORT : DEFAULT_HTTP_PORT),
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
			res.writeHead(
				proxyRes.statusCode ?? HTTP_STATUS.badGateway,
				proxyRes.headers,
			);
			proxyRes.pipe(res);
		},
	);

	proxyReq.on("error", (err) => {
		if (!res.headersSent) {
			res.writeHead(HTTP_STATUS.badGateway, {
				"content-type": "text/plain",
			});
		}
		res.end(
			`Proxy error reaching ${connection.instanceUrl}: ${err.message}`,
		);
	});

	req.pipe(proxyReq);
}

/**
 * Serves one file out of app-ui's built dist/, defaulting "/" to
 * index.html for the SPA's client-side router. `filePath.startsWith(resolvedDist)`
 * is the load-bearing check here — it's what stops a request path
 * containing "../" segments from escaping distPath onto the rest of the
 * filesystem.
 */
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
		res.writeHead(HTTP_STATUS.forbidden);
		res.end("Forbidden");
		return;
	}

	try {
		const data = await readFile(filePath);
		const contentType =
			MIME_TYPES[extname(filePath)] ?? "application/octet-stream";
		res.writeHead(HTTP_STATUS.ok, { "content-type": contentType });
		res.end(data);
	} catch {
		res.writeHead(HTTP_STATUS.notFound);
		res.end("Not found");
	}
}
