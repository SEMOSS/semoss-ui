import type { ServerCheckResult } from "../../../contract/ipc-contract";
import type { ServerConfig } from "../../../contract/server-connection";

const CHECK_TIMEOUT_MS = 10_000;

/**
 * Ask a server for its SEMOSS config, without cookies, to tell a SEMOSS server
 * from a wrong address before the app commits to it.
 *
 * @param server - The server to check.
 * @param fetchImpl - The fetch to use; Node's by default.
 * @returns Whether it answered as a SEMOSS server, and why not when it did not.
 */
export const checkServer = async (
	server: ServerConfig,
	fetchImpl: typeof fetch = fetch,
): Promise<ServerCheckResult> => {
	const url = `${server.url}${server.module}/api/config`;
	try {
		const response = await fetchImpl(url, {
			redirect: "manual",
			signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
			headers: { Accept: "application/json" },
		});
		if (!response.ok) {
			return {
				ok: false,
				message: `The server answered ${response.status} at ${url}`,
			};
		}
		const body: unknown = await response.json().catch(() => null);
		if (typeof body !== "object" || body === null) {
			return { ok: false, message: `No SEMOSS config at ${url}` };
		}
		return { ok: true };
	} catch (error) {
		const reason =
			error instanceof Error && error.name === "TimeoutError"
				? "did not answer in time"
				: "could not be reached";
		return { ok: false, message: `The server ${reason}: ${url}` };
	}
};
