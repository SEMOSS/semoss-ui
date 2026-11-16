/** The hosted SEMOSS server the app signs in to and forwards calls to. */
export interface ServerConfig {
	/** The server's origin, such as `https://semoss.example.com`. */
	readonly url: string;
	/** The deployed module's path, such as `/Monolith`. */
	readonly module: string;
}

/** The module path most SEMOSS servers deploy at. */
export const DEFAULT_MODULE = "/Monolith";

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
