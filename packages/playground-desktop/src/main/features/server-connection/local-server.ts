import { createProxyServer } from "http-proxy-3";
import { readFile } from "node:fs/promises";
import {
	createServer,
	type IncomingMessage,
	type Server,
	type ServerResponse,
} from "node:http";
import { extname, join, normalize, sep } from "node:path";
import type { Duplex } from "node:stream";
import { TOOL_FRAME_HOST } from "../../../contract/ipc-contract";
import {
	DEFAULT_MODULE,
	isModulePath,
	isPlainPath,
	isPlatformPath,
	type ServerConfig,
} from "../../../contract/server-connection";
import { TOOL_FRAME_KEY_HEADER } from "../trust-boundaries/web-requests";
import type { ToolCookieJar } from "./tool-cookies";

/** The app's own origin, and the tool frame origin beside it, on this machine. */
export interface LocalServer {
	/** The origin the window loads, such as `http://127.0.0.1:4321`. */
	readonly origin: string;
	/** The port it listens on, saved so the next launch reuses it. */
	readonly port: number;
	/**
	 * The origin tool views are framed from, such as
	 * `http://tools.localhost:4322`. It forwards only the server's module and
	 * its platform. It is another site than the app's, so Chromium runs a tool
	 * in another renderer process, and a tool's page cannot script the app's
	 * page or reach its bridge. Only the app's page may frame it, and it
	 * answers only the app's window (the tool frame key). See AGENTS.md, Trust
	 * boundaries.
	 */
	readonly toolFrameOrigin: string;
	/** The tool frame origin's port, saved so a tool's storage is kept. */
	readonly toolFramePort: number;
	/**
	 * Stop serving tool views for the rest of this run: every request on the
	 * tool frame origin gets a page saying so. For when a tool view was found
	 * in the app page's process (`tool-frame-isolation.ts`).
	 */
	disableToolFrames: () => void;
	/** Stop the proxy and both servers. */
	close: () => Promise<void>;
}

/** What {@link startLocalServer} serves and forwards. */
interface LocalServerOptions {
	/** The built renderer, served in production. */
	readonly rootDir: string;
	/** In development, the renderer's dev server, which non-module requests go to. */
	readonly devUrl?: string;
	/** The port from the last launch; the page's storage belongs to it (cookies ignore the port). */
	readonly preferredPort: number | null;
	/** The tool frame origin's port from the last launch; a tool's storage belongs to it. */
	readonly preferredToolFramePort: number | null;
	/** Read on every request, so a new server takes effect without a restart. */
	readonly getServer: () => ServerConfig | null;
	/**
	 * The page's Content-Security-Policy, set on its HTML in production, made
	 * from the origins once both listen.
	 */
	readonly contentSecurityPolicy?: (origins: {
		readonly appOrigin: string;
		readonly toolFrameOrigin: string;
	}) => string;
	/**
	 * This launch's tool frame key: the tool frame origin answers only
	 * requests that carry it, which only the app's window does
	 * (`trust-boundaries/web-requests.ts`).
	 */
	readonly toolFrameKey: string;
	/** The app's cookies, which tool requests are signed in with. */
	readonly toolCookies: ToolCookieJar;
}

/** The `Content-Type` for each file extension the built renderer contains. */
const CONTENT_TYPES: Readonly<Record<string, string>> = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".gif": "image/gif",
	".ico": "image/x-icon",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".ttf": "font/ttf",
	".wasm": "application/wasm",
	".map": "application/json",
};

/** How long a server's browser-session cookie lasts here: the server's own session timeout still ends it. */
const SESSION_COOKIE_MAX_AGE_S = 30 * 24 * 60 * 60;

/**
 * Make a server's cookies work on the local origin. The browser sees plain
 * http on 127.0.0.1, so a `Secure` cookie would be dropped and `SameSite=None`
 * needs `Secure`; the proxy still talks to the server over its own https. A
 * cookie with no lifetime, such as the server's session, would end when the app
 * quits, signing the user out on every restart, so it is given one.
 *
 * @param cookie - One `Set-Cookie` value.
 * @returns The value the local origin keeps.
 */
