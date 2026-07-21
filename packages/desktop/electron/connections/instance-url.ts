/**
 * `instanceUrl` isn't always a bare origin — real deployments often live
 * under a base path (e.g. `https://host.example.com/cfg-ai-dev`, with
 * Monolith at `.../cfg-ai-dev/Monolith`). `new URL(instanceUrl).pathname`
 * carries that base path; naively rebuilding a request/navigation URL from
 * just `protocol`/`hostname`/`port` silently drops it. Both
 * browser-login.ts and static-server.ts need this, so it lives here once.
 */

/** `instanceUrl`'s own path prefix, trailing slash stripped (`""` for a bare origin). */
export function instanceBasePath(instanceUrl: string): string {
	return new URL(instanceUrl).pathname.replace(/\/+$/, "");
}

/**
 * Combines `instanceUrl` (however it's typed in — trailing slash or not)
 * with `modulePath` into one correct URL, without a double slash and
 * without losing `instanceUrl`'s own base path.
 */
export function joinInstanceUrl(
	instanceUrl: string,
	modulePath: string,
): string {
	const trimmedBase = instanceUrl.replace(/\/+$/, "");
	const normalizedModule = modulePath.startsWith("/")
		? modulePath
		: `/${modulePath}`;
	return `${trimmedBase}${normalizedModule}`;
}
