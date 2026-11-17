/** The hosted SEMOSS server the app signs in to and forwards calls to. */
export interface ServerConfig {
	/** The server's origin, such as `https://semoss.example.com`. */
	readonly url: string;
	/** The deployed module's path, such as `/Monolith`. */
	readonly module: string;
}

/** The module path most SEMOSS servers deploy at. */
export const DEFAULT_MODULE = "/Monolith";

/** Hosts on this machine, the only ones a server may be reached over plain http. */
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Validate untrusted input (an IPC argument, the saved file, the connect form)
 * into a server config. A server is reached over https, or http on this
 * machine only, so a session cookie never travels in the clear.
 *
 * @param value - The input.
 * @returns The config: the URL reduced to its origin, the module trimmed.
 * @throws Error naming what is wrong.
 */
export const parseServerConfig = (value: unknown): ServerConfig => {
	if (typeof value !== "object" || value === null) {
		throw new Error("Server config must be an object");
	}
	const { url, module } = value as Record<string, unknown>;
	if (typeof url !== "string" || !url.trim()) {
		throw new Error("Enter the server's address");
	}

	let parsed: URL;
	try {
		parsed = new URL(url.trim());
	} catch {
		throw new Error("The server's address is not a URL");
	}
	const isLoopback = LOOPBACK_HOSTS.has(parsed.hostname);
	if (
		parsed.protocol !== "https:" &&
		!(parsed.protocol === "http:" && isLoopback)
	) {
		throw new Error("Use https, or http for a server on this machine");
	}

	const raw = typeof module === "string" ? module.trim() : "";
	// each segment is a plain path word; `.` and `..` would let the proxy
	// forward paths outside the module
	const modulePath = (raw || DEFAULT_MODULE).replace(/\/+$/, "");
	const segments = modulePath.split("/").slice(1);
	if (
		!modulePath.startsWith("/") ||
		segments.some((segment) => !/^[A-Za-z0-9._~-]+$/.test(segment)) ||
		segments.some((segment) => /^\.+$/.test(segment))
	) {
		throw new Error("The module path must look like /Monolith");
	}

	return { url: parsed.origin, module: modulePath };
};

/**
 * Validate one address the user typed, such as
 * `https://semoss.example.com/team/Monolith`, into a server config: its
 * origin, and its path as the module. An address with no path gets the
 * default module.
 *
 * @param address - The address.
 * @returns The config.
 * @throws Error naming what is wrong, as {@link parseServerConfig} does.
 */
export const parseServerAddress = (address: unknown): ServerConfig => {
	if (typeof address !== "string" || !address.trim()) {
		throw new Error("Enter the server's address");
	}
	let parsed: URL;
	try {
		parsed = new URL(address.trim());
	} catch {
		throw new Error("The server's address is not a URL");
	}
	// a query or fragment is not part of where the server lives
	const path = parsed.pathname.replace(/\/+$/, "");
	return parseServerConfig({
		url: parsed.origin,
		module: path || DEFAULT_MODULE,
	});
};

/**
 * The one address a server config stands for, as the user types it.
 *
 * @param server - The config.
 * @returns Its origin and module together.
 */
export const formatServerAddress = (server: ServerConfig): string =>
	`${server.url}${server.module}`;

/**
 * Whether two configs are the same server: the same origin and module. Each
 * saved server is one of these, with its own sign in.
 *
 * @param a - One config.
 * @param b - The other.
 * @returns True for the same server.
 */
export const isSameServer = (a: ServerConfig, b: ServerConfig): boolean =>
	a.url === b.url && a.module === b.module;

/**
 * Whether a request path belongs to the server's module, which the app
 * forwards to the server.
 *
 * @param path - The request's path, with any query.
 * @param module - The module path.
 * @returns True for the module itself and anything under it.
 */
export const isModulePath = (path: string, module: string): boolean =>
	path === module ||
	path.startsWith(`${module}/`) ||
	path.startsWith(`${module}?`);