export const localizeCookie = (cookie: string): string => {
	const parts = cookie
		.split(";")
		.map((part) => part.trim())
		.filter((part) => part && !/^secure$/i.test(part))
		.map((part) => (/^samesite=none$/i.test(part) ? "SameSite=Lax" : part));
	if (!parts.some((part) => /^(expires|max-age)=/i.test(part))) {
		parts.push(`Max-Age=${SESSION_COOKIE_MAX_AGE_S}`);
	}
	return parts.join("; ");
};

/**
 * The policy every module response gets on the app's origin, except the
 * server's sign in. A server page that renders there, as a frame, a popup or
 * anything else, runs on an opaque origin: it can never script the app's page,
 * which holds the bridge to the main process. Tool views are framed from the
 * tool frame origin instead. Calls and scripts ignore the policy.
 */
export const MODULE_PAGE_SANDBOX =
	"sandbox allow-scripts allow-forms allow-popups allow-downloads";

/**
 * The characters a sign in path may have. Nothing the server could read as
 * another path: no `;` (Tomcat resolves `/..;/`), `%` (an encoded slash or
 * dot) or `\`.
 */
const PLAIN_PATH = /^[\w\-./]+$/;

/**
 * Whether a request on the module is the server's sign in, which the SDK's
 * popup watches on the app's origin, and so keeps its own origin.
 *
 * @param url - The request's path, with any query, as it arrived.
 * @param module - The server's module path.
 * @returns True for a plain path under the module's `/api/auth/`.
 */
export const isSignInPath = (url: string, module: string): boolean => {
	// the path as it is forwarded, not as a parser would resolve it
	const [path = ""] = url.split("?");
	return (
		path.startsWith(`${module}/api/auth/`) &&
		PLAIN_PATH.test(path) &&
		!path.split("/").includes("..")
	);
};

/**
 * A server's policy without its `frame-ancestors`, for a tool view, whose
 * framing the tool frame origin sets itself: on the web the chat and the tool
 * share the server's origin, so `frame-ancestors 'self'` passes there, but
 * here the app's page is another site. Every other directive stays.
 *
 * @param policy - The server's `Content-Security-Policy` header, one policy or several.
 * @returns The policy without `frame-ancestors`, or undefined when nothing is left.
 */
export const withoutFrameAncestors = (
	policy: string | string[] | undefined,
): string | undefined => {
	if (!policy) return undefined;
	const kept = (Array.isArray(policy) ? policy.join(",") : policy)
		.split(",")
		.map((one) =>
			one
				.split(";")
				.map((directive) => directive.trim())
				.filter(
					(directive) =>
						directive &&
						directive.split(/\s+/)[0]?.toLowerCase() !==
							"frame-ancestors",
				)
				.join("; "),
		)
		.filter(Boolean);
	return kept.length ? kept.join(", ") : undefined;
};

/**
 * Add a policy to a response's headers, beside any the server sent, which
 * still apply.
 *
 * @param headers - The response's headers.
 * @param policy - The policy to add.
 */
const addPolicy = (
	headers: IncomingMessage["headers"],
	policy: string,
): void => {
	const existing = headers["content-security-policy"];
	headers["content-security-policy"] = existing
		? [existing, policy].join(", ")
		: policy;
};

/**
 * Listen on this machine's loopback only, so nothing else on the network
 * reaches the app.
 *
 * @param server - The server.
 * @param port - The port, or 0 for any free one.
 * @param host - The loopback address.
 * @returns The port it bound.
 */
const listen = (
	server: Server,
	port: number,
	host = "127.0.0.1",
): Promise<number> =>
	new Promise((resolvePort, reject) => {
		const onError = (error: Error) => reject(error);
		server.once("error", onError);
		server.listen(port, host, () => {
			server.off("error", onError);
			const address = server.address();
			if (!address || typeof address === "string") {
				reject(
					new Error("The local server did not bind to a TCP port"),
				);
				return;
			}
			resolvePort(address.port);
		});
	});

/**
 * Serve the renderer and forward the server's module path (HTTP and
 * WebSocket) from one origin on this machine, so the chat's same-origin calls,
 * cookies, and sockets reach the hosted server unchanged. A second origin
 * forwards only the module and the platform, for tool views (see
 * {@link LocalServer}). Both refuse any host but their own.
 *
 * @param options - Where the renderer is and which server to forward to.
 * @returns The running server.
 */
