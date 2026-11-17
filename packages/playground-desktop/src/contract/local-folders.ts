/** A folder attached to a room, as the page sees it: never its path on the machine. */
export interface LocalFolderGrant {
	/** The attachment's id, the same across restarts. */
	readonly id: string;
	/** The folder's name, unique among the room's folders. */
	readonly name: string;
}

/** Which attached folder a file call works in. */
export interface LocalFolderRef {
	readonly roomId: string;
	readonly folderId: string;
}

/** One entry in an attached folder, with a path as the explorer has it (`/` is the folder). */
export interface LocalFileEntry {
	readonly name: string;
	readonly path: string;
	/** Set for a folder; anything else is a file. */
	readonly type?: "directory";
	/** Size in bytes. */
	readonly size?: number;
	/** When it last changed, as an ISO date. */
	readonly lastModified?: string;
}

/**
 * Whether a value names an attached folder. The page's arguments arrive
 * untyped, so every file call checks its reference with this.
 *
 * @param value - The argument.
 * @returns True for `{ roomId, folderId }` with both non-empty.
 */
export const isLocalFolderRef = (value: unknown): value is LocalFolderRef =>
	typeof value === "object" &&
	value !== null &&
	typeof (value as LocalFolderRef).roomId === "string" &&
	(value as LocalFolderRef).roomId.length > 0 &&
	typeof (value as LocalFolderRef).folderId === "string" &&
	(value as LocalFolderRef).folderId.length > 0;
