import type { ServerOptions } from "vite";
import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";

/**
 * Uses a local HTTPS origin so development can share the existing backend's
 * Microsoft session cookie without changing its registered OAuth callback.
 */
export function collaborationDevServer(
	env: Record<string, string | undefined>,
	server: ServerOptions = {},
): ServerOptions {
	if (!env.SEMOSS_DEV_ORIGIN) {
		return server;
	}

	const origin = new URL(env.SEMOSS_DEV_ORIGIN);
	if (
		origin.protocol !== "https:" ||
		origin.username ||
		origin.password ||
		origin.pathname !== "/" ||
		origin.search ||
		origin.hash
	) {
		throw new Error(
			"SEMOSS_DEV_ORIGIN must be an HTTPS origin without a path.",
		);
	}

	const pfxPath = env.SEMOSS_DEV_PFX;
	if (!pfxPath || !isAbsolute(pfxPath)) {
		throw new Error(
			"SEMOSS_DEV_PFX must be an absolute path to a local PKCS12 certificate.",
		);
	}

	const port = origin.port ? Number(origin.port) : 443;
	return {
		...server,
		host: "127.0.0.1",
		port,
		strictPort: true,
		origin: origin.origin,
		allowedHosts: [origin.hostname],
		https: {
			pfx: readFileSync(pfxPath),
			passphrase: env.SEMOSS_DEV_PASSPHRASE,
		},
		hmr: {
			protocol: "wss",
			host: origin.hostname,
			clientPort: port,
		},
	};
}
