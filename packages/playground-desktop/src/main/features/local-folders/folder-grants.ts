import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import type { LocalFolderGrant } from "../../../contract/local-folders";

/** The file the attached folders are saved in, in Electron's `userData`. */
export const GRANTS_FILE_NAME = "smss-desktop-folders.json";

/** One attached folder, as main keeps it: with its path on the machine. */
export interface FolderGrant extends LocalFolderGrant {
	/** The folder's real path, symbolic links resolved. */
	readonly path: string;
}

/** What the grants file holds. */
interface GrantsFile {
	readonly version: 1;
	/** Each server's rooms (by the server's partition), each room's folders. */
	readonly servers: Readonly<
		Record<string, Readonly<Record<string, readonly FolderGrant[]>>>
	>;
}

const EMPTY: GrantsFile = { version: 1, servers: {} };

/** The folders attached to rooms, saved on every change. */
export interface FolderGrants {
	/**
	 * A room's folders.
	 *
	 * @param partition - The server's partition.
	 * @param roomId - The room.
	 */
	list(partition: string, roomId: string): readonly FolderGrant[];
	/**
	 * One attached folder.
	 *
	 * @param partition - The server's partition.
	 * @param roomId - The room.
	 * @param folderId - The attachment.
	 * @returns It, or undefined when it is not attached.
	 */
	get(
		partition: string,
		roomId: string,
		folderId: string,
	): FolderGrant | undefined;
	/**
	 * Attach folders to a room. A folder already attached keeps its grant;
	 * a name already taken gets a number, such as `notes (2)`.
	 *
	 * @param partition - The server's partition.
	 * @param roomId - The room.
	 * @param paths - The folders' real paths.
	 * @returns The room's folders afterwards.
	 */
	add(
		partition: string,
		roomId: string,
		paths: readonly string[],
	): readonly FolderGrant[];
	/**
	 * Detach a folder from a room.
	 *
	 * @returns The room's folders afterwards.
	 */
	remove(
		partition: string,
		roomId: string,
		folderId: string,
	): readonly FolderGrant[];
	/**
	 * Forget every folder attached on a server, for a server the user removed.
	 *
	 * @returns The grants that were forgotten.
	 */
	forgetServer(partition: string): readonly FolderGrant[];
}

/**
 * Whether a value is a saved grant.
 *
 * @param value - Something read from the file.
 * @returns True for `{ id, name, path }`, all non-empty text.
 */
const isGrant = (value: unknown): value is FolderGrant => {
	if (typeof value !== "object" || value === null) return false;
	const grant = value as Record<string, unknown>;
	return (
		typeof grant.id === "string" &&
		grant.id.length > 0 &&
		typeof grant.name === "string" &&
		grant.name.length > 0 &&
		typeof grant.path === "string" &&
		grant.path.length > 0
	);
};

/**
 * Read the grants file, keeping only what is well formed. Anything else, a
 * missing file included, is no grants.
 *
 * @param text - The file's text.
 * @returns The grants.
 */
export const parseGrantsFile = (text: string): GrantsFile => {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		return EMPTY;
	}
	if (typeof raw !== "object" || raw === null) return EMPTY;
	const servers = (raw as { servers?: unknown }).servers;
	if (typeof servers !== "object" || servers === null) return EMPTY;

	const parsed: Record<string, Record<string, FolderGrant[]>> = {};
	for (const [partition, rooms] of Object.entries(servers)) {
		if (typeof rooms !== "object" || rooms === null) continue;
		for (const [roomId, grants] of Object.entries(rooms)) {
			if (!Array.isArray(grants)) continue;
			const valid = grants.filter(isGrant).map(({ id, name, path }) => ({
				id,
				name,
				path,
			}));
			if (valid.length > 0) {
				parsed[partition] = { ...parsed[partition], [roomId]: valid };
			}
		}
	}
	return { version: 1, servers: parsed };
};

/**
 * A name for a folder that no other folder of the room has.
 *
 * @param path - The folder.
 * @param taken - The room's names so far.
 * @returns Its own name, or it with a number.
 */
const uniqueName = (path: string, taken: ReadonlySet<string>): string => {
	const base = basename(path) || path;
	if (!taken.has(base)) return base;
	let count = 2;
	while (taken.has(`${base} (${count})`)) count++;
	return `${base} (${count})`;
};

/**
 * Open the grants file in a folder, normally Electron's `userData`.
 *
 * @param folder - The folder that holds {@link GRANTS_FILE_NAME}.
 * @returns The grants, saved atomically on every change.
 */
export const openFolderGrants = (folder: string): FolderGrants => {
	const path = join(folder, GRANTS_FILE_NAME);
	let file = EMPTY;
	try {
		file = parseGrantsFile(readFileSync(path, "utf8"));
	} catch {
		// first use: no file yet
	}

	// write a temporary file and rename it, so a crash never leaves half a file
	const write = (next: GrantsFile): void => {
		file = next;
		mkdirSync(dirname(path), { recursive: true });
		const temp = `${path}.tmp`;
		writeFileSync(temp, JSON.stringify(next, null, 2), "utf8");
		renameSync(temp, path);
	};

	const list = (partition: string, roomId: string): readonly FolderGrant[] =>
		file.servers[partition]?.[roomId] ?? [];

	const setRoom = (
		partition: string,
		roomId: string,
		grants: readonly FolderGrant[],
	): void => {
		const { [roomId]: _previous, ...otherRooms } =
			file.servers[partition] ?? {};
		const rooms =
			grants.length > 0
				? { ...otherRooms, [roomId]: grants }
				: otherRooms;
		const { [partition]: _server, ...otherServers } = file.servers;
		write({
			version: 1,
			servers:
				Object.keys(rooms).length > 0
					? { ...otherServers, [partition]: rooms }
					: otherServers,
		});
	};

	return {
		list,
		get: (partition, roomId, folderId) =>
			list(partition, roomId).find((grant) => grant.id === folderId),
		add: (partition, roomId, paths) => {
			const grants = [...list(partition, roomId)];
			const taken = new Set(grants.map((grant) => grant.name));
			for (const folderPath of paths) {
				if (grants.some((grant) => grant.path === folderPath)) continue;
				const name = uniqueName(folderPath, taken);
				taken.add(name);
				grants.push({ id: randomUUID(), name, path: folderPath });
			}
			setRoom(partition, roomId, grants);
			return grants;
		},
		remove: (partition, roomId, folderId) => {
			const grants = list(partition, roomId).filter(
				(grant) => grant.id !== folderId,
			);
			setRoom(partition, roomId, grants);
			return grants;
		},
		forgetServer: (partition) => {
			const rooms = file.servers[partition];
			if (!rooms) return [];
			const { [partition]: _server, ...otherServers } = file.servers;
			write({ version: 1, servers: otherServers });
			return Object.values(rooms).flat();
		},
	};
};
