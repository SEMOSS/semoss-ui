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
import {
	DEFAULT_MODULE,
	isModulePath,
	type ServerConfig,
} from "../../../contract/server-connection";

/** The app's own origin, and the tool frame origin beside it, on this machine. */
export interface LocalServer {
	/** The origin the window loads, such as `http://127.0.0.1:4321`. */
	readonly origin: string;
	/** The port it listens on, saved so the next launch reuses it. */
	readonly port: number;
	/**
	 * The origin tool views are framed from, such as `http://127.0.0.1:4322`.
	 * It forwards only the server's module, and being another origin, a tool's
	 * page there cannot script the app's page or reach its bridge. Cookies
	 * ignore the port, so the page is still signed in.
	 */
	readonly toolFrameOrigin: string;
	/** The tool frame origin's port, saved so a tool's storage is kept. */
	readonly toolFramePort: number;
	/** Stop the proxy and both servers. */
	close: () => Promise<void>;
}

/** What {@link startLocalServer} serves and forwards. */
interface LocalServerOptions {
	/** The built renderer, served in production. */
	readonly rootDir: string;
	/** In development, the renderer's dev server, which non-module requests go to. */
	readonly devUrl?: string;
	/** The port from the last launch; cookies and storage belong to it. */
	readonly preferredPort: number | null;
	/** The tool frame origin's port from the last launch; a tool's storage belongs to it. */
	readonly preferredToolFramePort: number | null;
	/** Read on every request, so a new server takes effect without a restart. */
	readonly getServer: () => ServerConfig | null;
	/** The page's Content-Security-Policy, set on production HTML. */
	readonly contentSecurityPolicy?: string;
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
 * Listen on 127.0.0.1 only, so nothing else on the network reaches the app.
 *
 * @param server - The server.
 * @param port - The port, or 0 for any free one.
 * @returns The port it bound.
 */
const listen = (server: Server, port: number): Promise<number> =>
	new Promise((resolvePort, reject) => {
		const onError = (error: Error) => reject(error);
		server.once("error", onError);
		server.listen(port, "127.0.0.1", () => {
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
 * forwards only the module, for tool views (see {@link LocalServer}).
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
}: LocalServerOptions): Promise<LocalServer> => {
	// module responses to the app's origin that run sandboxed there
	const sandboxed = new WeakSet<IncomingMessage>();
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
		const cookies = proxyRes.headers["set-cookie"];
		if (cookies) {
			proxyRes.headers["set-cookie"] = cookies.map(localizeCookie);
		}
		if (sandboxed.has(request)) {
			addPolicy(proxyRes.headers, MODULE_PAGE_SANDBOX);
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

	/**
	 * The server, when this request belongs to its module.
	 *
	 * @param url - The request's path, with any query.
	 * @returns The server to forward to, or null for anything else.
	 */
	const serverFor = (url = "/"): ServerConfig | null => {
		const server = getServer();
		return server && isModulePath(url, server.module) ? server : null;
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
				headers["Content-Security-Policy"] = contentSecurityPolicy;
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

	// tool views: the module and nothing else, never the app's own files
	const toolFrameServer = createServer((request, response) => {
		const target = serverFor(request.url);
		if (target) {
			proxy.web(request, response, { target: target.url });
			return;
		}
		if (refuseUnsavedModule(request, response)) {
			return;
		}
		response.writeHead(404).end();
	});

	toolFrameServer.on("upgrade", (request, socket, head) => {
		const target = serverFor(request.url);
		if (target) {
			proxy.ws(request, socket, head, { target: target.url });
			return;
		}
		socket.destroy();
	});

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

	// the last launch's port keeps its cookies; a taken one costs a sign in
	const port = await listenOnSaved(server, preferredPort);
	const toolFramePort = await listenOnSaved(
		toolFrameServer,
		preferredToolFramePort === port ? null : preferredToolFramePort,
	);

	return {
		origin: `http://127.0.0.1:${port}`,
		port,
		toolFrameOrigin: `http://127.0.0.1:${toolFramePort}`,
		toolFramePort,
		close: () =>
			new Promise((resolveClose) => {
				proxy.close();
				toolFrameServer.close();
				server.close(() => resolveClose());
			}),
	};
};