export const startLocalServer = async ({
	rootDir,
	devUrl,
	preferredPort,
	preferredToolFramePort,
	getServer,
	contentSecurityPolicy,
	toolFrameKey,
	toolCookies,
}: LocalServerOptions): Promise<LocalServer> => {
	// module responses to the app's origin that run sandboxed there
	const sandboxed = new WeakSet<IncomingMessage>();
	// module responses to the tool frame origin, which the app's page frames
	const framed = new WeakSet<IncomingMessage>();
	const proxy = createProxyServer({
		changeOrigin: true,
		ws: true,
		secure: true,
		// a redirect to the server itself comes back to this origin
		autoRewrite: true,
		protocolRewrite: "http",
		cookieDomainRewrite: { "*": "" },
	});
	proxy.on("proxyRes", (proxyRes, request) => {
		const cookies = proxyRes.headers["set-cookie"]?.map(localizeCookie);
		if (cookies) {
			proxyRes.headers["set-cookie"] = cookies;
		}
		if (sandboxed.has(request)) {
			addPolicy(proxyRes.headers, MODULE_PAGE_SANDBOX);
		}
		if (framed.has(request)) {
			// the server's cookies go to the app's jar, never to a tool's page
			if (cookies) {
				delete proxyRes.headers["set-cookie"];
				void toolCookies
					.store(`${appOrigin}${request.url ?? "/"}`, cookies)
					.catch(console.error);
			}
			// A server may send `X-Frame-Options: SAMEORIGIN`. On the web the
			// chat and the tool share the server's origin, so that passes; here
			// the tool frame origin is another site than the app's page, so the
			// browser would refuse to show the tool. Only the app's page (and a
			// tool's own frames) may frame it instead.
			delete proxyRes.headers["x-frame-options"];
			const serverPolicy = withoutFrameAncestors(
				proxyRes.headers["content-security-policy"],
			);
			if (serverPolicy) {
				proxyRes.headers["content-security-policy"] = serverPolicy;
			} else {
				delete proxyRes.headers["content-security-policy"];
			}
			addPolicy(proxyRes.headers, `frame-ancestors 'self' ${appOrigin}`);
			// one more hint to keep tool pages in their own agent cluster
			proxyRes.headers["origin-agent-cluster"] = "?1";
		}
	});
	proxy.on("error", (_error, _request, target) => {
		if (target && "writeHead" in target) {
			const response = target as ServerResponse;
			if (!response.headersSent) {
				response.writeHead(502, { "Content-Type": "text/plain" });
			}
			response.end("The SEMOSS server could not be reached");
			return;
		}
		(target as Duplex | undefined)?.destroy();
	});

	// set once each server listens, before any request arrives
	let port = 0;
	let toolFramePort = 0;
	let appOrigin = "";

	/**
	 * The server, when this request belongs to its module. A path the server
	 * could read as another one is never forwarded.
	 *
	 * @param url - The request's path, with any query.
	 * @returns The server to forward to, or null for anything else.
	 */
	const serverFor = (url = "/"): ServerConfig | null => {
		const server = getServer();
		return server && isPlainPath(url) && isModulePath(url, server.module)
			? server
			: null;
	};

	/**
	 * The server, when this request on the tool frame origin belongs to its
	 * module or its platform.
	 *
	 * @param url - The request's path, with any query.
	 * @returns The server to forward to, or null for anything else.
	 */
	const toolFrameServerFor = (url = "/"): ServerConfig | null => {
		const server = getServer();
		if (!server || !isPlainPath(url)) return null;
		return isModulePath(url, server.module) ||
			isPlatformPath(url, server.module)
			? server
			: null;
	};

	/**
	 * Whether a request is addressed to another host than this listener, such
	 * as a web page that points its own name at 127.0.0.1 (DNS rebinding).
	 * Such requests are refused.
	 *
	 * @param request - The request.
	 * @param host - This listener's host and port.
	 * @returns True for any other host.
	 */
	const isForeignHost = (request: IncomingMessage, host: string): boolean =>
		request.headers.host !== host;

	/** Set once the app's page was found sharing a process with a tool view. */
	let areToolFramesDisabled = false;

	/**
	 * Refuse a tool frame request that must not be answered: once tool views
	 * are off, for another host, without this launch's key (anything but the
	 * app's window), or a service worker's script, which would outlive the
	 * tool and see every later one. Otherwise the key is removed, so the
	 * server never sees it.
	 *
	 * @param request - The request.
	 * @returns The status to answer with, or null to forward it.
	 */
	const refuseToolFrameRequest = (
		request: IncomingMessage,
	): number | null => {
		if (isForeignHost(request, `${TOOL_FRAME_HOST}:${toolFramePort}`)) {
			return 403;
		}
		if (areToolFramesDisabled) return 503;
		if (request.headers[TOOL_FRAME_KEY_HEADER] !== toolFrameKey) return 403;
		if (request.headers["service-worker"]) return 403;
		delete request.headers[TOOL_FRAME_KEY_HEADER];
		return null;
	};

	/**
	 * Sign a tool's request in as the user: the app's cookies, then the
	 * tool's own (`tool-cookies.ts`).
	 *
	 * @param request - The request, changed in place.
	 */
	const signInToolRequest = async (
		request: IncomingMessage,
	): Promise<void> => {
		// the cookies the app's origin holds for the same path
		const header = await toolCookies.header(
			`${appOrigin}${request.url ?? "/"}`,
			request.headers.cookie,
		);
		if (header) request.headers.cookie = header;
		else delete request.headers.cookie;
	};

	/**
	 * Serve a file of the built renderer, refusing any path that escapes it.
	 *
	 * @param request - The request.
	 * @param response - Its response.
	 */
	const serveFile = async (
		request: IncomingMessage,
		response: ServerResponse,
	): Promise<void> => {
		const { pathname } = new URL(request.url ?? "/", "http://127.0.0.1");
		let decoded: string;
		try {
			decoded = decodeURIComponent(pathname);
		} catch {
			response.writeHead(400).end();
			return;
		}
		const filePath = normalize(
			join(rootDir, decoded === "/" ? "index.html" : decoded),
		);
		if (!filePath.startsWith(rootDir + sep)) {
			response.writeHead(403).end();
			return;
		}
		try {
			const body = await readFile(filePath);
			const type =
				CONTENT_TYPES[extname(filePath)] ?? "application/octet-stream";
			const headers: Record<string, string> = { "Content-Type": type };
			if (type.startsWith("text/html") && contentSecurityPolicy) {
				headers["Content-Security-Policy"] = contentSecurityPolicy({
					appOrigin,
					toolFrameOrigin: `http://${TOOL_FRAME_HOST}:${toolFramePort}`,
				});
			}
			response.writeHead(200, headers);
			response.end(body);
		} catch {
			// a hash router needs no fallback page
			response.writeHead(404).end();
		}
	};

	/**
	 * Answer a module request when no server is saved yet.
	 *
	 * @param request - The request.
	 * @param response - Its response.
	 * @returns True when it was answered.
	 */
	const refuseUnsavedModule = (
		request: IncomingMessage,
		response: ServerResponse,
	): boolean => {
		// before a server is saved, the chat's calls have nowhere to go
		if (getServer() || !isModulePath(request.url ?? "/", DEFAULT_MODULE)) {
			return false;
		}
		response.writeHead(503, { "Content-Type": "text/plain" });
		response.end("No SEMOSS server is set up yet");
		return true;
	};

	const server = createServer((request, response) => {
		if (isForeignHost(request, `127.0.0.1:${port}`)) {
			response.writeHead(403).end();
			return;
		}
		const target = serverFor(request.url);
		if (target) {
			if (!isSignInPath(request.url ?? "/", target.module)) {
				sandboxed.add(request);
			}
			proxy.web(request, response, { target: target.url });
			return;
		}
		if (refuseUnsavedModule(request, response)) {
			return;
		}
		if (devUrl) {
			proxy.web(request, response, {
				target: devUrl,
				changeOrigin: false,
			});
			return;
		}
		void serveFile(request, response);
	});

	server.on("upgrade", (request, socket, head) => {
		if (isForeignHost(request, `127.0.0.1:${port}`)) {
			socket.destroy();
			return;
		}
		const target = serverFor(request.url);
		if (target) {
			proxy.ws(request, socket, head, { target: target.url });
			return;
		}
		if (devUrl) {
			proxy.ws(request, socket, head, { target: devUrl });
			return;
		}
		socket.destroy();
	});

	/**
	 * Answer a tool view's request: the module and the platform, signed in as
	 * the user, never the app's own files.
	 *
	 * @param request - The request on the tool frame origin.
	 * @param response - Its response.
	 */
	const handleToolFrameRequest = async (
		request: IncomingMessage,
		response: ServerResponse,
	): Promise<void> => {
		const refusal = refuseToolFrameRequest(request);
		if (refusal === 503) {
			response.writeHead(503, { "Content-Type": "text/plain" });
			response.end("Tool views are off: the isolation check failed");
			return;
		}
		if (refusal !== null) {
			response.writeHead(refusal).end();
			return;
		}
		const target = toolFrameServerFor(request.url);
		if (target) {
			framed.add(request);
			await signInToolRequest(request);
			proxy.web(request, response, { target: target.url });
			return;
		}
		if (refuseUnsavedModule(request, response)) {
			return;
		}
		response.writeHead(404).end();
	};

	/**
	 * Forward a tool view's socket, signed in as the user: the module's only,
	 * since the platform is files.
	 *
	 * @param request - The upgrade request on the tool frame origin.
	 * @param socket - Its socket.
	 * @param head - The first bytes of the upgraded stream.
	 */
	const handleToolFrameUpgrade = async (
		request: IncomingMessage,
		socket: Duplex,
		head: Buffer,
	): Promise<void> => {
		const target = serverFor(request.url);
		if (refuseToolFrameRequest(request) !== null || !target) {
			socket.destroy();
			return;
		}
		await signInToolRequest(request);
		proxy.ws(request, socket, head, { target: target.url });
	};

	/**
	 * A listener for the tool frame origin. `tools.localhost` resolves to both
	 * 127.0.0.1 and ::1, so it listens on both, and no other program can take
	 * the port on the one it left free.
	 */
	const createToolFrameServer = (): Server => {
		const toolServer = createServer((request, response) => {
			handleToolFrameRequest(request, response).catch((error) => {
				console.error(error);
				if (!response.headersSent) response.writeHead(502);
				response.end();
			});
		});
		toolServer.on("upgrade", (request, socket, head) => {
			handleToolFrameUpgrade(request, socket, head).catch((error) => {
				console.error(error);
				socket.destroy();
			});
		});
		return toolServer;
	};
	const toolFrameServer = createToolFrameServer();
	const toolFrameServerV6 = createToolFrameServer();

	/**
	 * Listen on the last launch's port, or any free one when it is taken.
	 *
	 * @param httpServer - The server.
	 * @param preferred - The saved port, or null for any.
	 * @returns The port it bound.
	 */
	const listenOnSaved = async (
		httpServer: Server,
		preferred: number | null,
	): Promise<number> => {
		try {
			return await listen(httpServer, preferred ?? 0);
		} catch {
			return listen(httpServer, 0);
		}
	};

	/**
	 * Listen for tool views on 127.0.0.1 and ::1, on one port. When ::1 has
	 * that port taken, both move to a free one; a machine without IPv6 keeps
	 * 127.0.0.1 only.
	 *
	 * @param preferred - The saved port, or null for any.
	 * @returns The port both bound.
	 */
	const listenForToolFrames = async (
		preferred: number | null,
	): Promise<number> => {
		for (const attempt of [preferred, 0, 0]) {
			const bound = await listenOnSaved(toolFrameServer, attempt);
			try {
				await listen(toolFrameServerV6, bound, "::1");
				return bound;
			} catch (error) {
				const code = (error as NodeJS.ErrnoException).code;
				if (code === "EADDRNOTAVAIL" || code === "EAFNOSUPPORT") {
					return bound;
				}
				await new Promise((resolveClose) =>
					toolFrameServer.close(resolveClose),
				);
			}
		}
		throw new Error(
			"No port is free for tool views on both 127.0.0.1 and ::1",
		);
	};

	// the last launch's port keeps the page's storage; a taken one costs it
	port = await listenOnSaved(server, preferredPort);
	appOrigin = `http://127.0.0.1:${port}`;
	toolFramePort = await listenForToolFrames(
		preferredToolFramePort === port ? null : preferredToolFramePort,
	);

	return {
		origin: appOrigin,
		port,
		toolFrameOrigin: `http://${TOOL_FRAME_HOST}:${toolFramePort}`,
		toolFramePort,
		disableToolFrames: () => {
			areToolFramesDisabled = true;
		},
		close: () =>
			new Promise((resolveClose) => {
				proxy.close();
				toolFrameServer.close();
				if (toolFrameServerV6.listening) toolFrameServerV6.close();
				server.close(() => resolveClose());
			}),
	};
};
