import { type Session, session } from "electron";
import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { ServerConfig } from "../../../contract/server-connection";
import { routeSignInsThroughApp } from "../auth/sign-in-redirect";
import { handleDownloads } from "../downloads/downloads";

/** The browser sessions the app's servers sign in with. */
export interface ServerSessions {
	/**
	 * The session for a partition, set up on first use: sign ins come back
	 * through the app, and downloads open the save dialog.
	 *
	 * @param partition - The server's partition, or null before any server is
	 * saved: the default session, which only shows the connect screen.
	 * @returns The session.
	 */
	get: (partition: string | null) => Session;
	/** Write every used session's cookies to disk, before quitting. */
	flush: () => Promise<void>;
}

/**
 * Delete the storage folders of servers that are no longer saved. A forgotten
 * server's session is emptied at once, but Electron keeps its folder while the
 * app runs; this removes it on the next launch, before any session opens.
 * Only the app's own `Partitions/server-*` folders are touched.
 *
 * @param userDataFolder - Electron's `userData` folder.
 * @param partitions - The saved servers' partitions.
 */
export const removeUnusedPartitions = (
	userDataFolder: string,
	partitions: readonly string[],
): void => {
	const folder = join(userDataFolder, "Partitions");
	let names: string[];
	try {
		names = readdirSync(folder);
	} catch {
		return; // no server has had its own partition yet
	}
	// `persist:server-<uuid>` is stored in the folder `server-<uuid>`
	const kept = new Set(
		partitions.map((partition) => partition.replace(/^persist:/, "")),
	);
	for (const name of names) {
		if (name.startsWith("server-") && !kept.has(name)) {
			rmSync(join(folder, name), { recursive: true, force: true });
		}
	}
};

/**
 * Keep one browser session per saved server. Cookies and storage live in the
 * session, so each server keeps its own sign in and nothing crosses over.
 *
 * @param appOrigin - The app's origin.
 * @param getServer - The server in use, which sign ins are routed to.
 * @returns The sessions.
 */
export const createServerSessions = (
	appOrigin: string,
	getServer: () => ServerConfig | null,
): ServerSessions => {
	const used = new Set<Session>();

	return {
		get: (partition) => {
			const serverSession = partition
				? session.fromPartition(partition)
				: session.defaultSession;
			if (!used.has(serverSession)) {
				routeSignInsThroughApp(serverSession, getServer, appOrigin);
				handleDownloads(serverSession);
				used.add(serverSession);
			}
			return serverSession;
		},
		flush: async () => {
			await Promise.all(
				[...used].map((item) => item.cookies.flushStore()),
			);
		},
	};
};
