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

/** The app's own origin, on this machine. */
export interface LocalServer {
	readonly origin: string;
	readonly port: number;
	close: () => Promise<void>;
}

interface LocalServerOptions {
	/** The built renderer, served in production. */
	readonly rootDir: string;
	/** In development, the renderer's dev server, which non-module requests go to. */
	readonly devUrl?: string;
	/** The port from the last launch; cookies and storage belong to it. */
	readonly preferredPort: number | null;
	/** Read on every request, so a new server takes effect without a restart. */
	readonly getServer: () => ServerConfig | null;
	/** The page's Content-Security-Policy, set on production HTML. */
	readonly contentSecurityPolicy?: string;
}

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
 * cookies, and sockets reach the hosted server unchanged.
 *
 * @param options - Where the renderer is and which server to forward to.
 * @returns The running server.
 */
export const startLocalServer = async ({
	rootDir,
	devUrl,
	preferredPort,
	getServer,
	contentSecurityPolicy,
}: LocalServerOptions): Promise<LocalServer> => {
	const proxy = createProxyServer({
		changeOrigin: true,
		ws: true,
		secure: true,
		// a redirect to the server itself comes back to this origin
		autoRewrite: true,
		protocolRewrite: "http",
		cookieDomainRewrite: { "*": "" },
	});
	proxy.on("proxyRes", (proxyRes) => {
		const cookies = proxyRes.headers["set-cookie"];
		if (cookies) {
			proxyRes.headers["set-cookie"] = cookies.map(localizeCookie);
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

	/** The server, when this request belongs to its module. */
	const serverFor = (url = "/"): ServerConfig | null => {
		const server = getServer();
		return server && isModulePath(url, server.module) ? server : null;
	};

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

	const server = createServer((request, response) => {
		const target = serverFor(request.url);
		if (target) {
			proxy.web(request, response, { target: target.url });
			return;
		}
		// before a server is saved, the chat's calls have nowhere to go
		if (!getServer() && isModulePath(request.url ?? "/", DEFAULT_MODULE)) {
			response.writeHead(503, { "Content-Type": "text/plain" });
			response.end("No SEMOSS server is set up yet");
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

	// the last launch's port keeps its cookies; a taken one costs a sign in
	let port: number;
	try {
		port = await listen(server, preferredPort ?? 0);
	} catch {
		port = await listen(server, 0);
	}

	return {
		origin: `http://127.0.0.1:${port}`,
		port,
		close: () =>
			new Promise((resolveClose) => {
				proxy.close();
				server.close(() => resolveClose());
			}),
	};
};
